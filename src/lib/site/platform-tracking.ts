// Ad conversion tracking for the Platform site: which events exist, and the IDs that map them
// to an ad platform. Edited in Sorted (Settings → APIs → Platform site), served to the site by
// /api/platform-tracking-config, obeyed by the site.
//
// THIS FILE IS SHARED BYTE FOR BYTE with the site (pcl-platform/src/lib/site/platform-tracking.ts)
// and both repos assert its SHA-256. The event list is the contract between them: Sorted offers a
// conversion ID only for an event the site knows how to fire. Change it in one, copy it to the other.
// No imports, so it runs anywhere.

export type TrackingEventKey = 'demo_booked' | 'demo_qualified' | 'demo_link_click';

export interface TrackingEvent {
	key: TrackingEventKey;
	label: string;
	firesWhen: string;
}

export const TRACKING_EVENTS: readonly TrackingEvent[] = [
	{
		key: 'demo_booked',
		label: 'Demo booked',
		firesWhen: 'A visitor confirms a time in the demo calendar and the booking succeeds.'
	},
	{
		key: 'demo_qualified',
		label: 'Demo form completed',
		firesWhen: 'A visitor passes the first step of the demo form, before choosing a time.'
	},
	{
		key: 'demo_link_click',
		label: 'Clicked through to the demo page',
		firesWhen: 'A visitor follows any link to /demo from another page on the site.'
	}
];

const EVENT_KEYS = new Set<string>(TRACKING_EVENTS.map((e) => e.key));

export function isTrackingEventKey(value: unknown): value is TrackingEventKey {
	return typeof value === 'string' && EVENT_KEYS.has(value);
}

export interface LinkedInTracking {
	/** The Insight Tag partner ID. '' = no tag. */
	partnerId: string;
	/** Conversion ID per event. An event with no entry is not reported to LinkedIn. */
	conversions: Partial<Record<TrackingEventKey, string>>;
}

export interface PlatformTracking {
	/** The kill switch. Off, the site loads no tag whatever else is set. */
	enabled: boolean;
	linkedin: LinkedInTracking;
}

export const EMPTY_PLATFORM_TRACKING: PlatformTracking = {
	enabled: false,
	linkedin: { partnerId: '', conversions: {} }
};

/** LinkedIn's IDs are plain numbers. Anything else is not one, whatever it looks like. */
export function isTrackingId(value: string): boolean {
	return /^\d{1,20}$/.test(value);
}

function idOrEmpty(value: unknown): string {
	const s = typeof value === 'number' && Number.isInteger(value) && value >= 0 ? String(value) : typeof value === 'string' ? value.trim() : '';
	return isTrackingId(s) ? s : '';
}

/**
 * Reads anything — a stored blob, a reply from Sorted, garbage — into a valid shape. Never throws.
 * An unreadable ID becomes '' (not tracked) and an unknown event is dropped: one bad value must
 * not take the whole tag down, and nothing here may ever send LinkedIn an ID nobody entered.
 */
export function normalisePlatformTracking(raw: unknown): PlatformTracking {
	if (!raw || typeof raw !== 'object') return { enabled: false, linkedin: { partnerId: '', conversions: {} } };
	const r = raw as Record<string, unknown>;
	const li = r.linkedin && typeof r.linkedin === 'object' ? (r.linkedin as Record<string, unknown>) : {};
	const rawConversions = li.conversions && typeof li.conversions === 'object' ? (li.conversions as Record<string, unknown>) : {};
	const conversions: Partial<Record<TrackingEventKey, string>> = {};
	for (const event of TRACKING_EVENTS) {
		const id = idOrEmpty(rawConversions[event.key]);
		if (id) conversions[event.key] = id;
	}
	return { enabled: r.enabled === true, linkedin: { partnerId: idOrEmpty(li.partnerId), conversions } };
}

export interface TrackingFormInput {
	enabled: boolean;
	partnerId: string;
	conversions: Partial<Record<string, string>>;
}

/**
 * What Settings saves. REFUSES rather than coerces: a mistyped ID silently dropped would leave a
 * conversion untracked behind a Saved message, and nobody would notice until the ad spend was
 * reported with no results against it.
 */
export function validatePlatformTracking(input: TrackingFormInput): { ok: true; value: PlatformTracking } | { ok: false; error: string } {
	const partnerId = input.partnerId.trim();
	if (partnerId && !isTrackingId(partnerId)) {
		return { ok: false, error: 'The LinkedIn partner ID is a number (Campaign Manager → Analyze → Insight Tag).' };
	}
	const conversions: Partial<Record<TrackingEventKey, string>> = {};
	const bad: string[] = [];
	for (const event of TRACKING_EVENTS) {
		const id = (input.conversions[event.key] ?? '').trim();
		if (!id) continue;
		if (!isTrackingId(id)) bad.push(event.label);
		else conversions[event.key] = id;
	}
	if (bad.length) return { ok: false, error: `A conversion ID is a number. Check: ${bad.join(', ')}.` };
	if (input.enabled && !partnerId) {
		return { ok: false, error: 'Add the LinkedIn partner ID before switching tracking on — without it no tag can load.' };
	}
	return { ok: true, value: { enabled: input.enabled, linkedin: { partnerId, conversions } } };
}

/** What the site is told: everything empty unless tracking is on AND a tag can load. */
export function trackingForSite(t: PlatformTracking): PlatformTracking {
	if (!t.enabled || !t.linkedin.partnerId) return { enabled: false, linkedin: { partnerId: '', conversions: {} } };
	return { enabled: true, linkedin: { partnerId: t.linkedin.partnerId, conversions: { ...t.linkedin.conversions } } };
}

/** The conversion ID to report for an event, or '' when it is not tracked. */
export function linkedInConversionId(t: PlatformTracking, event: TrackingEventKey): string {
	if (!t.enabled || !t.linkedin.partnerId) return '';
	return t.linkedin.conversions[event] ?? '';
}
