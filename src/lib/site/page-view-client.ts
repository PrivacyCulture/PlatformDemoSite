import { isLikelyRobot, pageViewBody, referrerHost } from './page-view';

/**
 * The visit's source, held in page memory for the life of this tab's visit — never in a cookie
 * or storage — so every page read after landing is credited to where the visit came from. A full
 * reload clears it; the referrer is then our own site, which reads as none.
 */
let visitSource: string | null = null;
/** Whether this tab's visit has had its landing view counted yet. */
let landed = false;
/** The address last counted, so a search typed into ?q= or a #fragment jump is not a new view. */
let lastPath = '';

/** Records one page view. Never throws, never waits: counting must not slow or break a page. */
export function recordPageView(opts: { pathname: string; status: number }): void {
	try {
		if (typeof navigator === 'undefined' || navigator.webdriver || isLikelyRobot(navigator.userAgent)) return;
		if (visitSource === null) visitSource = referrerHost(document.referrer, location.hostname);
		// The first view COUNTED is the landing, so a visit that opens on an error page still lands
		// on the first real page it reaches.
		const body = pageViewBody({ ...opts, entry: !landed, referrer: visitSource });
		if (!body || body.path === lastPath) return;
		landed = true;
		lastPath = body.path;
		const text = JSON.stringify(body);
		if (navigator.sendBeacon && navigator.sendBeacon('/api/page-view', text)) return;
		void fetch('/api/page-view', { method: 'POST', body: text, keepalive: true }).catch(() => {});
	} catch {
		/* counting is best-effort */
	}
}
