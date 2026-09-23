import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { earliestBookableMs, slotIsBookable } from '$lib/booking-lead-time';
import {
	getAvailabilityPage,
	getBookingLeadDays,
	getMeetingBookInfo,
	HubSpotApiError,
	HubSpotConfigError,
	requireMeetingSlug,
	type AvailabilitySlot
} from '$lib/server/hubspot';

function pickPreferredDuration(
	byDuration: Record<string, { meetingDurationMillis: number; availabilities: AvailabilitySlot[] }>
): { durationMs: number; slots: AvailabilitySlot[] } {
	const entries = Object.values(byDuration);
	if (!entries.length) return { durationMs: 1_800_000, slots: [] };

	// Prefer ~25–30 minutes (1.5M–1.8M ms), else shortest advertised duration.
	const preferred =
		entries.find((e) => e.meetingDurationMillis >= 1_500_000 && e.meetingDurationMillis <= 1_800_000) ??
		entries.find((e) => e.meetingDurationMillis === 1_800_000) ??
		[...entries].sort((a, b) => a.meetingDurationMillis - b.meetingDurationMillis)[0];

	return {
		durationMs: preferred.meetingDurationMillis,
		slots: preferred.availabilities ?? []
	};
}

export const GET: RequestHandler = async ({ url }) => {
	const timezone = url.searchParams.get('timezone')?.trim();
	if (!timezone) {
		throw error(400, 'timezone query parameter is required');
	}

	const monthOffsetRaw = url.searchParams.get('monthOffset');
	const monthOffset = monthOffsetRaw ? Number(monthOffsetRaw) : 0;
	if (!Number.isFinite(monthOffset) || monthOffset < 0 || monthOffset > 6) {
		throw error(400, 'monthOffset must be an integer from 0 to 6');
	}

	try {
		const slug = requireMeetingSlug();
		const info =
			monthOffset === 0
				? await getMeetingBookInfo(slug, timezone, 0)
				: await getAvailabilityPage(slug, timezone, monthOffset);

		const byDuration = info.linkAvailability?.linkAvailabilityByDuration ?? {};
		const { durationMs, slots: allSlots } = pickPreferredDuration(byDuration);
		const durations = Object.keys(byDuration).map(Number).filter(Number.isFinite);

		// HubSpot happily offers a slot in an hour's time; the notice period set in Sorted is
		// what keeps those off the form. Cut against the VISITOR'S day, using the timezone they
		// chose above — see earliestBookableMs.
		//
		// The filtered slots are simply ABSENT: neither the notice period nor the cutoff is in
		// the response, by request. A visitor should read a quiet first day or two as "nothing
		// free then", not as a rule being applied to them, so do not add leadDays back here as
		// a courtesy to the UI — the payload is readable by anyone who opens the network tab.
		const leadDays = await getBookingLeadDays();
		const earliest = earliestBookableMs(Date.now(), leadDays, timezone);
		const slots = allSlots.filter((s) => slotIsBookable(s.startMillisUtc, earliest));

		return json({
			timezone,
			monthOffset,
			durationMs,
			durations,
			slots: slots.map((s) => ({
				start: s.startMillisUtc,
				end: s.endMillisUtc
			})),
			hasMore: Boolean(info.linkAvailability?.hasMore),
			isOffline: 'isOffline' in info ? Boolean(info.isOffline) : undefined
		});
	} catch (err) {
		if (err instanceof HubSpotConfigError) {
			return json({ error: err.message, code: 'not_configured' }, { status: 503 });
		}
		if (err instanceof HubSpotApiError) {
			console.error('[demo/availability]', err.status, err.body);
			return json(
				{ error: err.message, code: 'hubspot_error' },
				{ status: err.status >= 400 && err.status < 600 ? err.status : 502 }
			);
		}
		console.error('[demo/availability]', err);
		return json({ error: 'Failed to load availability', code: 'server_error' }, { status: 500 });
	}
};
