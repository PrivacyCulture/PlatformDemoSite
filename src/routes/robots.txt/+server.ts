import type { RequestHandler } from './$types';

/**
 * Served by a route rather than a static file so it can name the sitemap at this site's own
 * address, and so the draft (preview) site — the same code under another hostname — refuses
 * every crawler instead of competing with the live site for the same words.
 */
export const GET: RequestHandler = ({ url, locals }) => {
	const draft = locals.contentMeta?.channel === 'draft';
	const body = draft
		? ['User-agent: *', 'Disallow: /', ''].join('\n')
		: ['User-agent: *', 'Disallow:', '', `Sitemap: ${url.origin}/sitemap.xml`, ''].join('\n');
	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': draft ? 'no-store' : 'public, max-age=3600'
		}
	});
};
