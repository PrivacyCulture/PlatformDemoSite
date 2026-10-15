// Article HTML for blog posts: paragraphs, two levels of heading, lists, quotes, bold, italic,
// links and images — and four marked blocks: a PANEL LIST (`<ol class="panels">`, drawn as numbered
// cards), a REPORT BOX (`<aside class="report">`, a boxed heading, list and note), a TIMELINE
// (`<aside class="timeline">`, the same shape drawn as dated steps) and a COMPARISON
// (`<aside class="compare">`, the same parts drawn as cards side by side, one per h3). Two more ride on classes: a
// CAPTION (`<p class="caption">`, small text that goes under an image) and ALIGNMENT on a paragraph
// or heading (`align-center|align-right|align-justify`, left being the default and carrying none;
// Quill's `ql-align-*` and an inline text-align are read as the same). A caption may be aligned too:
// `<p class="caption align-center">`. Nothing else; those class values are the only attributes the
// grammar carries besides href, src and alt. Pure; it imports only safeHref from inline-html.ts.
// Offline test: npx tsx scripts/test-article-html.ts
//
// THIS FILE IS DUPLICATED, BYTE FOR BYTE, IN THE S2 SITE (VideoAI: src/lib/site/article-html.ts),
// beside that repo's copy of inline-html.ts. Both repos assert its SHA-256, so a change to one
// side fails CI on both. Copy it across; never edit one side alone.
//
// The safety argument is structural, as in inline-html.ts, but over SERIALISED HTML rather than
// author text (an editor's innerHTML, where `&amp;` is one ampersand):
//
//   The input is cut into tags and text. EVERY text run has its `<` and `>` escaped, and every
//   tag is either dropped or REBUILT here from a closed list — attributes included, each one
//   escaped where it is built. So the output can only contain `<` characters this function
//   itself emitted.
//
// Unlike sanitizeInlineHtml, cleanArticleHtml IS idempotent: its own output re-cleans to itself.
// That is what lets the site call it at render time on a body Sorted already cleaned — the read
// side and the write side run the same function, and it costs nothing to run it twice.

import { safeHref } from './inline-html';

/** Nothing a person writes is this long; a paste that is gets cut, never parsed at length. */
export const MAX_ARTICLE_HTML_CHARS = 200_000;

// `ol.panels` and `aside.report` are tags of their own to the stack: what each may hold, and where
// it may sit, differs from a plain list or from any other block.
const BLOCKS = new Set(['p', 'h2', 'h3', 'ul', 'ol', 'ol.panels', 'li', 'blockquote', 'aside.report', 'aside.timeline', 'aside.compare']);
/** The boxed blocks. All hold the same things; they differ only in how the site draws them. */
const BOXES = ['aside.report', 'aside.timeline', 'aside.compare'];
const LISTS = ['ul', 'ol', 'ol.panels'];
const INLINE = new Set(['strong', 'em', 'a']);
/** What each container may hold directly. Inline content anywhere else opens a `<p>` (or `<li>`). */
const ALLOWED_IN: Record<string, ReadonlySet<string>> = {
	'': new Set(['p', 'h2', 'h3', 'ul', 'ol', 'ol.panels', 'blockquote', 'aside.report', 'aside.timeline', 'aside.compare']),
	blockquote: new Set(['p']),
	'aside.report': new Set(['p', 'h3', 'ul', 'ol']),
	'aside.timeline': new Set(['p', 'h3', 'ul', 'ol']),
	'aside.compare': new Set(['p', 'h3', 'ul', 'ol']),
	ul: new Set(['li']),
	ol: new Set(['li']),
	'ol.panels': new Set(['li']),
	p: new Set(['#text', 'strong', 'em', 'a', 'br', 'img']),
	// An image is allowed in a list item because the list's wrapper is an item: refusing it here
	// would make the list close the item, reopen one, and refuse it again, for ever.
	li: new Set(['#text', 'strong', 'em', 'a', 'br', 'img']),
	h2: new Set(['#text', 'strong', 'em', 'a', 'br']),
	h3: new Set(['#text', 'strong', 'em', 'a', 'br']),
	strong: new Set(['#text', 'em', 'a', 'br', 'img']),
	em: new Set(['#text', 'strong', 'a', 'br', 'img']),
	a: new Set(['#text', 'strong', 'em', 'br', 'img'])
};
/** Where inline content goes when it arrives in a container that cannot hold it. */
const WRAPPER: Record<string, string> = { '': 'p', blockquote: 'p', 'aside.report': 'p', 'aside.timeline': 'p', 'aside.compare': 'p', ul: 'li', ol: 'li', 'ol.panels': 'li' };

