/**
 * Questions added to the book-a-demo form in Sorted (Website → Platform → Demo form → Extra
 * questions), on top of the fixed ones in ./fields.
 *
 * The CMS stores every value as text — `required` is 'yes' | 'no', a dropdown's options are one
 * per line — so this module reads either that or a hand-written file's booleans and arrays, and
 * drops anything it cannot use rather than drawing a broken field.
 *
 * Pure: no $lib alias, no fetch, no env — so it runs under the plain test tools, and the server
 * re-checks with exactly the rules the browser used.
 */

export const DEMO_EXTRA_FIELD_TYPES = ['text', 'textarea', 'select', 'checkbox'] as const;
export type DemoExtraFieldType = (typeof DEMO_EXTRA_FIELD_TYPES)[number];

export type DemoExtraField = {
	/** Stable key the answer travels under. */
	id: string;
	label: string;
	type: DemoExtraFieldType;
	required: boolean;
	/** Dropdown choices; empty for every other type. */
	options: string[];
	placeholder: string;
	/** HubSpot contact property the answer is written to; '' = the booking email only. */
	hubspotProperty: string;
};

/** Answers keyed by field id. A tick box is 'Yes' when ticked, '' when not. */
export type DemoExtraAnswers = Record<string, string>;

export const DEMO_EXTRA_FIELDS_MAX = 20;
export const DEMO_EXTRA_ANSWER_MAX = 2000;
export const CHECKBOX_YES = 'Yes';

/**
 * Properties the fixed form, the routing and the first-touch analytics already write. An extra
 * question naming one of these is sent to the email only — it must never overwrite the visitor's
 * own email address, their owner, or where they first came from.
 */
export const RESERVED_HUBSPOT_PROPERTIES: ReadonlySet<string> = new Set([
	'firstname',
	'lastname',
	'email',
	'company',
	'phone',
	'jobtitle',
	'hubspot_owner_id',
	'pc_demo_role',
	'pc_employee_band',
	'pc_current_tooling',
	'pc_eval_timing',
	'pc_iso_soc_gate',
	'pc_improve_notes',
	'pc_demo_website',
	'pc_demo_booking_page',
	'pc_demo_came_from',
	'pc_stranger',
	'pc_sla_tier',
	'pc_lead_priority',
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_term',
	'utm_content',
	'hs_analytics_source',
	'hs_analytics_source_data_1',
	'hs_analytics_source_data_2'
]);

/** A HubSpot internal property name: lower case, digits and underscores, starting with a letter. */
export function isUsableHubSpotProperty(name: string): boolean {
	return /^[a-z][a-z0-9_]{0,99}$/.test(name) && !RESERVED_HUBSPOT_PROPERTIES.has(name);
}

function str(v: unknown): string {
	return typeof v === 'string' ? v.trim() : '';
}

function readRequired(v: unknown): boolean {
	if (typeof v === 'boolean') return v;
	const s = str(v).toLowerCase();
	return s === 'yes' || s === 'true' || s === 'required';
}

function readOptions(v: unknown): string[] {
	const list = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/\r?\n/) : [];
	const seen = new Set<string>();
	const out: string[] = [];
	for (const item of list) {
		const o = str(item);
		if (!o || seen.has(o)) continue;
		seen.add(o);
		out.push(o);
	}
	return out;
}

/**
 * The extra questions from the content, in order. Never throws. A question with no label or an
 * unknown type is dropped; a dropdown with fewer than two choices is dropped (nobody can answer a
 * dropdown with one); ids are kept unique, since an answer travels under its id.
 */
export function parseExtraFields(raw: unknown): DemoExtraField[] {
	if (!Array.isArray(raw)) return [];
	const out: DemoExtraField[] = [];
	const ids = new Set<string>();
	for (const item of raw) {
		if (out.length >= DEMO_EXTRA_FIELDS_MAX) break;
		if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
		const r = item as Record<string, unknown>;
		const label = str(r.label);
		const type = str(r.type) as DemoExtraFieldType;
		if (!label || !DEMO_EXTRA_FIELD_TYPES.includes(type)) continue;
		const options = type === 'select' ? readOptions(r.options) : [];
		if (type === 'select' && options.length < 2) continue;
		let id = str(r.id) || label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'field';
		if (ids.has(id)) {
			let n = 2;
			while (ids.has(`${id}-${n}`)) n++;
			id = `${id}-${n}`;
		}
		ids.add(id);
		const property = str(r.hubspotProperty).toLowerCase();
		out.push({
			id,
			label,
			type,
			required: readRequired(r.required),
			options,
			placeholder: type === 'checkbox' ? '' : str(r.placeholder),
			hubspotProperty: isUsableHubSpotProperty(property) ? property : ''
		});
	}
	return out;
}

/** An empty answer for every question. */
export function emptyExtraAnswers(fields: readonly DemoExtraField[]): DemoExtraAnswers {
	return Object.fromEntries(fields.map((f) => [f.id, '']));
}

/**
 * The answers as the server will keep them: only questions that exist, trimmed, capped, a tick
 * box read as 'Yes' or '', and a dropdown answer that is not one of its choices left as it was
 * sent — validateExtraAnswers then refuses it rather than this quietly blanking it.
 */
export function normalizeExtraAnswers(fields: readonly DemoExtraField[], raw: unknown): DemoExtraAnswers {
	const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
	const out: DemoExtraAnswers = {};
	for (const f of fields) {
		const v = src[f.id];
		if (f.type === 'checkbox') {
			out[f.id] = v === true || str(v).toLowerCase() === 'yes' || str(v) === 'true' ? CHECKBOX_YES : '';
		} else {
			out[f.id] = str(v).slice(0, DEMO_EXTRA_ANSWER_MAX);
		}
	}
	return out;
}

export type ExtraFieldMessages = { required: string; invalid: string };

/** What is wrong with the answers, keyed by field id. Empty = acceptable. */
export function validateExtraAnswers(
	fields: readonly DemoExtraField[],
	answers: DemoExtraAnswers,
	messages: ExtraFieldMessages
): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const f of fields) {
		const v = (answers[f.id] ?? '').trim();
		if (!v) {
			if (f.required) errors[f.id] = messages.required;
			continue;
		}
		if (f.type === 'select' && !f.options.includes(v)) errors[f.id] = messages.invalid;
	}
	return errors;
}

/** Answered questions as label → value, in form order, for the team's booking email. */
export function extraAnswerRows(fields: readonly DemoExtraField[], answers: DemoExtraAnswers): { label: string; value: string }[] {
	return fields.flatMap((f) => {
		const v = (answers[f.id] ?? '').trim();
		return v ? [{ label: f.label, value: v }] : [];
	});
}

/**
 * HubSpot contact properties from the answers: only questions that name a usable property, and
 * only answered ones (a blank is never sent — it would wipe a value HubSpot already holds).
 * Two questions naming the same property: the first answered one wins.
 */
export function extraHubSpotProperties(fields: readonly DemoExtraField[], answers: DemoExtraAnswers): Record<string, string> {
	const out: Record<string, string> = {};
	for (const f of fields) {
		if (!f.hubspotProperty || f.hubspotProperty in out) continue;
		const v = (answers[f.id] ?? '').trim();
		if (v) out[f.hubspotProperty] = v;
	}
	return out;
}
