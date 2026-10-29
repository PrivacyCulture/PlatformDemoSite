import { json } from '@sveltejs/kit';
import { contentStore } from '$lib/server/content-store';
import { getTrackingConfig, trackingStatusSummary } from '$lib/server/tracking-config';
import type { RequestHandler } from './$types';

/**
 * Public health read for the CMS's "Ping" button. Holds no secrets — the LinkedIn partner ID and
 * which events are tracked are in the live site's page source anyway. The dev site loads no tag,
 * so it reports tracking as off whatever Sorted says.
 */
export const GET: RequestHandler = async () => {
	const tracking =
		contentStore.channel() === 'live' ? trackingStatusSummary(await getTrackingConfig()) : { linkedinPartnerId: '', events: [] };
	return json({ ...contentStore.status(), tracking }, { headers: { 'access-control-allow-origin': '*' } });
};
