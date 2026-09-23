// What a template calls to render CMS copy that may carry inline markup.
//
// `inline-html.ts` beside this file is a BYTE-IDENTICAL copy of Sorted's src/lib/inline-html.ts
// — the CMS's own sanitiser. Both repos run scripts/test-inline-html.ts against the same case
// fixture and assert the SHA-256 of both files, so a change on either side fails CI on both.
//
// Two rules, and getting either wrong is invisible until it is public:
//
//   rich(v)  → for {@html} in ELEMENT content. A no-op for anything outside the safe grammar,
//              so every string written before the CMS could format one renders exactly as it
//              always has. That is what makes it safe to route every prose binding through it.
//
//   plain(v) → for an ATTRIBUTE, a <title>, an alt, a meta description or JSON-LD. A string is
//              routinely rendered twice — an FAQ answer is a <p> AND acceptedAnswer in the
//              FAQPage graph — and the second place wants words, never tags.
//
// Do NOT sanitise centrally in content-store.ts. It is a perfect choke point and it is the
// wrong one: it would rewrite every string including alt and meta, turning `Trust & Security`
// into a visible `Trust &amp; Security` inside an attribute. Only the render site knows where
// a string is about to land.

import { renderInline, inlineToPlain } from './inline-html';

// The same handful of strings render on every request; the work is regex scanning, so a small
// cap is enough. Bounded so a long-running server cannot grow a map per distinct value.
const LIMIT = 512;
const richCache = new Map<string, string>();
const plainCache = new Map<string, string>();

function memo(cache: Map<string, string>, key: string, make: (v: string) => string): string {
	const hit = cache.get(key);
	if (hit !== undefined) return hit;
	const out = make(key);
	if (cache.size >= LIMIT) cache.clear();
	cache.set(key, out);
	return out;
}

/** For {@html} in element content. */
export function rich(value: string | null | undefined): string {
	return memo(richCache, String(value ?? ''), renderInline);
}

/** For an attribute, a title, an alt, a meta description or structured data. */
export function plain(value: string | null | undefined): string {
	return memo(plainCache, String(value ?? ''), (v) => inlineToPlain(renderInline(v)));
}

export { renderInline, inlineToPlain, isSafeInlineHtml, safeHref, escapeHtml } from './inline-html';
