/**
 * How far ahead a visitor may book.
 *
 * "Two days' notice" is a claim about DAYS, not hours: with a lead time of 2 set on a Monday,
 * the first bookable slot is Wednesday at 00:00, not Wednesday at whatever o'clock it happens
 * to be now. Measuring 48 hours instead would let a 4pm visitor book Wednesday afternoon while
 * refusing Wednesday morning, which is not what anyone means by it.
 *
 * And the day boundary is the VISITOR'S, because they choose the timezone on the form and every
 * slot is shown to them in it. Cutting at UTC midnight would offer a Londoner an extra hour in
 * summer and cost a Sydney visitor most of their first day.
 *
 * Pure — no fetch, no env — so the timezone and daylight-saving behaviour is testable offline.
 */

/** A lead time we will not act on: absent, negative, unreadable, or implausibly large. */
export const MAX_LEAD_DAYS = 365;

export function normaliseLeadDays(value: unknown): number {
	const n = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(n)) return 0;
	// Floor rather than round: 1.9 days' notice must not silently become 2.
	const days = Math.floor(n);
	if (days <= 0) return 0;
	return Math.min(days, MAX_LEAD_DAYS);
}

/** The local wall-clock parts of an instant, in a given zone. */
function partsIn(ms: number, timeZone: string) {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		hour12: false,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).formatToParts(new Date(ms));
	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
	// Intl renders midnight as hour 24 in some engines under hour12:false.
	return { y: get('year'), m: get('month'), d: get('day'), h: get('hour') % 24, mi: get('minute'), s: get('second') };
}

/**
 * The instant at which the local day `addDays` after `nowMs` begins, in `timeZone`.
 *
 * Solved by iteration rather than arithmetic: there is no way to turn a local wall-clock time
 * into an instant directly, because the offset depends on the very instant being sought. Two
 * passes settle it, including across a daylight-saving change, where the first guess is out by
 * exactly the hour that shifts.
 */
export function startOfLocalDayAfter(nowMs: number, addDays: number, timeZone: string): number {
	const now = partsIn(nowMs, timeZone);
	const target = new Date(Date.UTC(now.y, now.m - 1, now.d + addDays));
	const ty = target.getUTCFullYear();
	const tm = target.getUTCMonth() + 1;
	const td = target.getUTCDate();
	const wanted = Date.UTC(ty, tm - 1, td, 0, 0, 0);

	let guess = wanted;
	for (let i = 0; i < 2; i++) {
		const p = partsIn(guess, timeZone);
		const asIfUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
		guess = wanted - (asIfUtc - guess);
	}
	return guess;
}

/**
 * The earliest instant a visitor may book. `0` lead days means no restriction at all — returning
 * "now" instead would quietly drop the slot someone is mid-way through clicking.
 */
export function earliestBookableMs(nowMs: number, leadDays: number, timeZone: string): number {
	const days = normaliseLeadDays(leadDays);
	if (days === 0) return 0;
	try {
		return startOfLocalDayAfter(nowMs, days, timeZone);
	} catch {
		// An unknown timezone must not open the gate — fall back to UTC days, which is within
		// a day of right, rather than returning 0 and honouring no lead time whatsoever.
		return startOfLocalDayAfter(nowMs, days, 'UTC');
	}
}

export function slotIsBookable(startMs: number, earliestMs: number): boolean {
	return startMs >= earliestMs;
}
