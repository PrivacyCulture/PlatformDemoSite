import { error } from '@sveltejs/kit';
import { isArchivedIn } from '$lib/site/archive';
import type { LayoutLoad } from './$types';

// A page archived in the CMS answers "not found" — on the server and on an in-app navigation
// alike, since reading `url` re-runs this load on every navigation. Home and /platform can never
// be archived (isArchivedIn refuses them), so this cannot take the site down.
export const load: LayoutLoad = async ({ parent, url }) => {
	const { content } = await parent();
	if (isArchivedIn(content.archivedPaths, url.pathname)) error(404, 'Page not found');
	return {};
};