/** How a stack entry is written: the marked blocks carry their class, everything else is bare. */
const OPEN_TAG: Record<string, string> = { 'ol.panels': '<ol class="panels">', 'aside.report': '<aside class="report">', 'aside.timeline': '<aside class="timeline">', 'aside.compare': '<aside class="compare">' };
const openTag = (tag: string, cls = '') => OPEN_TAG[tag] ?? (cls ? `<${tag} class="${cls}">` : `<${tag}>`);

/** The blocks that may be aligned, and the alignments they may take (left is the default). */
const ALIGNABLE = new Set(['p', 'h2', 'h3']);
const ALIGNMENTS = ['center', 'right', 'justify'];
/** `align-center`, from our class, Quill's `ql-align-center` or an inline text-align; '' for left. */
function alignOf(attrs: string): string {
	const classes = (attr(attrs, 'class') ?? '').split(/\s+/);
	for (const a of ALIGNMENTS) if (classes.includes(`align-${a}`) || classes.includes(`ql-align-${a}`)) return `align-${a}`;
	const m = /text-align\s*:\s*(center|right|justify)/i.exec(attr(attrs, 'style') ?? '');
	return m ? `align-${m[1].toLowerCase()}` : '';
}

/** The classes a block opens with: `caption` (a paragraph only) and its alignment. */
function blockClasses(tag: string, attrs: string): string {
	if (!ALIGNABLE.has(tag)) return '';
	const caption = tag === 'p' && hasClass(attrs, 'caption');
	return [caption ? 'caption' : '', alignOf(attrs)].filter(Boolean).join(' ');
}

const closeTag = (tag: string) => `</${tag.split('.')[0]}>`;

/** Whether a class attribute names `want` — `class="ql-x panels"` counts, `class="panelsy"` does not. */
function hasClass(attrs: string, want: string): boolean {
	return (attr(attrs, 'class') ?? '').split(/\s+/).includes(want);
}

const RENAME: Record<string, string> = { b: 'strong', i: 'em', h1: 'h2', h4: 'h3', h5: 'h3', h6: 'h3', div: 'p' };
/** Dropped with everything inside them. */
const DROP_WITH_CONTENTS = new Set(['script', 'style', 'iframe', 'noscript', 'template', 'object', 'embed', 'svg', 'math', 'title', 'textarea', 'head', 'select', 'button']);

const ANY_TAG = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;

function escapeText(t: string): string {
	// A bare `&` that does not start a character reference becomes `&amp;`; an existing reference
	// is left alone, which is what makes a second pass a no-op.
	return t.replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const ENTITY: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&nbsp;': ' ' };
function decodeEntities(text: string): string {
	return text.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/g, (m) => ENTITY[m] ?? m);
}

function attr(attrs: string, name: string): string | null {
	const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(attrs);
	return m ? decodeEntities(m[1] ?? m[2] ?? m[3] ?? '') : null;
}

/** An image may come from this site (`/…`, never `//host`) or over https. Nothing else. */
export function safeImageSrc(raw: string): string | null {
	const s = String(raw).replace(/[\u0000- \u007f]/g, '').trim();
	if (!s || s.startsWith('//')) return null;
	if (s.startsWith('/')) return s;
	return /^https:\/\//i.test(s) ? s : null;
}

/**
 * Serialised HTML → article HTML in the grammar above. Idempotent. Block structure is repaired
 * rather than refused: a paragraph inside a paragraph closes the first, a list item outside a
 * list opens one, loose text at the top level becomes a paragraph, and empty blocks are removed.
 */
