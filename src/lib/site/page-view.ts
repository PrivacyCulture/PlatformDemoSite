/**
 * Page-view counting, sent to Sorted (Website → Platform analytics). Pure: no `$app`, no `$env`.
 *
 * What leaves the browser is the address (no query string, no fragment), the HOST of the site the
 * visit came from, and whether this view started the visit. No cookie, no storage, no id: two
 * visitors cannot be told apart and one cannot be recognised coming back. The full referring URL
 * never leaves the browser — its query string can carry somebody's name or email address.
 *
 * Sorted re-checks all of this (src/lib/platform-page-views.ts there); this side only has to be
 * no looser than it.
 */

export interface PageViewBody {
	path: string;
	referrer: string;
	entry: boolean;
}

/** The address to count, or null for one that is not a page. */
export function pageViewPath(pathname: string): string | null {
	let p = pathname.split('#')[0].split('?')[0].replace(/\/{2,}/g, '/');
	if (!p.startsWith('/')) return null;
	if (p.length > 1) p = p.replace(/\/+$/, '');
	if (p.length > 300) return null;
	if (p.startsWith('/api/') || p.startsWith('/_app/')) return null;
	return p;
}

/**
 * The referring site's host, or '' for none, our own site, or anything unreadable.
 * `android-app://com.linkedin.android/` keeps its package name as the host; Sorted names it.
 */
export function referrerHost(referrer: string, ownHost: string): string {
	if (!referrer) return '';
	let host = '';
	try {
		host = new URL(referrer).hostname.toLowerCase();
	} catch {
		return '';
	}
	const bare = (h: string) => h.toLowerCase().replace(/^www\./, '');
	if (!host || bare(host) === bare(ownHost)) return '';
	return host.slice(0, 120);
}

/**
 * Automated visitors that run a page's script. Counting happens in the browser after the page is
 * shown, so plain crawlers and link previews never get this far; this catches the ones that do
 * render (headless browsers, Googlebot's renderer). Deliberately short: an over-eager list would
 * silently drop real people.
 */
export function isLikelyRobot(userAgent: string | null | undefined): boolean {
	if (!userAgent) return false;
	return /bot\b|bot\/|crawler|spider|headless|lighthouse|pagespeed|phantomjs|selenium|puppeteer|playwright|preview|facebookexternalhit|slurp/i.test(
		userAgent
	);
}

/** The body to send, or null when this view should not be counted. */
export function pageViewBody(opts: {
	pathname: string;
	status: number;
	entry: boolean;
	referrer: string;
}): PageViewBody | null {
	// An error page (a mistyped or scanned address) is not a view of anything on the site.
	if (opts.status !== 200) return null;
	const path = pageViewPath(opts.pathname);
	if (!path) return null;
	return { path, referrer: opts.referrer, entry: opts.entry };
}
