import { env } from '$env/dynamic/private';

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

function requireToken(): string {
	const token = env.HUBSPOT_ACCESS_TOKEN?.trim();
	if (!token) {
		throw new HubSpotConfigError(
			'HubSpot is not configured. Set HUBSPOT_ACCESS_TOKEN in the environment.'
		);
	}
	return token;
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

async function hubspotFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const token = requireToken();
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
		formFields?: { name: string; required?: boolean }[];
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
		`/scheduler/2026-03/meetings/meeting-links/book/${encodeURIComponent(slug)}?${params}`
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
		`/scheduler/2026-03/meetings/meeting-links/book/availability-page/${encodeURIComponent(slug)}?${params}`
	);
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
	formFields?: { name: string; value: string }[];
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
				...(input.formFields?.length ? { formFields: input.formFields } : {})
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
