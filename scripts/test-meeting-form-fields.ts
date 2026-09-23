import { selectMeetingFormFields } from '../src/lib/demo/meeting-form-fields';

let passed = 0;
const failures: string[] = [];
function ok(label: string, actual: unknown, expected: unknown) {
	if (JSON.stringify(actual) === JSON.stringify(expected)) passed++;
	else failures.push(`${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`);
}

// What the live link declares, as HubSpot's book-info call returns it.
const declared = [
	{ name: 'jobtitle', isRequired: false },
	{ name: 'company', isRequired: false }
];

// What the form collects, keyed by the name each would be sent under.
const values = {
	company: 'Privacy Culture',
	phone: '',
	jobtitle: 'DPO',
	pc_demo_role: 'DPO',
	pc_employee_band: '2,501–5,000',
	pc_current_tooling: 'specialist privacy tool',
	pc_eval_timing: 'next 3 months',
	pc_improve_notes: 'Test booking'
};

// ── the bug this exists to stop ───────────────────────────────────────────────
// Both directions matter and are not symmetrical: sending one name the link does not declare
// rejects the ENTIRE booking with "formFields contains invalid name(s)" at the last step, after
// the visitor has picked a time; dropping one it does declare merely leaves a note off the
// meeting, where the contact patch has written the answer anyway.
ok('only the declared names survive', selectMeetingFormFields(declared, values), [
	{ name: 'jobtitle', value: 'DPO' },
	{ name: 'company', value: 'Privacy Culture' }
]);
ok(
	'a value we hold under no declared name is dropped, never renamed',
	selectMeetingFormFields([{ name: 'company' }], values),
	[{ name: 'company', value: 'Privacy Culture' }]
);
ok('declared order is kept, not the order we happen to hold values in', selectMeetingFormFields(
	[{ name: 'company' }, { name: 'jobtitle' }],
	values
), [
	{ name: 'company', value: 'Privacy Culture' },
	{ name: 'jobtitle', value: 'DPO' }
]);

// ── nothing to send ───────────────────────────────────────────────────────────
ok('a link declaring nothing sends nothing', selectMeetingFormFields([], values), []);
ok('a lookup that failed sends nothing', selectMeetingFormFields(null, values), []);
ok('...and undefined reads the same way', selectMeetingFormFields(undefined, values), []);
ok('a declared field we hold nothing for is omitted', selectMeetingFormFields(
	[{ name: 'jobtitle' }, { name: 'phone' }],
	values
), [{ name: 'jobtitle', value: 'DPO' }]);
ok('an optional field left blank on the form is omitted, not sent empty', selectMeetingFormFields(
	[{ name: 'phone', isRequired: false }],
	{ phone: '   ' }
), []);

// A required field with nothing behind it is sent regardless, so the refusal that follows is
// HubSpot's own account of what is missing rather than a silent omission.
ok('a required field with no value is still named', selectMeetingFormFields(
	[{ name: 'phone', isRequired: true }],
	values
), [{ name: 'phone', value: '' }]);

// ── shapes HubSpot or a hand edit could produce ───────────────────────────────
ok('a repeated declaration is sent once', selectMeetingFormFields(
	[{ name: 'company' }, { name: 'company' }],
	values
), [{ name: 'company', value: 'Privacy Culture' }]);
ok('casing differences still match', selectMeetingFormFields(
	[{ name: 'Company' }],
	values
), [{ name: 'Company', value: 'Privacy Culture' }]);
ok('a nameless declaration is skipped', selectMeetingFormFields(
	[{ name: '  ' }, { name: 'company' }],
	values
), [{ name: 'company', value: 'Privacy Culture' }]);
ok('values are trimmed', selectMeetingFormFields(
	[{ name: 'company' }],
	{ company: '  Privacy Culture  ' }
), [{ name: 'company', value: 'Privacy Culture' }]);
ok('no values at all sends nothing', selectMeetingFormFields(declared, {}), []);

if (failures.length) {
	console.error(`\n✗ ${failures.length} failed, ${passed} passed\n`);
	for (const f of failures) console.error('  ' + f);
	process.exit(1);
}
console.log(`✓ ${passed} assertions passed`);
