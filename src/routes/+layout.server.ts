import { transcriptFor } from '$lib/server/transcript';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => ({
	content: locals.content,
	contentMeta: locals.contentMeta,
	// The default explainer's words, published as the VideoObject transcript on the pages that
	// show it. Read from the pinned snapshot, never the live() proxy — a load cannot return one.
	videoTranscript: await transcriptFor(locals.content?.site?.video?.captions)
});
