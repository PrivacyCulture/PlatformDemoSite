import { env } from '$env/dynamic/private';
import { normaliseLeadDays } from '../booking-lead-time';
import {
	selectMeetingFormFields,
	type MeetingFieldValues,
	type MeetingFormField
} from '../demo/meeting-form-fields';

const API_BASE = 'https://api.hubapi.com';
const SCHEDULER_BASE = `${API_BASE}/scheduler/2026-03/meetings/meeting-links`;

export class HubSpotConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'HubSpotConfigError';
	}
}

export class HubSpotApiError extends Error {
	status: number;
	body: unknown;

	constructor(status: number, message: string, body: unknown) {
		super(message);
		this.name = 'HubSpotApiError';
		this.status = status;
		this.body = body;
	}
}

/**
 * This site has no HubSpot connection of its own — no client secret, no refresh token and no
 * OAuth callback route — so by default it BORROWS Sorted's, over the same CONTENT_API_URL /
 * CONTENT_API_TOKEN pair it already uses for content. Sorted keeps that connection refreshed;
 * we only ever receive a short-lived access token.
 *
 * A HUBSPOT_ACCESS_TOKEN in the environment still wins, so a private app token can be dropped
 * in later with no code change and no network hop.
 */
let borrowed: { token: string; expiresAtMs: number } | null = null;

/** Cached to just short of expiry — the booking form would otherwise ask Sorted per request. */
const TOKEN_SAFETY_MARGIN_MS = 60_000;

/** Called when HubSpot rejects a borrowed token, so the next call fetches a fresh one. */
function forgetBorrowedToken(): void {
	borrowed = null;
}

async function borrowTokenFromSorted(): Promise<string> {
	if (borrowed && borrowed.expiresAtMs - Date.now() > TOKEN_SAFETY_MARGIN_MS) {
		return borrowed.token;
	}

	// SORTED_API_URL first so a site still serving content from its own data/database.json can
	// borrow a token without being forced onto the CMS as a side effect — CONTENT_API_URL being
	// set is what switches the content source over.
	const base = (env.SORTED_API_URL || env.CONTENT_API_URL)?.trim().replace(/\/$/, '');
	const secret = env.CONTENT_API_TOKEN?.trim();
	if (!base || !secret) {
		throw new HubSpotConfigError(
			'HubSpot is not configured. Set SORTED_API_URL (or CONTENT_API_URL) and CONTENT_API_TOKEN ' +
				'so this site can borrow Sorted\'s HubSpot connection, or set HUBSPOT_ACCESS_TOKEN directly.'
		);
	}

	let res: Response;
	try {
		res = await fetch(`${base}/api/platform-hubspot-token`, {
			headers: { Authorization: `Bearer ${secret}` }
		});
	} catch (cause) {
		// Unreachable Sorted is not a misconfiguration, so it must not read as one — say which
		// address failed, or this is indistinguishable from a wrong token.
		throw new HubSpotApiError(502, `Could not reach Sorted at ${base} for a HubSpot token.`, cause);
	}

	const body = await res.json().catch(() => null);
	if (!res.ok) {
		const message =
			body && typeof body === 'object' && 'error' in body
				? String((body as { error: unknown }).error)
				: `Sorted refused to lend a HubSpot token (${res.status}).`;
		// Pass Sorted's own wording through, but name WHICH thing is wrong — "Missing or wrong
		// platform token" alone leaves a reader guessing which of two systems to look in.
		if (res.status === 401) {
			throw new HubSpotConfigError(
				`Sorted rejected this site's platform token (${message}). CONTENT_API_TOKEN here must ` +
					'match the token in Sorted under Settings → APIs → Platform site.'
			);
		}
		// Sorted itself has no HubSpot connected — its wording already says so.
		if (res.status === 503) throw new HubSpotConfigError(message);
		throw new HubSpotApiError(res.status, message, body);
	}

	const token = (body as { accessToken?: unknown })?.accessToken;
	if (typeof token !== 'string' || !token) {
		throw new HubSpotApiError(502, 'Sorted returned no HubSpot access token.', body);
	}

	const expiresAtRaw = (body as { expiresAt?: unknown })?.expiresAt;
	const parsed = typeof expiresAtRaw === 'string' ? Date.parse(expiresAtRaw) : NaN;
	// An unreadable expiry is treated as nearly-expired rather than long-lived: asking again too
	// soon costs one request, whereas caching a dead token breaks the form until a restart.
	borrowed = {
		token,
		expiresAtMs: Number.isFinite(parsed) ? parsed : Date.now() + TOKEN_SAFETY_MARGIN_MS * 2
	};
	return token;
}

