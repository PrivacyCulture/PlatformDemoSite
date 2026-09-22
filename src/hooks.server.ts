import type { Handle } from '@sveltejs/kit';
import { contentStore, runWithContent } from '$lib/server/content-store';

/**
 * Pins one content snapshot to the whole request, so a refresh that lands
 * mid-render cannot mix old and new copy on one page.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const snap = await contentStore.get();
	const channel = contentStore.channel();
	event.locals.content = snap.content;
	event.locals.contentMeta = { channel, source: snap.source, fetchedAt: snap.fetchedAt };

	const response = await runWithContent(snap.content, () => resolve(event));
	// Draft content changes by the minute and must never be cached by a CDN or browser.
	if (channel === 'draft') {
		try {
			response.headers.set('cache-control', 'no-store');
		} catch {
			/* immutable headers (e.g. a proxied fetch response) */
		}
	}
	return response;
};
