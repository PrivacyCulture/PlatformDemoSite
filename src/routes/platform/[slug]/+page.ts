import { error } from '@sveltejs/kit';
import { platformSpecBySlug } from '$lib/journey/content';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const spec = platformSpecBySlug(params.slug);
	if (!spec) error(404, 'Spec not found');
	return { spec };
};
