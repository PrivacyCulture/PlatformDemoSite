import { transcriptFor } from '$lib/server/transcript';
import { blogSummaries } from '$lib/site/blog';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => ({
	// Every post without its body: the browser needs the cards, not every article in full on
	// every page. An article's page hands its own body over in its own load.
	content: blogSummaries(locals.content),
	contentMeta: locals.contentMeta,
	// The default explainer's words, published as the VideoObject transcript on the pages that
	// show it. Read from the pinned snapshot, never the live() proxy — a load cannot return one.
	videoTranscript: await transcriptFor(locals.content?.site?.video?.captions)
});
