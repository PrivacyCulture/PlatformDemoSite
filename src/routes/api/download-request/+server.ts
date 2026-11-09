import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { contentStore } from '$lib/server/content-store';
import type { RequestHandler } from './$types';

/**
 * A Download form (added-sections.ts, 'download'): the visitor's name and email go to Sorted
 * (POST /api/platform-download) with the shared content token, which records the request and
 * answers with the file's address — the page never carries it. Same-origin only; the token never
 * reaches a browser, and the body passed on is rebuilt from the fields Sorted reads.
 *
 * The channel goes with it, so the dev site and the page builder's preview find the file in the
 * working copy (and their requests are marked as the dev site's in Sorted).
 */
export const POST: RequestHandler = async ({ request, url }) => {
	const origin = request.headers.get('origin');
	if (origin && origin !== url.origin) return json({ ok: false, message: 'Forbidden' }, { status: 403 });

	const base = (env.CONTENT_API_URL ?? '').trim().replace(/\/+$/, '');
	const token = (env.CONTENT_API_TOKEN ?? '').trim();
	if (!base || !token) return json({ ok: false, message: 'Downloads are not available right now. Please try again later.' }, { status: 503 });

	let body: Record<string, unknown>;
	try {
		const text = await request.text();
		if (text.length > 4096) return json({ ok: false, message: 'Please check the form.' }, { status: 413 });
		const parsed = JSON.parse(text);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
		body = parsed as Record<string, unknown>;
	} catch {
		return json({ ok: false, message: 'Please check the form.' }, { status: 400 });
	}
	// A box people cannot see: only a bot fills it. Refused before Sorted records anything.
	if (typeof body.website === 'string' && body.website.trim()) return json({ ok: false, message: 'Please try again.' }, { status: 400 });

	const str = (v: unknown) => (typeof v === 'string' ? v : '');
	try {
		const res = await fetch(`${base}/api/platform-download`, {
			method: 'POST',
			headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
			body: JSON.stringify({
				channel: contentStore.channel(),
				page: str(body.page),
				blockId: str(body.blockId),
				firstName: str(body.firstName),
				lastName: str(body.lastName),
				email: str(body.email),
				consent: body.consent === true
			}),
			signal: AbortSignal.timeout(15_000)
		});
		const answer = (await res.json().catch(() => null)) as Record<string, unknown> | null;
		if (!answer) return json({ ok: false, message: 'Something went wrong. Please try again.' }, { status: 502 });
		return json(answer, { status: res.status === 401 ? 503 : res.status });
	} catch (e) {
		console.warn('[download-request] could not reach Sorted:', e instanceof Error ? e.message : e);
		return json({ ok: false, message: 'Something went wrong. Please try again.' }, { status: 502 });
	}
};
