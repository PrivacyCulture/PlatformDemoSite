import {
	CHECKBOX_YES,
	emptyExtraAnswers,
	extraAnswerRows,
	extraHubSpotProperties,
	isUsableHubSpotProperty,
	normalizeExtraAnswers,
	parseExtraFields,
	validateExtraAnswers
} from '../src/lib/demo/extra-fields';
import { buildDemoNotification, describeBookingSource } from '../src/lib/demo/notification';

let passed = 0;
const failures: string[] = [];
function ok(label: string, actual: unknown, expected: unknown) {
	if (JSON.stringify(actual) === JSON.stringify(expected)) passed++;
	else failures.push(`${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`);
}

const messages = { required: 'Required.', invalid: 'Pick one.' };

// ── reading what Sorted stores (everything is text) ───────────────────────────
const stored = [
	{ id: 'team-size', label: 'How big is the privacy team?', type: 'select', required: 'yes', options: 'Just me\n2–5\n\n2–5\n6+', placeholder: 'Pick one', hubspotProperty: 'pc_privacy_team' },
	{ id: 'notes', label: 'Anything else?', type: 'textarea', required: 'no', options: '', placeholder: 'Optional', hubspotProperty: '' },
	{ id: 'consent', label: 'I agree to be contacted', type: 'checkbox', required: 'yes', options: '', placeholder: 'ignored', hubspotProperty: 'Pc_Consent' }
];
const fields = parseExtraFields(stored);
ok('three questions read', fields.map((f) => f.id), ['team-size', 'notes', 'consent']);
ok('required read from "yes"', fields.map((f) => f.required), [true, false, true]);
ok('options split on lines, blanks and repeats dropped', fields[0].options, ['Just me', '2–5', '6+']);
ok('a dropdown keeps its placeholder', fields[0].placeholder, 'Pick one');
ok('a tick box has no placeholder', fields[2].placeholder, '');
ok('a property is lower-cased', fields[2].hubspotProperty, 'pc_consent');

// …and a hand-written file's booleans and arrays
ok('booleans and arrays read too', parseExtraFields([{ label: 'Q', type: 'select', required: true, options: ['A', 'B'] }])[0], {
	id: 'q', label: 'Q', type: 'select', required: true, options: ['A', 'B'], placeholder: '', hubspotProperty: ''
});

// ── what is dropped ───────────────────────────────────────────────────────────
ok('not a list → nothing', parseExtraFields('x'), []);
ok('no label → dropped', parseExtraFields([{ type: 'text' }]), []);
ok('unknown type → dropped', parseExtraFields([{ label: 'Q', type: 'radio' }]), []);
ok('a dropdown with one choice → dropped', parseExtraFields([{ label: 'Q', type: 'select', options: 'Only' }]), []);
ok('repeated ids are made unique', parseExtraFields([{ id: 'a', label: 'A', type: 'text' }, { id: 'a', label: 'B', type: 'text' }]).map((f) => f.id), ['a', 'a-2']);
ok('at most 20', parseExtraFields(Array.from({ length: 30 }, (_, i) => ({ label: `Q${i}`, type: 'text' }))).length, 20);

// ── HubSpot property names ────────────────────────────────────────────────────
ok('a custom property is usable', isUsableHubSpotProperty('pc_privacy_team'), true);
ok('email is reserved', isUsableHubSpotProperty('email'), false);
ok('the owner is reserved', isUsableHubSpotProperty('hubspot_owner_id'), false);
ok('first-touch source is reserved', isUsableHubSpotProperty('hs_analytics_source'), false);
ok('spaces are not a property name', isUsableHubSpotProperty('team size'), false);
ok('a reserved name is read as none', parseExtraFields([{ label: 'Email', type: 'text', hubspotProperty: 'email' }])[0].hubspotProperty, '');

// ── answers ───────────────────────────────────────────────────────────────────
ok('empty answers for every question', emptyExtraAnswers(fields), { 'team-size': '', notes: '', consent: '' });
const answers = normalizeExtraAnswers(fields, { 'team-size': ' 2–5 ', notes: '  hi ', consent: true, stranger: 'dropped' });
ok('trimmed, tick box read as Yes, unknown question dropped', answers, { 'team-size': '2–5', notes: 'hi', consent: CHECKBOX_YES });
ok('a tick box "true" string is Yes', normalizeExtraAnswers(fields, { consent: 'true' }).consent, CHECKBOX_YES);
ok('an unticked box is blank', normalizeExtraAnswers(fields, { consent: false }).consent, '');
ok('an answer is capped', normalizeExtraAnswers(fields, { notes: 'x'.repeat(5000) }).notes.length, 2000);
ok('not an object → all blank', normalizeExtraAnswers(fields, null), { 'team-size': '', notes: '', consent: '' });

