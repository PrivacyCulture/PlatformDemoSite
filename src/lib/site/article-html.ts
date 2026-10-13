// Article HTML for blog posts: paragraphs, two levels of heading, lists, quotes, bold, italic,
// links and images — and nothing else. Pure; it imports only safeHref from inline-html.ts.
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

const BLOCKS = new Set(['p', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote']);
const INLINE = new Set(['strong', 'em', 'a']);
/** What each container may hold directly. Inline content anywhere else opens a `<p>` (or `<li>`). */
const ALLOWED_IN: Record<string, ReadonlySet<string>> = {
	'': new Set(['p', 'h2', 'h3', 'ul', 'ol', 'blockquote']),
	blockquote: new Set(['p']),
	ul: new Set(['li']),
	ol: new Set(['li']),
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
const WRAPPER: Record<string, string> = { '': 'p', blockquote: 'p', ul: 'li', ol: 'li' };

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
	const closeTop = () => out.push(`</${stack.pop()}>`);
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
				open(wrapper, `<${wrapper}>`);
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
		const tag = RENAME[raw] ?? raw;
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
			const i = stack.lastIndexOf(tag);
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
		if (tag === 'li' && top() !== 'ul' && top() !== 'ol') {
			// A list item with no list around it: close back to one, or open a list for it.
			const listAt = Math.max(stack.lastIndexOf('ul'), stack.lastIndexOf('ol'));
			if (listAt !== -1) while (stack.length > listAt + 1) closeTop();
			else {
				if (!place('ul')) continue;
				open('ul', '<ul>');
			}
		}
		if (place(tag)) open(tag, `<${tag}>`);
	}
	if (!dropping) text(s.slice(last));
	while (stack.length) closeTop();

	// Empty blocks (an editor's blank line is `<p><br></p>`) are removed until none are left.
	let result = out.join('');
	for (let prev = ''; prev !== result; ) {
		prev = result;
		result = result
			.replace(/<(p|h2|h3|li|strong|em|a)(?: href="[^"]*")?>(?:\s|<br>)*<\/\1>/g, '')
			.replace(/<(ul|ol|blockquote)>\s*<\/\1>/g, '')
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
			.replace(/<\/(?:p|h2|h3|li|blockquote)>|<br>/g, '\n')
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
	for (const m of cleanArticleHtml(html).matchAll(/<h2>([\s\S]*?)<\/h2>/g)) {
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
	return cleanArticleHtml(html).replace(/<h2>/g, () => `<h2 id="${ids[i++]?.id ?? 'section'}">`);
}
