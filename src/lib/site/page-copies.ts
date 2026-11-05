/**
 * Copies of the site's one-of-a-kind pages, made in Sorted (Website → Platform → Pages → Copy).
 *
 * A copy is a page added in Sorted (`customPages`) that carries `pageKind` — which page it is a
 * copy of — and that page's content as its own. It is drawn by the SAME component as the original
 * (src/lib/components/site/pages), and Sorted's page builder writes it back with the original's
 * apply function, so nothing about the page is lost in the copy. Keep `PAGE_COPY_KINDS` in step
 * with Sorted's `PAGE_COPY_KINDS` (src/lib/platform-page-copy.ts).
 */

export const PAGE_COPY_KINDS = ['platform', 'faq', 'pricing', 'trust', 'dpa', 'cookie-notice', 'privacy-policy'] as const;
export type PageCopyKind = (typeof PAGE_COPY_KINDS)[number];

/** Where the original's content lives under `pages`. */
export const PAGE_COPY_PAGES_KEY: Record<PageCopyKind, string> = {
	platform: 'platform',
	faq: 'faq',
	pricing: 'pricing',
	trust: 'trust',
	dpa: 'dpa',
	'cookie-notice': 'cookieNotice',
	'privacy-policy': 'privacyPolicy'
};

export function pageCopyKind(v: unknown): PageCopyKind | null {
	return typeof v === 'string' && (PAGE_COPY_KINDS as readonly string[]).includes(v) ? (v as PageCopyKind) : null;
}

const isPlain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * The copy's content over the original's: a key the copy lacks (one added to the site after the
 * copy was made) is filled from the original, so the page's component never reads a hole. Objects
 * merge key by key; a list or a value the copy has is the copy's, whole.
 */
export function withDefaults<T>(base: T, over: unknown): T {
	if (!isPlain(base) || !isPlain(over)) return (over === undefined ? base : over) as T;
	const out: Record<string, unknown> = { ...base };
	for (const [k, v] of Object.entries(over)) out[k] = k in base ? withDefaults((base as Record<string, unknown>)[k], v) : v;
	return out as T;
}
