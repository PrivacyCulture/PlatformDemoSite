import { pageUrl } from '$lib/site/schema';
import { sitemapPaths } from '$lib/site/sitemap';
import type { RequestHandler } from './$types';

/**
 * No <lastmod>: the content carries no per-page edit date, and a date that is really "when the
 * server started" tells a crawler to refetch everything for nothing.
 */
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: RequestHandler = ({ url, locals }) => {
	const draft = locals.contentMeta?.channel === 'draft';
	const body =
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
		sitemapPaths()
			.map((p) => `  <url><loc>${escape(pageUrl(url.origin, p))}</loc></url>`)
			.join('\n') +
		'\n</urlset>\n';
	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': draft ? 'no-store' : 'public, max-age=3600'
		}
	});
};
