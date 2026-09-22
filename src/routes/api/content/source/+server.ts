import { json } from '@sveltejs/kit';
import { isAuthorised, sourceText, sourceSha256 } from '$lib/server/content-store';
import type { RequestHandler } from './$types';

/**
 * The content file this deployment was built with (`data/database.json`), for the CMS to sync
 * from — so a change made in this repo reaches Sorted without anyone downloading and uploading
 * a file. Token-gated like /api/content/refresh; it is the same copy the site already serves
 * publicly as pages, but there is no reason to publish it as one raw file.
 */
export const GET: RequestHandler = ({ request }) => {
	if (!isAuthorised(request.headers.get('authorization'))) {
		return json({ error: 'Unauthorised' }, { status: 401 });
	}
	return new Response(sourceText, {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			'x-content-sha256': sourceSha256
		}
	});
};