/**
 * The booking settings Sorted owns. Cached briefly rather than for the life of a token: this
 * carries no secret, and a notice period changed in Settings should take effect in minutes.
 *
 * A failure returns 0 — no restriction — on purpose. The alternative, refusing every slot when
 * Sorted is briefly unreachable, turns a settings outage into a form that shows nothing and
 * says nothing; showing the calendar HubSpot itself is willing to book is the safer failure.
 */
let demoConfig: { leadDays: number; fetchedAtMs: number } | null = null;
const DEMO_CONFIG_TTL_MS = 5 * 60_000;

export async function getBookingLeadDays(): Promise<number> {
	if (demoConfig && Date.now() - demoConfig.fetchedAtMs < DEMO_CONFIG_TTL_MS) {
		return demoConfig.leadDays;
	}

	const base = (env.SORTED_API_URL || env.CONTENT_API_URL)?.trim().replace(/\/$/, '');
	const secret = env.CONTENT_API_TOKEN?.trim();
	if (!base || !secret) return 0;

	try {
		const res = await fetch(`${base}/api/platform-demo-config`, {
			headers: { Authorization: `Bearer ${secret}` }
		});
		if (!res.ok) throw new Error(`status ${res.status}`);
		const body = (await res.json()) as { leadDays?: unknown };
		const leadDays = normaliseLeadDays(body?.leadDays);
		demoConfig = { leadDays, fetchedAtMs: Date.now() };
		return leadDays;
	} catch (err) {
		console.error('[demo] could not read booking settings from Sorted, continuing with no notice period', err);
		return 0;
	}
}

async function requireToken(): Promise<string> {
	const direct = env.HUBSPOT_ACCESS_TOKEN?.trim();
	if (direct) return direct;
	return borrowTokenFromSorted();
}

export function requireMeetingSlug(): string {
	const slug = env.HUBSPOT_MEETING_SLUG?.trim();
	if (!slug) {
		throw new HubSpotConfigError(
			'HubSpot is not configured. Set HUBSPOT_MEETING_SLUG in the environment.'
		);
	}
	return slug;
}

/**
 * A meeting link's slug can CONTAIN a slash ("alistair-cole/privacy-culture-discovery-demo" —
 * that is the value HubSpot's own /meeting-links listing returns), but it is still ONE path
 * segment to this API: the slash must be sent as %2F.
 *
 * Verified live against the portal: the encoded form returns availability, while passing the
 * slash through unencoded 404s at the routing layer before the slug is ever looked up — and
 * that 404 is an HTML error page, not the JSON "slug does not exist", which is how the two
 * failures are told apart.
 */
function encodeSlug(slug: string): string {
	return encodeURIComponent(slug);
}