export function cleanArticleHtml(html: string): string {
	let s = String(html ?? '');
	if (s.length > MAX_ARTICLE_HTML_CHARS) s = s.slice(0, MAX_ARTICLE_HTML_CHARS);
	const out: string[] = [];
	const stack: string[] = [];
	let dropping = '';
	const top = () => stack[stack.length - 1] ?? '';
	const open = (tag: string, rendered: string) => {
		stack.push(tag);
		out.push(rendered);
	};
	const closeTop = () => out.push(closeTag(stack.pop() as string));
	/** Pop until `tag` may be placed here, opening the container's wrapper if it needs one. */
	const place = (tag: string): boolean => {
		// Bounded: every step either closes a tag or opens a wrapper that holds any inline
		// content, so a few steps always settle it. The bound is there in case a future edit
		// to ALLOWED_IN breaks that, so the result is a dropped tag rather than a hung request.
		for (let guard = 0; guard < 64; guard++) {
			const here = top();
			if (ALLOWED_IN[here]?.has(tag)) return true;
			const wrapper = WRAPPER[here];
			if (wrapper && !BLOCKS.has(tag)) {
				open(wrapper, openTag(wrapper));
				continue;
			}
			if (!stack.length) return false;
			closeTop();
		}
		return false;
	};
	const text = (t: string) => {
		if (!t) return;
		// Whitespace between blocks is formatting, not content.
		if (WRAPPER[top()] !== undefined && !t.trim()) return;
		if (!place('#text')) return;
		out.push(escapeText(t));
	};

	let last = 0;
	ANY_TAG.lastIndex = 0;
	for (let m = ANY_TAG.exec(s); m; m = ANY_TAG.exec(s)) {
		const between = s.slice(last, m.index);
		last = m.index + m[0].length;
		if (!dropping) text(between);
		if (!m[2]) continue; // a comment
		const closing = m[1] === '/';
		const raw = m[2].toLowerCase();
		if (dropping) {
			if (closing && raw === dropping) dropping = '';
			continue;
		}
		if (DROP_WITH_CONTENTS.has(raw)) {
			if (!closing && !/\/\s*$/.test(m[3] ?? '')) dropping = raw;
			continue;
		}
		let tag = RENAME[raw] ?? raw;
		// The marked blocks. An <aside> that is not a report box, a timeline or a comparison is not a block we
		// draw: it is dropped and its words kept, like any other unknown tag.
		if (tag === 'ol' && !closing && hasClass(m[3] ?? '', 'panels')) tag = 'ol.panels';
		if (tag === 'aside') {
			if (closing) {
				const i = Math.max(...BOXES.map((b) => stack.lastIndexOf(b)));
				if (i !== -1) while (stack.length > i) closeTop();
				continue;
			}
			// A box inside a box is not a thing: the outer one closes first.
			const kind = BOXES.find((b) => hasClass(m[3] ?? '', b.slice('aside.'.length))) ?? '';
			if (!kind) continue;
			tag = kind;
		}
		if (tag === 'br') {
			if (!closing && place('br')) out.push('<br>');
			continue;
		}
		if (tag === 'img') {
			if (closing) continue;
			const src = safeImageSrc(attr(m[3] ?? '', 'src') ?? '');
			if (src && place('img')) out.push(`<img src="${escapeAttr(src)}" alt="${escapeAttr(attr(m[3] ?? '', 'alt') ?? '')}">`);
			continue;
		}
		if (!BLOCKS.has(tag) && !INLINE.has(tag)) continue; // unknown tag: dropped, its text kept
		if (closing) {
			// `</ol>` closes a panel list as well as a plain one.
			const i = tag === 'ol' ? Math.max(stack.lastIndexOf('ol'), stack.lastIndexOf('ol.panels')) : stack.lastIndexOf(tag);
			if (i === -1) continue;
			while (stack.length > i) closeTop();
			continue;
		}
		if (tag === 'a') {
			if (stack.includes('a')) continue; // a link inside a link cannot be rendered
			const href = safeHref(attr(m[3] ?? '', 'href') ?? '');
			// A link nobody can follow is dropped and its words kept.
			if (href === null) continue;
			if (place('a')) open('a', `<a href="${escapeAttr(href)}">`);
			continue;
		}
		if (tag === 'li' && !LISTS.includes(top())) {
			// A list item with no list around it: close back to one, or open a list for it.
			const listAt = Math.max(...LISTS.map((l) => stack.lastIndexOf(l)));
			if (listAt !== -1) while (stack.length > listAt + 1) closeTop();
			else {
				if (!place('ul')) continue;
				open('ul', '<ul>');
			}
		}
		if (place(tag)) open(tag, openTag(tag, blockClasses(tag, m[3] ?? '')));
	}
	if (!dropping) text(s.slice(last));
	while (stack.length) closeTop();

	// Empty blocks (an editor's blank line is `<p><br></p>`) are removed until none are left.
	let result = out.join('');
	for (let prev = ''; prev !== result; ) {
		prev = result;
		result = result
			.replace(/<(p|h2|h3|li|strong|em|a)(?: (?:href|class)="[^"]*")?>(?:\s|<br>)*<\/\1>/g, '')
			.replace(/<(ul|ol|blockquote)>\s*<\/\1>/g, '')
			.replace(/<ol class="panels">\s*<\/ol>/g, '')
			.replace(/<aside class="(?:report|timeline|compare)">\s*<\/aside>/g, '')
			.replace(/(?:<br>)+(<\/(?:p|h2|h3|li)>)/g, '$1');
	}
	return result.trim();
}

/** What a template passes to `{@html}`. The same function: cleaning is idempotent. */
export function renderArticleHtml(html: string): string {
	return cleanArticleHtml(html);
}

/** The words alone — for search, read time, a meta description, JSON-LD. Blocks become breaks. */
export function articlePlainText(html: string): string {
	return decodeEntities(
		cleanArticleHtml(html)
			.replace(/<\/(?:p|h2|h3|li|blockquote|aside)>|<br>/g, '\n')
			.replace(/<[^>]+>/g, '')
	)
		.replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n)))
		.replace(/[ \t]+/g, ' ')
		.replace(/\n\s*\n+/g, '\n')
		.trim();
}

