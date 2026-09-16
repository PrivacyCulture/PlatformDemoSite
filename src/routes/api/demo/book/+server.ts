import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
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
				formFields: [
					{ name: 'company', value: form.company },
					{ name: 'phone', value: form.phone || '' },
					{ name: 'role', value: form.role },
					{ name: 'employee_band', value: form.employeeBand },
					{ name: 'tooling', value: form.tooling },
					{ name: 'timing', value: form.timing },
					{ name: 'improve', value: form.improve || '' }
				]
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
