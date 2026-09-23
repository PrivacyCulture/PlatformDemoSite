// Inline HTML for CMS copy: bold, italic, a line break and a link, and nothing else.
// Pure and dependency-free — offline test: npx tsx scripts/test-inline-html.ts
//
// THIS FILE IS DUPLICATED, BYTE FOR BYTE, IN THE S2 SITE (VideoAI: src/lib/site/rich.ts).
// The site has no cheerio and hands its content to the browser, so both SSR and hydration
// have to render the same strings from the same rules. Two copies of one pure file beats two
// implementations; what stops them drifting is that both repos run the same case fixture and
// assert its SHA-256, so a change to one side fails CI on both.
//
// The safety argument is not "I enumerated the attacks". It is structural:
//
//   sanitizeInlineHtml escapes the ENTIRE input first — after which the string provably
//   contains no `<` at all — and then restores a closed set of literal token patterns. So the
//   output can only contain `<` characters this function itself emitted.
//
// There is no parser, so there is no mXSS re-parse surface and no foreign-content hazard from
// <svg> / <math> / <noscript>. The cost is that sanitizeInlineHtml is NOT idempotent: its own
// tags survive a second pass (escaping <strong> produces exactly the token the restore step
// looks for), but its own entities do not — `&amp;` escapes again to `&amp;amp;`. That is fine,
// because the read side never re-sanitises, it VERIFIES: renderInline IS idempotent, and it is
// the one a template calls.

/** Everything the grammar permits. `b` and `i` are accepted on input and written as strong/em. */
export const INLINE_ALLOWED_TAGS = ['strong', 'b', 'em', 'i', 'br', 'a'] as const;

/** The only tags the sanitiser ever EMITS. */
const EMITTED_TAGS = ['strong', 'em', 'br', 'a'] as const;

/** Entities the grammar recognises. Anything else makes a value plain text, not markup. */
const KNOWN_ENTITY = /&(?:amp|lt|gt|quot|apos|nbsp|#39);/y;

const ENTITY_VALUES: Record<string, string> = {
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&apos;': "'",
	'&#39;': "'",
	'&nbsp;': ' ',
	'&amp;': '&'
};

/** `& < >` only. Quotes are left alone: this output lands in element content, never in an
 *  attribute — the one attribute the grammar has is built here and escaped where it is built. */
export function escapeHtml(text: string): string {
	return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** The reverse, for the known set only — an unknown `&foo;` is left exactly as it is. */
function decodeEntities(text: string): string {
	return text.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/g, (m) => ENTITY_VALUES[m] ?? m);
}

function escapeAttr(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * The URL an `<a href>` may carry, or null. Whitespace and C0 controls are stripped BEFORE the
 * scheme is read — `jav&#x09;ascript:` is a real bypass and it only works on a reader that
 * tests the scheme first. Everything outside the four schemes is refused, `data:`, `blob:`,
 * `vbscript:` and protocol-relative `//host` included.
 */
export function safeHref(raw: string): string | null {
	const s = String(raw)
		.replace(/[\u0000- \u007f]/g, '')
		.trim();
	if (!s) return null;
	if (s.startsWith('//')) return null;
	if (s.startsWith('#') || s.startsWith('/') || s.startsWith('?')) return s;
	const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(s);
	if (!scheme) return null;
	const name = scheme[1].toLowerCase();
	return name === 'https' || name === 'http' || name === 'mailto' || name === 'tel' ? s : null;
}

// ---------------------------------------------------------------------------
// Balance

type Token = { kind: 'open' | 'close'; tag: string; text: string } | { kind: 'void'; tag: string; text: string };

const TOKEN = /<(\/?)(strong|em|a|br)(?:\s+href="([^"]*)")?\s*\/?>/g;

/**
 * Closes what was opened and drops what was never opened, over a string that already contains
 * only emitted tags. An unbalanced fragment would leak its formatting into the rest of the page,
 * so this is not tidying — it is the difference between bolding a word and bolding a column.
 */
function balanceInline(html: string): string {
	const out: string[] = [];
	const stack: string[] = [];
	let last = 0;
	TOKEN.lastIndex = 0;
	for (let m = TOKEN.exec(html); m; m = TOKEN.exec(html)) {
		out.push(html.slice(last, m.index));
		last = m.index + m[0].length;
		const closing = m[1] === '/';
		const tag = m[2];
		if (tag === 'br') {
			out.push('<br>');
			continue;
		}
		if (closing) {
			const i = stack.lastIndexOf(tag);
			if (i === -1) continue; // a close with nothing open — dropped, never rendered
			while (stack.length > i) out.push(`</${stack.pop()}>`);
			continue;
		}
		// A link inside a link is not a thing a browser can render; the inner one is dropped.
		if (tag === 'a' && stack.includes('a')) continue;
		stack.push(tag);
		out.push(tag === 'a' ? `<a href="${m[3] ?? ''}">` : `<${tag}>`);
	}
	out.push(html.slice(last));
	while (stack.length) out.push(`</${stack.pop()}>`);
	return out.join('');
}

// ---------------------------------------------------------------------------

/**
 * Author input → safe inline HTML. Escape everything, then restore a closed set of literal
 * token patterns, then balance. NOT idempotent — see the note at the top of this file.
 */
export function sanitizeInlineHtml(input: string): string {
	const escaped = escapeHtml(String(input));
	const restored = escaped
		.replace(/&lt;(strong|b)&gt;/gi, '<strong>')
		.replace(/&lt;\/(strong|b)&gt;/gi, '</strong>')
		.replace(/&lt;(em|i)&gt;/gi, '<em>')
		.replace(/&lt;\/(em|i)&gt;/gi, '</em>')
		.replace(/&lt;br\s*\/?&gt;/gi, '<br>')
		.replace(/&lt;\/a&gt;/gi, '</a>')
		.replace(/&lt;a\s+href=(?:"([^"]*)"|'([^']*)')\s*&gt;/gi, (_m, dq: string, sq: string) => {
			const href = safeHref(decodeEntities(dq ?? sq ?? ''));
			// A link nobody can follow is dropped, and its words are kept. Emitting the tag
			// without an href would leave a word styled as a link that goes nowhere.
			return href === null ? '' : `<a href="${escapeAttr(href)}">`;
		});
	return balanceInline(restored);
}