export function articleWordCount(html: string): number {
	const t = articlePlainText(html);
	return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

/** Minutes to read at 230 words a minute, never less than one for a post that has any words. */
export function readMinutes(html: string): number {
	const words = articleWordCount(html);
	return words ? Math.max(1, Math.ceil(words / 230)) : 0;
}

/** `About the ROPA` → `about-the-ropa`. */
export function headingSlug(text: string): string {
	return (
		text
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[̀-ͯ]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 60) || 'section'
	);
}

/** Every `<h2>` in order, with the id withHeadingIds gives it. Repeated headings get `-2`, `-3`. */
export function headingsOf(html: string): { id: string; text: string }[] {
	const seen = new Map<string, number>();
	const out: { id: string; text: string }[] = [];
	for (const m of cleanArticleHtml(html).matchAll(/<h2(?: class="[^"]*")?>([\s\S]*?)<\/h2>/g)) {
		const text = decodeEntities(m[1].replace(/<br>/g, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
		const base = headingSlug(text);
		const n = (seen.get(base) ?? 0) + 1;
		seen.set(base, n);
		out.push({ id: n === 1 ? base : `${base}-${n}`, text });
	}
	return out;
}

/** The cleaned body with an id on every `<h2>`, matching headingsOf — for "On this page". */
export function withHeadingIds(html: string): string {
	const ids = headingsOf(html);
	let i = 0;
	return cleanArticleHtml(html).replace(/<h2( class="[^"]*")?>/g, (_m, cls: string | undefined) => `<h2 id="${ids[i++]?.id ?? 'section'}"${cls ?? ''}>`);
}

/**
 * The cleaned body, readied for the page: in a panel list, an item that OPENS with bold text gets
 * that text marked as the card's heading; in a timeline, each item is split into its date and its
 * step (see timelineStep); a comparison is cut into its sides (see decorateCompare). Done here rather than with `strong:first-child` in CSS,
 * which also matches a bold word mid-item whenever the item starts with plain text. Runs after the
 * grammar has cleaned the body, so the one class it adds is the site's, not the author's.
 */
export function decorateArticleHtml(html: string): string {
	return html
		.replace(/<ol class="panels">([\s\S]*?)<\/ol>/g, (block) => block.replace(/<li><strong>/g, '<li><strong class="panel-title">'))
		.replace(/<aside class="timeline">([\s\S]*?)<\/aside>/g, (box) => decorateTimeline(box))
		.replace(/<aside class="compare">([\s\S]*?)<\/aside>/g, (_m, inner: string) => decorateCompare(inner));
}

/**
 * A comparison: every `<h3>` in it opens a SIDE, drawn as a card of its own beside the others —
 * the first tinted as the one that went well, the second as the one that did not, any more plain.
 * Text before the first heading is the comparison's introduction, across the full width. A
 * heading's text before its first `: ` (plain, at most 40 characters) is the side's small label —
 * "Company A: Kept a light, living RoPA" — by the timeline's date rule. Each list item is a row: its
 * opening bold text, or failing that its text before the first `: `, is the row's term, set above
 * the rest. A comparison with no heading in it is left as written.
 */
function decorateCompare(inner: string): string {
	const at = inner.search(/<h3[ >]/);
	if (at === -1) return `<aside class="compare">${inner}</aside>`;
	const sides = inner
		.slice(at)
		.split(/(?=<h3[ >])/)
		.map((side, i) => {
			const tone = i === 0 ? ' cmp-good' : i === 1 ? ' cmp-bad' : '';
			const labelled = side.replace(/^<h3( class="[^"]*")?>([^<:]{1,40}?):\s+/, (_h, cls: string | undefined, label: string) => `<span class="cmp-label">${label.trim()}</span><h3${cls ?? ''}>`);
			return `<div class="cmp-side${tone}">${labelled.replace(/<li>([\s\S]*?)<\/li>/g, (_li, item: string) => `<li>${compareRow(item)}</li>`)}</div>`;
		});
	return `<aside class="compare">${inner.slice(0, at)}<div class="cmp-sides">${sides.join('')}</div></aside>`;
}

/** One row of a side: its term marked, and a colon after a bold term dropped, as the term sits on its own line. */
function compareRow(item: string): string {
	if (/^<strong>/.test(item)) return item.replace(/^<strong>([\s\S]*?)<\/strong>:?/, (_s, term: string) => `<strong class="cmp-term">${term.replace(/:\s*$/, '')}</strong>`);
	const m = /^([^<:]{1,60}?):\s+/.exec(item);
	return m ? `<strong class="cmp-term">${m[1].trim()}</strong>${item.slice(m[0].length)}` : item;
}

/**
 * A paragraph that opens with a bullet somebody TYPED ("• 21 May 2025: …"), as text pasted from a
 * document arrives. Inside a timeline a run of them is the list of steps, so they are read as one;
 * otherwise the steps render as plain paragraphs with a bullet character on the front.
 */
const TYPED_BULLET = /^<p>((?:<(?:strong|em)>)*)[•·▪‣◦*–-]\s+/;

function decorateTimeline(box: string): string {
	// Typed-bullet paragraphs → one list, so a pasted timeline draws like a real one.
	let body = box.replace(/(?:<p>(?:<(?:strong|em)>)*[•·▪‣◦*–-]\s+[\s\S]*?<\/p>)+/g, (run) =>
		'<ul>' + run.replace(/<p>([\s\S]*?)<\/p>/g, (p) => '<li>' + p.replace(TYPED_BULLET, '<p>$1').slice(3, -4) + '</li>') + '</ul>'
	);
	body = body.replace(/<li>([\s\S]*?)<\/li>/g, (_m, inner: string) => timelineStep(inner));
	// The note after the steps: a short opening label ("UK readers:") is set in bold, as in the design.
	return body.replace(/(<\/(?:ul|ol)>[\s\S]*?<p>)([^<:]{1,30}:)(\s)/g, '$1<strong>$2</strong>$3');
}

/** A date label that says the step has not happened yet: drawn with a dashed bar. */
const PENDING_DATE = /^(?:still\s+pending|pending|expected|tbc|to\s+be\s+confirmed)\b/i;

/**
 * One timeline step. The text before the first colon is its date — plain text only, at most 40
 * characters, and the colon followed by a space, so "10:30" or a colon inside the bold title is
 * never mistaken for one. A step with no date is still drawn, just without a label. The item's
 * opening bold text, after the date, is its title.
 */
function timelineStep(inner: string): string {
	const m = /^([^<:]{1,40}?):\s+/.exec(inner);
	const date = m ? m[1].trim() : '';
	let rest = m ? inner.slice(m[0].length) : inner;
	if (/^<strong>/.test(rest)) rest = rest.replace(/^<strong>/, '<strong class="tl-title">');
	else {
		// No bold title written: the step's first sentence is its title, as long as it is short.
		const t = /^([^<]{1,90}?[.!?])(\s|$)/.exec(rest);
		if (t) rest = `<strong class="tl-title">${t[1]}</strong>${rest.slice(t[1].length)}`;
	}
	const pending = PENDING_DATE.test(date);
	return `<li class="tl-step${pending ? ' is-pending' : ''}">${date ? `<span class="tl-date">${date}</span>` : ''}${rest}</li>`;
}
