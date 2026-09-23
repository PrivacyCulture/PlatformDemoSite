import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { earliestBookableMs, slotIsBookable } from '$lib/booking-lead-time';
import {
	emptyDemoForm,
	normalizeDemoForm,
	validateDemoForm,
	type DemoFormValues
} from '$lib/demo/fields';
import {
	formToContactProperties,
	HUBSPOT_CONTACT_PROPS,
	routeContact,
	utmToContactProperties
} from '$lib/demo/hubspotProperties';
import { utmsFromUnknown, type DemoUtm } from '$lib/demo/utm';
import {
	bookMeeting,
	getContact,
	HubSpotApiError,
	HubSpotConfigError,
	getBookingLeadDays,
	mergePreservingOriginalSource,
	requireMeetingSlug,
	updateContact
} from '$lib/server/hubspot';

type BookBody = {
	form?: Partial<DemoFormValues>;
	startTime?: number;
	duration?: number;
	timezone?: string;
	utms?: unknown;
};

function parseForm(raw: Partial<DemoFormValues> | undefined): DemoFormValues {
	const base = emptyDemoForm();
	if (!raw || typeof raw !== 'object') return base;
	for (const key of Object.keys(base) as (keyof DemoFormValues)[]) {
		const value = raw[key];
		if (typeof value === 'string') base[key] = value;
	}
	return normalizeDemoForm(base);
}

const PRESERVE_SOURCE_KEYS = [
	HUBSPOT_CONTACT_PROPS.analyticsSource,
	HUBSPOT_CONTACT_PROPS.analyticsSourceData1,
	HUBSPOT_CONTACT_PROPS.analyticsSourceData2,
	HUBSPOT_CONTACT_PROPS.utmSource,
	HUBSPOT_CONTACT_PROPS.utmMedium,
	HUBSPOT_CONTACT_PROPS.utmCampaign,
	HUBSPOT_CONTACT_PROPS.utmTerm,
	HUBSPOT_CONTACT_PROPS.utmContent
] as const;

export const POST: RequestHandler = async ({ request }) => {
	let body: BookBody;
	try {
		body = (await request.json()) as BookBody;
	} catch {
		return json({ error: 'Invalid JSON body', code: 'bad_request' }, { status: 400 });
	}

	const form = parseForm(body.form);
	const errors = validateDemoForm(form);
	if (Object.keys(errors).length) {
		return json({ error: 'Validation failed', code: 'validation', errors }, { status: 400 });
	}

	const timezone = typeof body.timezone === 'string' ? body.timezone.trim() : '';
	if (!timezone) {
		return json({ error: 'timezone is required', code: 'bad_request' }, { status: 400 });
	}

	const startTime = Number(body.startTime);
	const duration = Number(body.duration);
	if (!Number.isFinite(startTime) || startTime < Date.now() - 60_000) {
		return json({ error: 'startTime must be a future timestamp', code: 'bad_request' }, { status: 400 });
	}
	if (!Number.isFinite(duration) || duration < 300_000 || duration > 7_200_000) {
		return json({ error: 'duration is invalid', code: 'bad_request' }, { status: 400 });
	}

	// Enforced here as well as on the availability list: filtering what is DISPLAYED is a
	// courtesy, not a rule — this endpoint takes a startTime from the browser, so without this
	// the notice period is bypassed by posting one.
	//
	// The refusal deliberately does NOT mention a notice period, name a date, or return the
	// cutoff: a visitor should take it as that slot having gone, not as a policy aimed at them.
	// It is also true — the slot is not on offer — and it is what someone on a stale page would
	// expect to read. Do not "improve" this into a helpful explanation.
	const earliest = earliestBookableMs(Date.now(), await getBookingLeadDays(), timezone);
	if (!slotIsBookable(startTime, earliest)) {
		return json(
			{ error: 'That time is no longer available. Please choose another slot.', code: 'slot_unavailable' },
			{ status: 400 }
		);
	}

	const utms: DemoUtm = utmsFromUnknown(body.utms);

	try {
		const slug = requireMeetingSlug();
		const booking = await bookMeeting(
			{
				slug,
				firstName: form.firstName,
				lastName: form.lastName,
				email: form.email,
				startTime,
				duration,
				timezone,
				// Everything we COULD attach to the meeting, under the same internal names the
				// contact patch below uses, so the two can never drift. bookMeeting keeps only
				// the ones this meeting link actually declares.
				fieldValues: {
					[HUBSPOT_CONTACT_PROPS.company]: form.company,
					[HUBSPOT_CONTACT_PROPS.phone]: form.phone,
					// "What do you do?" is the question HubSpot's own jobtitle field asks.
					jobtitle: form.role,
					[HUBSPOT_CONTACT_PROPS.role]: form.role,
					[HUBSPOT_CONTACT_PROPS.employeeBand]: form.employeeBand,
					[HUBSPOT_CONTACT_PROPS.tooling]: form.tooling,
					[HUBSPOT_CONTACT_PROPS.timing]: form.timing,
					[HUBSPOT_CONTACT_PROPS.improve]: form.improve
				}
			},
			timezone
		);

		const contactId = booking.contactId != null ? String(booking.contactId) : null;
		if (contactId) {
			const routing = routeContact(form, utms);
			const incoming = {
				...formToContactProperties(form),
				...utmToContactProperties(utms),
				...routing.properties,
				...(routing.hubspotOwnerId ? { hubspot_owner_id: routing.hubspotOwnerId } : {})
			};

			try {
				const existing = await getContact(contactId, [...PRESERVE_SOURCE_KEYS]);
				const merged = mergePreservingOriginalSource(
					existing.properties ?? {},
					incoming,
					PRESERVE_SOURCE_KEYS
				);
				if (Object.keys(merged).length) {
					await updateContact(contactId, merged);
				}
			} catch (patchErr) {
				// Booking succeeded — log property sync failure but still confirm to the user.
				console.error('[demo/book] contact patch failed', patchErr);
			}
		}

		return json({
			ok: true,
			start: booking.start ?? new Date(startTime).toISOString(),
			end: booking.end ?? new Date(startTime + duration).toISOString(),
			duration: booking.duration ?? duration,
			timezone: booking.bookingTimezone ?? timezone,
			isOffline: Boolean(booking.isOffline),
			subject: booking.subject ?? null,
			location: booking.location ?? null,
			contactId
		});
	} catch (err) {
		if (err instanceof HubSpotConfigError) {
			return json({ error: err.message, code: 'not_configured' }, { status: 503 });
		}
		if (err instanceof HubSpotApiError) {
			console.error('[demo/book]', err.status, err.body);
			return json(
				{ error: err.message, code: 'hubspot_error' },
				{ status: err.status >= 400 && err.status < 600 ? err.status : 502 }
			);
		}
		console.error('[demo/book]', err);
		return json({ error: 'Failed to book meeting', code: 'server_error' }, { status: 500 });
	}
};
