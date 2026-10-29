import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { contentStore } from '$lib/server/content-store';
import { isLikelyRobot, pageViewPath } from '$lib/site/page-view';
import type { RequestHandler } from './$types';

/**
 * One page view from this site's own pages, passed on to Sorted (POST /api/platform-hits) with
 * the shared content token. Same-origin only — the token never reaches a browser.
 *
 * Only the LIVE site counts: the draft site shows unapproved copy to the people editing it, and
 * their views would swamp the real ones. The one exception is a local dev server talking to a
 * local Sorted, so counting can be tried on a laptop — it cannot reach production's figures. Nothing about the request (IP, user agent) is passed on
 * — the body forwarded is rebuilt from three fields, never the one received.
 *
 * Always 204: the page sent this with sendBeacon and nothing there reads a reply.
 */
export const POST: RequestHandler = async ({ request }) => {
	const done = new Response(null, { status: 204 });
	const url = (env.CONTENT_API_URL ?? '').trim().replace(/\/+$/, '');
	const token = (env.CONTENT_API_TOKEN ?? '').trim();
	const localTest = dev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url);
	if (!url || !token || (contentStore.channel() !== 'live' && !localTest)) return done;
	if (isLikelyRobot(request.headers.get('user-agent'))) return done;

	let body: Record<string, unknown>;
	try {
		const text = await request.text();
		if (text.length > 1024) return done;
		const parsed = JSON.parse(text);
		if (!parsed || typeof parsed !== 'object') return done;
		body = parsed as Record<string, unknown>;
	} catch {
		return done;
	}
	const path = typeof body.path === 'string' ? pageViewPath(body.path) : null;
	if (!path) return done;
	const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 120) : '';

	// Not awaited: the visitor's beacon is answered at once, and a slow or unreachable Sorted
	// costs a lost count, never a slow page.
	void fetch(`${url}/api/platform-hits`, {
		method: 'POST',
		headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
		body: JSON.stringify({ path, referrer, entry: body.entry === true }),
		signal: AbortSignal.timeout(5_000)
	})
		.then((res) => {
			if (!res.ok) console.warn(`[page-view] Sorted answered ${res.status}`);
		})
		.catch((e) => console.warn('[page-view] could not reach Sorted:', e instanceof Error ? e.message : e));
	return done;
};
