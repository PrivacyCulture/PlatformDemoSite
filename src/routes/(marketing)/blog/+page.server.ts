import { searchPosts, toSummary } from '$lib/site/blog';
import type { PageServerLoad } from './$types';

// The blog index. Search runs HERE, on the server, against the full posts — the browser is only
// ever handed summaries, and a search that could not see the article text would miss most of what
// people search for. `?q=` and `?tag=` come from a plain GET form, so search works without script.
export const load: PageServerLoad = async ({ locals, url }) => {
	const all = locals.content?.blogPosts ?? [];
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	const tag = (url.searchParams.get('tag') ?? '').trim().slice(0, 60);
	const searching = !!(q || tag);
	return {
		posts: all.map(toSummary),
		q,
		tag,
		results: searching ? searchPosts(all, q, tag).map(toSummary) : null
	};
};
