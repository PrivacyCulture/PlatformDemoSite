import { error } from '@sveltejs/kit';
import { isArchivedIn } from '$lib/site/archive';
import { relatedPosts, toSummary } from '$lib/site/blog';
import type { PageServerLoad } from './$types';

// One article. Read from the request's own content snapshot (locals), never the live() proxy, and
// handed over as plain copies — the only place a post's body reaches the browser.
export const load: PageServerLoad = async ({ locals, params }) => {
	const all = locals.content?.blogPosts ?? [];
	const post = all.find((p) => p.slug === params.slug);
	if (!post) error(404, 'Article not found');
	const problem = locals.content?.problems?.items.find((p) => p.slug === post.challenge);
	// A challenge whose page is archived is not offered: the card would link to a 404.
	const challenge =
		problem && !isArchivedIn(locals.content?.archivedPaths, problem.href)
			? { title: problem.title, href: problem.href, summary: problem.summary }
			: null;
	return {
		post: structuredClone(post),
		related: relatedPosts(post, all, 3).map(toSummary),
		challenge
	};
};
