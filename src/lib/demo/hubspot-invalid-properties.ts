/**
 * Which properties HubSpot refused in a contact update, read from its 400 response.
 *
 * HubSpot refuses a WHOLE update when one property in it does not exist, or holds a value the
 * property will not take (an owner id that is not an owner). So a booking made before somebody
 * creates `pc_demo_role` in HubSpot would otherwise save nothing at all — not the name, not the
 * routing, not the answers whose properties do exist. The caller drops what this names and sends
 * the rest again.
 *
 * Two response shapes are read, because HubSpot uses both:
 *   - `errors: [{ code: 'PROPERTY_DOESNT_EXIST', context: { propertyName: ['pc_x'] } }]`
 *   - `message: 'Property values were not valid: [{"name":"pc_x","error":"PROPERTY_DOESNT_EXIST",…}]'`
 * plus the plain wording `Property "pc_x" does not exist` as a last resort.
 *
 * Only names that were actually SENT are returned, so a misread can never drop anything else.
 * An empty result means "could not tell" — the caller then tries the properties one at a time.
 *
 * Pure: no fetch, no env. pcl-web carries the same rules in $lib/server/hubspot-invalid-properties.js.
 */

export type RefusedProperty = {
	name: string;
	/** PROPERTY_DOESNT_EXIST, INVALID_OPTION, … — 'UNKNOWN' when the response did not say. */
	code: string;
};

export const MISSING_PROPERTY = 'PROPERTY_DOESNT_EXIST';

function asRecord(v: unknown): Record<string, unknown> | null {
	return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function refusedProperties(body: unknown, sent: readonly string[]): RefusedProperty[] {
	const sentSet = new Set(sent);
	const found = new Map<string, string>();
	const add = (name: unknown, code: unknown) => {
		if (typeof name !== 'string' || !sentSet.has(name)) return;
		const c = typeof code === 'string' && code ? code : 'UNKNOWN';
		// A specific code beats UNKNOWN if both shapes name the same property.
		if (!found.has(name) || found.get(name) === 'UNKNOWN') found.set(name, c);
	};

	const b = asRecord(body);
	if (!b) return [];

	if (Array.isArray(b.errors)) {
		for (const e of b.errors) {
			const r = asRecord(e);
			if (!r) continue;
			const ctx = asRecord(r.context);
			const names = ctx?.propertyName;
			if (Array.isArray(names)) for (const n of names) add(n, r.code);
			else if (typeof names === 'string') add(names, r.code);
			if (typeof r.name === 'string') add(r.name, r.error ?? r.code);
		}
	}

	const message = typeof b.message === 'string' ? b.message : '';
	const start = message.indexOf('[');
	const end = message.lastIndexOf(']');
	if (start !== -1 && end > start) {
		try {
			const list = JSON.parse(message.slice(start, end + 1));
			if (Array.isArray(list)) {
				for (const item of list) {
					const r = asRecord(item);
					if (r && r.isValid !== true) add(r.name, r.error);
				}
			}
		} catch {
			// Not JSON — the wording below may still name it.
		}
	}
	for (const m of message.matchAll(/Property \\?"([A-Za-z0-9_]+)\\?" does not exist/g)) add(m[1], MISSING_PROPERTY);

	return [...found].map(([name, code]) => ({ name, code }));
}

/** A 400 that is about the values sent (rather than, say, a bad id or a bad token). */
export function isValidationError(status: number, body: unknown): boolean {
	if (status !== 400) return false;
	const b = asRecord(body);
	const category = typeof b?.category === 'string' ? b.category : '';
	return !category || category === 'VALIDATION_ERROR';
}

export type PropertyUpdateResult = {
	saved: string[];
	/** Not saved: HubSpot has no such property, or would not take the value. */
	skipped: RefusedProperty[];
};

/** An error from the HubSpot client, read by shape: a status and the parsed response body. */
function readError(err: unknown): { status: number; body: unknown } | null {
	const r = asRecord(err);
	return r && typeof r.status === 'number' ? { status: r.status, body: r.body } : null;
}

/**
 * Sends `properties` with `send`, dropping whatever HubSpot refuses and sending the rest again,
 * until it is taken or nothing is left. When a refusal cannot be read, each property is sent on
 * its own, so whatever HubSpot has is still saved. Anything other than a validation refusal (a
 * bad token, HubSpot down, an unknown contact) is thrown, as before.
 *
 * `skip` names properties to leave out without asking (found missing a moment ago);
 * `onMissing` hears each property HubSpot says does not exist.
 */
export async function sendWithoutRefused(
	properties: Record<string, string>,
	send: (props: Record<string, string>) => Promise<unknown>,
	opts: { skip?: (name: string) => boolean; onMissing?: (name: string) => void } = {}
): Promise<PropertyUpdateResult> {
	const skipped: RefusedProperty[] = [];
	const pending: Record<string, string> = {};
	for (const [name, value] of Object.entries(properties)) {
		if (opts.skip?.(name)) skipped.push({ name, code: MISSING_PROPERTY });
		else pending[name] = value;
	}
	const refusal = (err: unknown) => {
		const e = readError(err);
		return e && isValidationError(e.status, e.body) ? e : null;
	};
	const note = (r: RefusedProperty) => {
		skipped.push(r);
		if (r.code === MISSING_PROPERTY) opts.onMissing?.(r.name);
	};

	for (let attempt = 0; attempt < 5; attempt++) {
		const names = Object.keys(pending);
		if (!names.length) return { saved: [], skipped };
		try {
			await send(pending);
			return { saved: names, skipped };
		} catch (err) {
			const e = refusal(err);
			if (!e) throw err;
			const refused = refusedProperties(e.body, names);
			if (!refused.length) break;
			for (const r of refused) {
				delete pending[r.name];
				note(r);
			}
		}
	}

	// Could not tell what was refused (or still refusing after five rounds): one at a time.
	const saved: string[] = [];
	for (const [name, value] of Object.entries(pending)) {
		try {
			await send({ [name]: value });
			saved.push(name);
		} catch (err) {
			const e = refusal(err);
			if (!e) throw err;
			note({ name, code: refusedProperties(e.body, [name])[0]?.code ?? 'UNKNOWN' });
		}
	}
	return { saved, skipped };
}
