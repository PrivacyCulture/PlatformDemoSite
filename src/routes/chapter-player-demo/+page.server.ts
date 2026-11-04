// The chapter player's demo page. A tool for checking the player, not a page for visitors: it
// answers 404 on the live site, and is never in the sitemap (which is built from content).
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.contentMeta.channel === 'live') error(404, 'Not found');
	return {};
};
