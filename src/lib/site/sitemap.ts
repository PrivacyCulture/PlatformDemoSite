// Every indexable address on the site, read from the same content the pages are drawn from, so
// a page archived in the CMS leaves the sitemap the moment it leaves the site and a page created
// there joins it. The 404 page is not a page and is left out; so is /demo-booked, a redirect.

import { customPages } from '$lib/content';
import { platformSpecs } from '$lib/journey/content';
import { isArchived } from '$lib/site/archive';
import { visibleProblems } from '$lib/site/problems';

export const STATIC_PATHS = ['/', '/platform', '/pricing', '/faq', '/trust', '/dpa', '/demo', '/cookie-notice', '/privacy-policy'];

export function sitemapPaths(): string[] {
	const paths = [
		...STATIC_PATHS,
		...platformSpecs().map((spec) => spec.href),
		...visibleProblems().map((p) => p.href),
		...customPages.map((p) => `/${p.slug}`)
	];
	const seen = new Set<string>();
	return paths.filter((p) => {
		if (!p || isArchived(p) || seen.has(p)) return false;
		seen.add(p);
		return true;
	});
}
