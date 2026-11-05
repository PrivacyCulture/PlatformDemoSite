// Offline: the Book a demo form beside a hero asks the /demo form's questions over two views.
// Run: npx tsx scripts/test-demo-steps.ts
//
// What matters: every question the form has is asked by exactly one view, so nothing the /demo
// form collects is skipped beside a hero, and each view shows only its own errors.
import { readFileSync } from 'node:fs';
import { DEMO_STEP_KEYS, firstStepWithErrors, stepErrors } from '../src/lib/demo/steps';
import type { DemoFormErrors } from '../src/lib/demo/fields';

let passed = 0;
const failures: string[] = [];
function ok(label: string, actual: unknown, expected: unknown) {
	if (JSON.stringify(actual) === JSON.stringify(expected)) passed++;
	else failures.push(`${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`);
}

// The form's questions, read from emptyDemoForm in fields.ts (which needs the site's runtime to import).
const src = readFileSync('src/lib/demo/fields.ts', 'utf8');
const body = src.match(/emptyDemoForm = \(\): DemoFormValues => \(\{([\s\S]*?)\}\);/)?.[1] ?? '';
const formKeys = [...body.matchAll(/^\s*([a-zA-Z]+):/gm)].map((m) => m[1]).filter((k) => k !== 'extra');
ok('the form’s questions were found', formKeys.length > 5, true);

const asked = [...DEMO_STEP_KEYS.about, ...DEMO_STEP_KEYS.organisation];
ok('every question is asked by one of the two views', [...formKeys].sort(), [...asked].sort());
ok('no question is asked twice', new Set(asked).size, asked.length);
ok('the first view is who you are', DEMO_STEP_KEYS.about, ['firstName', 'lastName', 'email', 'company', 'role']);

const all: DemoFormErrors = {
	firstName: 'a',
	email: 'b',
	role: 'c',
	employeeBand: 'd',
	tooling: 'e',
	extra: { 'team-size': 'f' }
};
ok('about shows only its own errors', stepErrors(all, 'about'), { firstName: 'a', email: 'b', role: 'c' });
ok('organisation shows its own and the added questions’', stepErrors(all, 'organisation'), { employeeBand: 'd', tooling: 'e', extra: { 'team-size': 'f' } });
ok('no errors, nothing shown', stepErrors({}, 'organisation'), {});
ok('an empty extra list is not an error', stepErrors({ extra: {} }, 'organisation'), {});

ok('the first view with an error is found', firstStepWithErrors(all), 'about');
ok('only organisation errors', firstStepWithErrors({ timing: 'x' }), 'organisation');
ok('only an added question', firstStepWithErrors({ extra: { q: 'x' } }), 'organisation');
ok('a good form has none', firstStepWithErrors({}), null);

if (failures.length) {
	console.error(failures.map((f) => `✗ ${f}`).join('\n'));
	console.error(`\n${failures.length} failed, ${passed} passed`);
	process.exit(1);
}
console.log(`All ${passed} checks passed`);
