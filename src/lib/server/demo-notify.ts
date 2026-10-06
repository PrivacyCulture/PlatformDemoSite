import { env } from '$env/dynamic/private';
import {
	buildDemoNotification,
	parseRecipientList,
	type DemoNotificationInput
} from '../demo/notification';

/**
 * Tells the team a demo has been booked.
 *
 * Sent through SendGrid's REST API, the same service Sorted sends from, under the same two
 * variable names (SENDGRID_API_KEY, EMAIL_FROM) so the values can be copied across. Who hears
 * about it is DEMO_NOTIFY_EMAILS, a list of addresses; unset means nobody, quietly.
 *
 * Called after the booking has succeeded and never awaited by the response: the visitor's
 * meeting exists in HubSpot whatever happens here, so a mail failure is logged, not shown.
 */

const SENDGRID_SEND_URL = 'https://api.sendgrid.com/v3/mail/send';

export function demoNotifyRecipients(): string[] {
	return parseRecipientList(env.DEMO_NOTIFY_EMAILS);
}

/** "Name <address>" or a bare address, as EMAIL_FROM is written. */
function parseFrom(raw: string): { email: string; name?: string } {
	const match = raw.match(/^\s*(?:"?([^"<]*?)"?\s*)?<([^>]+)>\s*$/);
	if (match && match[2]) {
		const name = match[1]?.trim();
		return name ? { email: match[2].trim(), name } : { email: match[2].trim() };
	}
	return { email: raw.trim() };
}

export async function notifyDemoBooked(input: DemoNotificationInput): Promise<void> {
	const to = demoNotifyRecipients();
	if (!to.length) return;

	const apiKey = env.SENDGRID_API_KEY?.trim();
	const fromRaw = env.EMAIL_FROM?.trim();
	if (!apiKey || !fromRaw) {
		console.error(
			'[demo/notify] DEMO_NOTIFY_EMAILS is set but SENDGRID_API_KEY or EMAIL_FROM is not; no notification sent.'
		);
		return;
	}

	const message = buildDemoNotification(input);
	const res = await fetch(SENDGRID_SEND_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			personalizations: [{ to: to.map((email) => ({ email })) }],
			from: parseFrom(fromRaw),
			reply_to: { email: input.form.email, name: `${input.form.firstName} ${input.form.lastName}`.trim() || undefined },
			subject: message.subject,
			content: [
				{ type: 'text/plain', value: message.text },
				{ type: 'text/html', value: message.html }
			]
		})
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`SendGrid refused the demo notification (${res.status}): ${body.slice(0, 500)}`);
	}
}