// ── validation, both ways ─────────────────────────────────────────────────────
ok('a full set passes', validateExtraAnswers(fields, answers, messages), {});
ok('required blanks are refused; optional ones are not', validateExtraAnswers(fields, emptyExtraAnswers(fields), messages), { 'team-size': 'Required.', consent: 'Required.' });
ok('a choice not on the list is refused', validateExtraAnswers(fields, { ...answers, 'team-size': '7' }, messages), { 'team-size': 'Pick one.' });
ok('an optional dropdown left blank passes', validateExtraAnswers(parseExtraFields([{ label: 'Q', type: 'select', options: 'A\nB' }]), { q: '' }, messages), {});

// ── where answers go ──────────────────────────────────────────────────────────
ok('email rows: answered only, in order', extraAnswerRows(fields, { ...answers, notes: '' }), [
	{ label: 'How big is the privacy team?', value: '2–5' },
	{ label: 'I agree to be contacted', value: 'Yes' }
]);
ok('HubSpot gets mapped, answered questions only', extraHubSpotProperties(fields, answers), { pc_privacy_team: '2–5', pc_consent: 'Yes' });
ok('a blank answer is never sent to HubSpot', extraHubSpotProperties(fields, { ...answers, 'team-size': '' }), { pc_consent: 'Yes' });
const twice = parseExtraFields([
	{ label: 'A', type: 'text', hubspotProperty: 'pc_x' },
	{ label: 'B', type: 'text', hubspotProperty: 'pc_x' }
]);
ok('two questions on one property: the first answered wins', extraHubSpotProperties(twice, { a: '', b: 'second' }), { pc_x: 'second' });

// ── the team email carries them ───────────────────────────────────────────────
const note = buildDemoNotification({
	form: { firstName: 'Ann', lastName: 'Lee', email: 'ann@acme.com', company: 'Acme', role: 'DPO', employeeBand: 'above 5,000', tooling: 'other', timing: 'exploring', isoGate: '', improve: '', phone: '' },
	extraAnswers: [{ label: 'Team <size>', value: '2–5' }],
	start: '2026-11-10T10:00:00Z',
	end: '2026-11-10T10:30:00Z',
	timezone: 'Europe/London',
	isOffline: false,
	utms: {},
	pageUtms: {},
	site: { name: 'Test', origin: 'https://example.com' }
});
ok('the email text lists the answer', note.text.includes('Team <size>: 2–5'), true);
ok('the email HTML escapes the label', note.html.includes('Team &lt;size&gt;'), true);

// ── where the booking was made: the same words in the email and on HubSpot ────
const src = describeBookingSource({ site: { name: 'Privacy Culture Platform website', origin: 'https://privacyculture.ai' }, bookingPath: '/demo', from: 'pricing' });
ok('the three source values', src, {
	website: 'Privacy Culture Platform website (privacyculture.ai)',
	bookingPage: 'https://privacyculture.ai/demo',
	cameFrom: 'pricing'
});
ok('no from= reads as opened directly', describeBookingSource({ site: { name: 'X', origin: 'https://x.com' }, bookingPath: '/demo' }).cameFrom, 'None, the booking page was opened directly');
ok('the email shows exactly those values', ['Website: ' + src.website, 'Booking page: ' + src.bookingPage, 'Came from page: ' + src.cameFrom].every((l) =>
	buildDemoNotification({ form: { firstName: 'A', lastName: 'B', email: 'a@b.com', company: '', role: '', employeeBand: '', tooling: '', timing: '', isoGate: '', improve: '', phone: '' }, start: '2026-11-10T10:00:00Z', end: '2026-11-10T10:30:00Z', timezone: 'Europe/London', isOffline: false, utms: {}, pageUtms: {}, from: 'pricing', bookingPath: '/demo', site: { name: 'Privacy Culture Platform website', origin: 'https://privacyculture.ai' } }).text.includes(l)
), true);
ok('an extra question cannot take one of these properties', isUsableHubSpotProperty('pc_demo_came_from'), false);

if (failures.length) {
	console.error(`${failures.length} failed, ${passed} passed:\n  ${failures.join('\n  ')}`);
	process.exit(1);
}
console.log(`demo extra fields: ${passed} passed`);