/**
 * Whether a stored string IS the shape this file emits. A grammar check — it rewrites nothing,
 * so "not safe" never means "damaged", only "treat it as the plain text it is".
 */
export function isSafeInlineHtml(html: string): boolean {
	const s = String(html);
	const stack: string[] = [];
	for (let i = 0; i < s.length; i++) {
		const ch = s[i];
		if (ch === '>') return false; // only ever emitted as part of a tag, consumed below
		if (ch === '&') {
			KNOWN_ENTITY.lastIndex = i;
			if (!KNOWN_ENTITY.test(s)) return false;
			i = KNOWN_ENTITY.lastIndex - 1;
			continue;
		}
		if (ch !== '<') continue;
		TOKEN.lastIndex = i;
		const m = TOKEN.exec(s);
		if (!m || m.index !== i) return false;
		const closing = m[1] === '/';
		const tag = m[2];
		if (tag === 'br') {
			if (closing || m[0] !== '<br>') return false;
		} else if (closing) {
			if (m[0] !== `</${tag}>`) return false;
			if (stack.pop() !== tag) return false;
		} else if (tag === 'a') {
			if (m[3] === undefined) return false;
			const href = decodeEntities(m[3]);
			if (safeHref(href) === null) return false;
			if (m[0] !== `<a href="${escapeAttr(safeHref(href) as string)}">`) return false;
			if (stack.includes('a')) return false;
			stack.push('a');
		} else {
			if (m[0] !== `<${tag}>`) return false;
			stack.push(tag);
		}
		i = TOKEN.lastIndex - 1;
	}
	return stack.length === 0;
}

/**
 * What a template passes to `{@html}`. Idempotent, and the reason no data migration is needed:
 * every value written before this existed fails the grammar, gets escaped, and renders exactly
 * as it does today.
 */
export function renderInline(value: string): string {
	const s = String(value ?? '');
	return isSafeInlineHtml(s) ? s : escapeHtml(s);
}

/**
 * The words alone — for a `<title>`, an `alt`, a `meta` description or JSON-LD, where markup is
 * meaningless at best and pollutes structured data at worst. A rendered string is often
 * rendered twice; the second place almost always wants this one.
 */
export function inlineToPlain(html: string): string {
	return decodeEntities(String(html ?? '').replace(TOKEN, (m) => (m === '<br>' ? ' ' : '')));
}

/**
 * Real HTML — a contenteditable's innerHTML — reduced to the permitted tags, keeping the text
 * of everything it drops.
 *
 * NOT the same job as sanitizeInlineHtml, and using that one here is a real bug: its input is
 * author text, where `&amp;` is five characters somebody typed. Here the input is already
 * serialised HTML, where `&amp;` is one ampersand — escaping it again doubles it every time
 * the field is opened, so a value would grow `&amp;amp;amp;` over a week of edits.
 *
 * A block tag becomes a line break rather than vanishing: a multi-line paste arrives as divs,
 * and dropping them outright would silently run the lines together on blur.
 */
export function restrictInlineHtml(html: string): string {
	const s = String(html);
	const ANY_TAG = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
	const out: string[] = [];
	let last = 0;
	// Serialised HTML has no bare `<` or `>` in a text node, so this is a no-op on good input
	// and a repair on anything that reached us another way.
	const text = (t: string) => t.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	for (let m = ANY_TAG.exec(s); m; m = ANY_TAG.exec(s)) {
		out.push(text(s.slice(last, m.index)));
		last = m.index + m[0].length;
		const name = (m[1] ?? '').toLowerCase();
		if (!name) continue; // a comment
		const closing = m[0].startsWith('</');
		if (name === 'strong' || name === 'b') out.push(closing ? '</strong>' : '<strong>');
		else if (name === 'em' || name === 'i') out.push(closing ? '</em>' : '<em>');
		else if (name === 'br') { if (!closing) out.push('<br>'); }
		else if (name === 'div' || name === 'p') { if (closing) out.push('<br>'); }
		else if (name === 'a') {
			if (closing) { out.push('</a>'); continue; }
			const hm = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(m[2] ?? '');
			const href = safeHref(decodeEntities(hm?.[1] ?? hm?.[2] ?? hm?.[3] ?? ''));
			// A link nobody can follow is dropped and its words kept; balanceInline then drops
			// the closing tag that no longer has an opening one.
			if (href !== null) out.push(`<a href="${escapeAttr(href)}">`);
		}
		// Everything else is dropped and its contents kept.
	}
	out.push(text(s.slice(last)));
	return balanceInline(out.join('').replace(/(?:<br>)+$/, ''));
}

/** Whether a value carries any markup at all — for a UI that wants to say so. */
export function hasInlineMarkup(value: string): boolean {
	const s = String(value ?? '');
	return isSafeInlineHtml(s) && EMITTED_TAGS.some((t) => s.includes(`<${t}`));
}
