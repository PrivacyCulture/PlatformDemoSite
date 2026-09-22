import { error } from '@sveltejs/kit';
import { platformSpecBySlug } from '$lib/journey/content';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	// Content is set by the root layout load; it must have run before reading it.
	await parent();
	const spec = platformSpecBySlug(params.slug);
	if (!spec) error(404, 'Spec not found');
	return { spec };
};
