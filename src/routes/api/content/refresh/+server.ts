import { json } from '@sveltejs/kit';
import { contentStore, isAuthorised } from '$lib/server/content-store';
import type { RequestHandler } from './$types';

/** Called by the CMS whenever content changes: `{ channel, reason, docKey? }`. */
export const POST: RequestHandler = async ({ request }) => {
	if (!isAuthorised(request.headers.get('authorization'))) {
		return json({ ok: false, error: 'Unauthorised' }, { status: 401 });
	}

	const body = (await request.json().catch(() => null)) as { channel?: unknown } | null;
	const channel = contentStore.channel();
	if (body && typeof body.channel === 'string' && body.channel !== channel) {
		return json(
			{ ok: false, error: `This site serves the "${channel}" channel`, channel },
			{ status: 409 }
		);
	}

	const snap = await contentStore.refresh();
	// A failed fetch keeps serving the last good content, which may still be
	// from the CMS, so `source` alone would report a failed refresh as a success.
	const { lastError } = contentStore.status();
	return json({
		ok: snap.source === 'cms' && lastError === null,
		channel,
		fetchedAt: snap.fetchedAt,
		source: snap.source,
		...(lastError ? { error: lastError } : {})
	});
};