async function hubspotFetch<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
	const token = await requireToken();
	const res = await fetch(`${API_BASE}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			...(init?.headers ?? {})
		}
	});

	const text = await res.text();
	let body: unknown = null;
	if (text) {
		try {
			body = JSON.parse(text);
		} catch {
			body = text;
		}
	}

	if (!res.ok) {
		// A borrowed token can be revoked or rotated before its stated expiry (someone
		// reconnects HubSpot in Sorted). Drop it and ask once more, rather than failing every
		// booking until this process restarts. Only once, and never for a token we were handed
		// directly by the environment — that one cannot be re-fetched.
		if (res.status === 401 && !isRetry && !env.HUBSPOT_ACCESS_TOKEN?.trim()) {
			forgetBorrowedToken();
			return hubspotFetch<T>(path, init, true);
		}
		const message =
			typeof body === 'object' && body && 'message' in body
				? String((body as { message: unknown }).message)
				: `HubSpot request failed (${res.status})`;
		throw new HubSpotApiError(res.status, message, body);
	}

	return body as T;
}

export type AvailabilitySlot = {
	startMillisUtc: number;
	endMillisUtc: number;
};

export type MeetingLinkBookInfo = {
	linkId?: string;
	isOffline?: boolean;
	customParams?: {
		durations?: number[];
		startTimeIncrementMinutes?: string;
		weeksToAdvertise?: number;
		formFields?: MeetingFormField[];
	};
	linkAvailability?: {
		linkAvailabilityByDuration?: Record<
			string,
			{ meetingDurationMillis: number; availabilities: AvailabilitySlot[] }
		>;
		hasMore?: boolean;
	};
	allUsersBusyTimes?: unknown[];
};

export async function getMeetingBookInfo(
	slug: string,
	timezone: string,
	monthOffset = 0
): Promise<MeetingLinkBookInfo> {
	const params = new URLSearchParams({ timezone });
	if (monthOffset) params.set('monthOffset', String(monthOffset));
	return hubspotFetch<MeetingLinkBookInfo>(
		`/scheduler/2026-03/meetings/meeting-links/book/${encodeSlug(slug)}?${params}`
	);
}

export async function getAvailabilityPage(
	slug: string,
	timezone: string,
	monthOffset = 0
): Promise<Pick<MeetingLinkBookInfo, 'linkAvailability' | 'allUsersBusyTimes'>> {
	const params = new URLSearchParams({ timezone });
	if (monthOffset) params.set('monthOffset', String(monthOffset));
	return hubspotFetch(
		`/scheduler/2026-03/meetings/meeting-links/book/availability-page/${encodeSlug(slug)}?${params}`
	);
}

/**
 * The fields the meeting link declares. Cached briefly rather than fetched per booking: it is a
 * whole extra round trip on the one request a visitor is waiting on, and this configuration is
 * changed by hand in HubSpot perhaps once a year. It carries no secret and no availability.
 *
 * Returns null when it could not be read — see selectMeetingFormFields for what that means.
 */
let meetingFields: { slug: string; fields: MeetingFormField[]; fetchedAtMs: number } | null = null;
const MEETING_FIELDS_TTL_MS = 10 * 60_000;

export async function getMeetingFormFields(
	slug: string,
	timezone: string
): Promise<MeetingFormField[] | null> {
	if (
		meetingFields &&
		meetingFields.slug === slug &&
		Date.now() - meetingFields.fetchedAtMs < MEETING_FIELDS_TTL_MS
	) {
		return meetingFields.fields;
	}

	try {
		const info = await getMeetingBookInfo(slug, timezone);
		const fields = info.customParams?.formFields ?? [];
		meetingFields = { slug, fields, fetchedAtMs: Date.now() };
		return fields;
	} catch (err) {
		console.error('[demo] could not read the meeting link\'s form fields; booking without them', err);
		return null;
	}
}

export type BookMeetingInput = {
	slug: string;
	firstName: string;
	lastName: string;
	email: string;
	startTime: number;
	duration: number;
	timezone: string;
	locale?: string;
	/** Everything we could send, keyed by HubSpot name; filtered to what the link declares. */
	fieldValues?: MeetingFieldValues;
	guestEmails?: string[];
	likelyAvailableUserIds?: string[];
};

export type BookMeetingResponse = {
	calendarEventId?: string;
	start?: string;
	end?: string;
	duration?: number;
	contactId?: string | number;
	bookingTimezone?: string;
	locale?: string;
	subject?: string;
	location?: string;
	isOffline?: boolean;
};

export async function bookMeeting(
	input: BookMeetingInput,
	timezone: string
): Promise<BookMeetingResponse> {
	const params = new URLSearchParams({ timezone });
	// Filtered here rather than at the call site so no caller can send a name the link does not
	// declare — one unknown name rejects the whole booking.
	const formFields = selectMeetingFormFields(
		await getMeetingFormFields(input.slug, timezone),
		input.fieldValues ?? {}
	);
	return hubspotFetch<BookMeetingResponse>(
		`/scheduler/2026-03/meetings/meeting-links/book?${params}`,
		{
			method: 'POST',
			body: JSON.stringify({
				slug: input.slug,
				firstName: input.firstName,
				lastName: input.lastName,
				email: input.email,
				startTime: input.startTime,
				duration: input.duration,
				timezone: input.timezone,
				locale: input.locale ?? 'en-gb',
				guestEmails: input.guestEmails ?? [],
				likelyAvailableUserIds: input.likelyAvailableUserIds ?? [],
				...(formFields.length ? { formFields } : {})
			})
		}
	);
}

export type HubSpotContact = {
	id: string;
	properties: Record<string, string | null>;
};

export async function getContact(
	contactId: string,
	properties: string[]
): Promise<HubSpotContact> {
	const params = new URLSearchParams({ properties: properties.join(',') });
	return hubspotFetch<HubSpotContact>(
		`/crm/v3/objects/contacts/${encodeURIComponent(contactId)}?${params}`
	);
}

export async function updateContact(
	contactId: string,
	properties: Record<string, string>
): Promise<HubSpotContact> {
	return hubspotFetch<HubSpotContact>(
		`/crm/v3/objects/contacts/${encodeURIComponent(contactId)}`,
		{
			method: 'PATCH',
			body: JSON.stringify({ properties })
		}
	);
}

/**
 * Merge new properties onto a contact without overwriting first-touch analytics / UTM fields
 * that already have values.
 */
export function mergePreservingOriginalSource(
	existing: Record<string, string | null | undefined>,
	incoming: Record<string, string>,
	preserveKeys: readonly string[]
): Record<string, string> {
	const out: Record<string, string> = { ...incoming };
	for (const key of preserveKeys) {
		const current = existing[key];
		if (current != null && String(current).trim() !== '') {
			delete out[key];
		}
	}
	return out;
}

export { SCHEDULER_BASE };
