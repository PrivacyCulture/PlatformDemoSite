import type { DemoUtm } from './utm';

/**
 * The answers the email shows: the same shape as DemoFormValues in ./fields, spelled out here
 * so this file stays free of the $lib alias and runs under the plain tools tsconfig.
 */
export type DemoNotificationForm = {
	firstName: string;
	lastName: string;
	email: string;
	company: string;
	role: string;
	employeeBand: string;
	tooling: string;
	timing: string;
	isoGate: string;
	improve: string;
	phone: string;
};

/**
 * The team's "someone booked a demo" email: the pure part, so it can be tested without an
 * environment. Sending lives in $lib/server/demo-notify.ts.
 */

/**
 * The addresses in DEMO_NOTIFY_EMAILS: separated by commas, semicolons, spaces or newlines,
 * in any mix. Anything that is not shaped like an address is dropped, and each address is
 * kept once. Returns [] for an unset variable, which is how "no notifications" is spelled.
 */
export function parseRecipientList(raw: string | undefined | null): string[] {
	if (!raw) return [];
	const seen = new Set<string>();
	const out: string[] = [];
	for (const part of raw.split(/[\s,;]+/)) {
		const address = part.trim().replace(/^<|>$/g, '');
		if (!address) continue;
		if (!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(address)) continue;
		const key = address.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(address);
	}
	return out;
}

export type DemoNotificationInput = {
	form: DemoNotificationForm;
	/** ISO start and end, as HubSpot confirmed them. */
	start: string;
	end: string;
	/** The visitor's IANA time zone. */
	timezone: string;
	isOffline: boolean;
	subject?: string | null;
	location?: string | null;
	contactId?: string | null;
	/** First-touch UTMs, the ones HubSpot keeps. */
	utms: DemoUtm;
	/** The demo page's own UTMs at the moment of booking: which button, or which campaign. */
	pageUtms: DemoUtm;
	routing?: { slaTier: string; isStranger: boolean } | null;
};

export type DemoNotification = { subject: string; html: string; text: string };

/** The team's own time zone, shown beside the visitor's when they differ. */
export const TEAM_TIMEZONE = 'Europe/London';

export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function formatWhen(iso: string, timeZone: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	try {
		return new Intl.DateTimeFormat('en-GB', {
			timeZone,
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			timeZoneName: 'short'
		}).format(date);
	} catch {
		// An unknown zone name from the browser: fall back to UTC rather than drop the email.
		return `${date.toISOString().replace('T', ' ').slice(0, 16)} UTC`;
	}
}

function formatEndTime(iso: string, timeZone: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '';
	try {
		return new Intl.DateTimeFormat('en-GB', { timeZone, hour: 'numeric', minute: '2-digit' }).format(date);
	} catch {
		return '';
	}
}

/**
 * Where the booking came from: the page whose Book a demo button was clicked (utm_source is
 * the page name), or the campaign the demo page was opened from. Empty when the address
 * carried nothing.
 */
export function describeOrigin(pageUtms: DemoUtm): string {
	const parts = [pageUtms.utm_source, pageUtms.utm_medium, pageUtms.utm_campaign, pageUtms.utm_content, pageUtms.utm_term]
		.filter((v): v is string => Boolean(v));
	return parts.join(' / ');
}

function utmLine(utms: DemoUtm): string {
	const parts = (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const)
		.filter((key) => utms[key])
		.map((key) => `${key}=${utms[key]}`);
	return parts.join(', ');
}

export function buildDemoNotification(input: DemoNotificationInput): DemoNotification {
	const { form } = input;
	const name = `${form.firstName} ${form.lastName}`.trim() || form.email;
	const company = form.company.trim();

	const visitorWhen = formatWhen(input.start, input.timezone);
	const visitorEnd = formatEndTime(input.end, input.timezone);
	const teamWhen = input.timezone !== TEAM_TIMEZONE ? formatWhen(input.start, TEAM_TIMEZONE) : '';
	const origin = describeOrigin(input.pageUtms);
	const firstTouch = utmLine(input.utms);

	const subject = `Demo booked: ${name}${company ? ` at ${company}` : ''}, ${formatWhen(input.start, TEAM_TIMEZONE)}`;

	type Row = [label: string, value: string];
	const whenRows: Row[] = [
		['When', `${visitorWhen}${visitorEnd ? ` to ${visitorEnd}` : ''} (${input.timezone})`],
		...(teamWhen ? [['Team time', teamWhen] as Row] : []),
		['Format', input.isOffline ? 'Offline meeting' : 'Online, the video link is in the HubSpot invite'],
		...(input.subject ? [['Meeting', input.subject] as Row] : []),
		...(input.location ? [['Location', input.location] as Row] : [])
	];
	const whoRows: Row[] = [
		['Name', name],
		['Email', form.email],
		...(company ? [['Company', company] as Row] : []),
		...(form.phone ? [['Phone', form.phone] as Row] : []),
		...(form.role ? [['Role', form.role] as Row] : []),
		...(form.employeeBand ? [['Employees', form.employeeBand] as Row] : []),
		...(form.tooling ? [['Current tooling', form.tooling] as Row] : []),
		...(form.timing ? [['Timing', form.timing] as Row] : []),
		...(form.isoGate ? [['ISO / SOC', form.isoGate] as Row] : []),
		...(form.improve ? [['Wants to improve', form.improve] as Row] : [])
	];
	const sourceRows: Row[] = [
		...(origin ? [['Booked from', origin] as Row] : []),
		...(firstTouch ? [['First touch', firstTouch] as Row] : []),
		...(input.routing
			? [['Routing', `${input.routing.slaTier}${input.routing.isStranger ? ', stranger' : ''}`] as Row]
			: []),
		...(input.contactId ? [['HubSpot contact', input.contactId] as Row] : [])
	];

	const htmlRows = (rows: Row[]) =>
		rows
			.map(
				([label, value]) => `
			<tr>
				<td style="padding:6px 16px 6px 0;font-size:13px;color:#6b7280;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
				<td style="padding:6px 0;font-size:14px;color:#0b1220;vertical-align:top;">${escapeHtml(value)}</td>
			</tr>`
			)
			.join('');
	const section = (title: string, rows: Row[]) =>
		rows.length
			? `
		<h3 style="margin:22px 0 6px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#9a7b3c;">${escapeHtml(title)}</h3>
		<table style="border-collapse:collapse;width:100%;">${htmlRows(rows)}</table>`
			: '';

	const html = `
	<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:580px;margin:0 auto;color:#0b1220;">
		<h2 style="margin:0 0 4px;font-size:20px;color:#0b1220;">Demo booked</h2>
		<p style="margin:0;font-size:15px;color:#374151;">${escapeHtml(name)}${company ? ` from <strong>${escapeHtml(company)}</strong>` : ''} booked a demo through the website.</p>
		${section('When', whenRows)}
		${section('Who', whoRows)}
		${section('Source', sourceRows)}
		<p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">Sent to the addresses in DEMO_NOTIFY_EMAILS. The meeting is in HubSpot with the usual invite.</p>
	</div>`.trim();

	const textRows = (rows: Row[]) => rows.map(([label, value]) => `${label}: ${value}`).join('\n');
	const text = [
		`Demo booked`,
		`${name}${company ? ` from ${company}` : ''} booked a demo through the website.`,
		'',
		textRows(whenRows),
		'',
		textRows(whoRows),
		...(sourceRows.length ? ['', textRows(sourceRows)] : [])
	].join('\n');

	return { subject, html, text };
}
