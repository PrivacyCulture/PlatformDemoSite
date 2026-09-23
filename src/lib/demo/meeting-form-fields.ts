/**
 * Which extra fields a booking may carry.
 *
 * HubSpot's /book endpoint validates every `formFields[].name` against the fields the MEETING
 * LINK itself declares, and rejects the whole request — "formFields contains invalid name(s)" —
 * if one is unrecognised. So the list cannot be written here and hoped for: it is whatever the
 * link is configured with in HubSpot, which somebody may change at any time without touching
 * this repo. This link currently declares two (`jobtitle`, `company`) while the form collects
 * eight, which is what made every booking fail at the last step.
 *
 * Nothing is lost by dropping the rest: every qualification answer is written onto the contact
 * by the property patch straight after the booking, under its own internal name.
 *
 * Pure — no fetch, no env — so the filter is testable offline.
 */

/** A field the meeting link declares, as HubSpot's book-info call reports it. */
export type MeetingFormField = { name: string; isRequired?: boolean };

/** Values we could supply, keyed by the HubSpot name they would be sent under. */
export type MeetingFieldValues = Record<string, string>;

export function selectMeetingFormFields(
	declared: readonly MeetingFormField[] | null | undefined,
	values: MeetingFieldValues
): { name: string; value: string }[] {
	// A lookup we could not make is not the same as a link with no fields, but both must send
	// nothing: an unknown name fails the booking outright, whereas an omitted optional one does
	// not. Losing a field off the meeting's own notes is a far smaller failure than losing the
	// meeting, and the property patch carries the answer regardless.
	if (!declared?.length) return [];

	const byName = new Map<string, string>();
	for (const [name, value] of Object.entries(values)) {
		const key = name.trim().toLowerCase();
		if (key) byName.set(key, value);
	}

	const out: { name: string; value: string }[] = [];
	const sent = new Set<string>();
	for (const field of declared) {
		const name = typeof field?.name === 'string' ? field.name.trim() : '';
		if (!name || sent.has(name.toLowerCase())) continue;
		const value = byName.get(name.toLowerCase());
		// A required field is sent even when we hold nothing for it, so HubSpot answers with its
		// own complaint about the missing value rather than us quietly omitting the field and
		// leaving the same refusal unexplained.
		if (value == null || value.trim() === '') {
			if (!field.isRequired) continue;
			sent.add(name.toLowerCase());
			out.push({ name, value: '' });
			continue;
		}
		sent.add(name.toLowerCase());
		out.push({ name, value: value.trim() });
	}
	return out;
}
