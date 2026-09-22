import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	content: locals.content,
	contentMeta: locals.contentMeta
});
