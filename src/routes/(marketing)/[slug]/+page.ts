import { error } from '@sveltejs/kit';
import { customPageBySlug } from '$lib/content';
import type { PageLoad } from './$types';

// Pages created in the CMS. Every page built into this repository is a static route, and
// SvelteKit always prefers a static route over this one, so nothing here can shadow them.
export const load: PageLoad = async ({ params, parent }) => {
	// Content is set by the root layout load; it must have run before reading it.
	await parent();
	const page = customPageBySlug(params.slug);
	if (!page) error(404, 'Page not found');
	// A plain copy: a load must never return a live() proxy or anything reached through one.
	return { page: structuredClone(page) };
};
