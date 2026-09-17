import { error } from '@sveltejs/kit';
import { platformSpecBySlug, platformSpecs } from '$lib/journey/content';
import type { EntryGenerator, PageLoad } from './$types';

/** Every spec page is generated at build time, whether or not something links to it. */
export const entries: EntryGenerator = () => platformSpecs().map((spec) => ({ slug: spec.slug }));

export const load: PageLoad = ({ params }) => {
	const spec = platformSpecBySlug(params.slug);
	if (!spec) error(404, 'Spec not found');
	return { spec };
};
