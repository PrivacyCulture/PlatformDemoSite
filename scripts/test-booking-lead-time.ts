import {
	earliestBookableMs,
	normaliseLeadDays,
	slotIsBookable,
	startOfLocalDayAfter,
	MAX_LEAD_DAYS
} from '../src/lib/booking-lead-time';

let passed = 0;
const failures: string[] = [];
function ok(label: string, actual: unknown, expected: unknown) {
	if (JSON.stringify(actual) === JSON.stringify(expected)) passed++;
	else failures.push(`${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`);
}
const iso = (ms: number, tz: string) =>
	new Intl.DateTimeFormat('en-CA', {
		timeZone: tz, hour12: false,
		year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
	}).format(new Date(ms));

// ── normaliseLeadDays ─────────────────────────────────────────────────────────
ok('0 is off', normaliseLeadDays(0), 0);
ok('2 stays 2', normaliseLeadDays(2), 2);
ok('"3" parses', normaliseLeadDays('3'), 3);
ok('negative is off, never a backdated window', normaliseLeadDays(-5), 0);
ok('undefined is off', normaliseLeadDays(undefined), 0);
ok('null is off', normaliseLeadDays(null), 0);
ok('gibberish is off', normaliseLeadDays('soon'), 0);
ok('NaN is off', normaliseLeadDays(NaN), 0);
ok('1.9 floors to 1, never rounds up to 2', normaliseLeadDays(1.9), 1);
ok('0.5 floors to 0', normaliseLeadDays(0.5), 0);
ok('absurd values are capped', normaliseLeadDays(99999), MAX_LEAD_DAYS);

// ── the day boundary is the visitor's, not UTC ────────────────────────────────
// 23 Sep 2026 12:45 UTC. London is BST (+1), so local midnight is 23:00 UTC the night before.
const sep23 = Date.UTC(2026, 8, 23, 12, 45);
ok('lead 2 in London lands on the 25th at 00:00 local',
	iso(earliestBookableMs(sep23, 2, 'Europe/London'), 'Europe/London'), '2026-09-25, 00:00');
ok('...which is 23:00 UTC on the 24th, not UTC midnight',
	new Date(earliestBookableMs(sep23, 2, 'Europe/London')).toISOString(), '2026-09-24T23:00:00.000Z');
ok('lead 1 is tomorrow', iso(earliestBookableMs(sep23, 1, 'Europe/London'), 'Europe/London'), '2026-09-24, 00:00');
ok('lead 0 is no restriction at all, not "now"', earliestBookableMs(sep23, 0, 'Europe/London'), 0);

// Late at night in the visitor's zone: the count is of DAYS, so a 23:30 visitor and an 09:00
// visitor on the same local day get the same answer. This is the whole point of day-based.
const lateLondon = Date.UTC(2026, 8, 23, 22, 30); // 23:30 BST, still the 23rd locally
ok('a late-evening visitor gets the same cutoff as a morning one',
	earliestBookableMs(lateLondon, 2, 'Europe/London'), earliestBookableMs(sep23, 2, 'Europe/London'));

// A zone far enough east that UTC and local are on different DATES — the case a UTC-midnight
// cutoff gets wrong by a whole day.
const sydneyEve = Date.UTC(2026, 8, 23, 14, 0); // 24 Sep 00:00 in Sydney (+10)
ok('Sydney counts from its own date, not UTC\'s',
	iso(earliestBookableMs(sydneyEve, 2, 'Australia/Sydney'), 'Australia/Sydney'), '2026-09-26, 00:00');

// ── daylight saving ───────────────────────────────────────────────────────────
// UK clocks go back 02:00 → 01:00 on Sunday 25 Oct 2026. Crossing it must still land on
// local midnight, which is the iteration in startOfLocalDayAfter earning its keep.
const preDst = Date.UTC(2026, 9, 23, 12, 0); // Fri 23 Oct, BST
ok('crossing the autumn DST change still lands on local midnight',
	iso(startOfLocalDayAfter(preDst, 3, 'Europe/London'), 'Europe/London'), '2026-10-26, 00:00');
ok('...and that is 00:00 GMT, an hour different from before the change',
	new Date(startOfLocalDayAfter(preDst, 3, 'Europe/London')).toISOString(), '2026-10-26T00:00:00.000Z');
// Spring forward 01:00 → 02:00 on Sunday 29 Mar 2026.
const preSpring = Date.UTC(2026, 2, 27, 12, 0);
ok('crossing the spring DST change still lands on local midnight',
	iso(startOfLocalDayAfter(preSpring, 2, 'Europe/London'), 'Europe/London'), '2026-03-29, 00:00');

// A zone with a half-hour offset, where an hour-based fudge would be visibly wrong.
ok('half-hour offset zones land on local midnight',
	iso(earliestBookableMs(sep23, 2, 'Asia/Kolkata'), 'Asia/Kolkata'), '2026-09-25, 00:00');

// ── month and year ends ───────────────────────────────────────────────────────
ok('rolls over a month end', iso(earliestBookableMs(Date.UTC(2026, 8, 30, 12, 0), 2, 'Europe/London'), 'Europe/London'), '2026-10-02, 00:00');
ok('rolls over a year end', iso(earliestBookableMs(Date.UTC(2026, 11, 31, 12, 0), 2, 'Europe/London'), 'Europe/London'), '2027-01-02, 00:00');
ok('handles a leap day', iso(earliestBookableMs(Date.UTC(2028, 1, 27, 12, 0), 2, 'Europe/London'), 'Europe/London'), '2028-02-29, 00:00');

// ── an unknown timezone must not open the gate ────────────────────────────────
const bogus = earliestBookableMs(sep23, 2, 'Mars/Olympus_Mons');
ok('an unknown timezone still enforces a cutoff rather than allowing everything', bogus > 0, true);
ok('...and that cutoff is UTC days', new Date(bogus).toISOString(), '2026-09-25T00:00:00.000Z');

// ── the filter itself, both directions ────────────────────────────────────────
// A false REJECT hides real availability and the form looks empty; a false ACCEPT books the
// very same-day meeting this setting exists to prevent. Both are asserted.
const cutoff = earliestBookableMs(sep23, 2, 'Europe/London');
ok('a slot today is refused', slotIsBookable(Date.UTC(2026, 8, 23, 16, 0), cutoff), false);
ok('a slot tomorrow is refused', slotIsBookable(Date.UTC(2026, 8, 24, 16, 0), cutoff), false);
ok('a slot one second before the cutoff is refused', slotIsBookable(cutoff - 1, cutoff), false);
ok('the cutoff instant itself is allowed', slotIsBookable(cutoff, cutoff), true);
ok('a slot on the qualifying day is allowed', slotIsBookable(Date.UTC(2026, 8, 25, 9, 0), cutoff), true);
ok('a slot next week is allowed', slotIsBookable(Date.UTC(2026, 9, 1, 9, 0), cutoff), true);
ok('with no lead time every slot passes, including one now', slotIsBookable(sep23, 0), true);

if (failures.length) {
	console.error(`\n✗ ${failures.length} failed, ${passed} passed\n`);
	for (const f of failures) console.error('  ' + f);
	process.exit(1);
}
console.log(`✓ ${passed} assertions passed`);
