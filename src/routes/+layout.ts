import { browser } from '$app/environment';
import { setContent } from '$lib/content/runtime';
import type { LayoutLoad } from './$types';

/**
 * Hands the server's content snapshot to the browser. Child loads that read
 * content must `await parent()` first. On the server each request already reads
 * its own snapshot via hooks.server.ts, so the shared fallback is left alone.
 */
export const load: LayoutLoad = ({ data }) => {
	if (browser) setContent(data.content);
	return data;
};
