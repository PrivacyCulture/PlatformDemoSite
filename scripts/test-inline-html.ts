// Offline test for the inline HTML grammar, and for the site rendering nothing differently.
//   npx tsx scripts/test-inline-html.ts
//
// src/lib/site/inline-html.ts is a byte-identical copy of Sorted's src/lib/inline-html.ts.
// Two copies of one pure module is the deal — the site has no cheerio and hands its content to
// the browser, so SSR and hydration must apply the same rules from the same code. What stops
// the two copies drifting is this file: it asserts the SHA-256 of BOTH the module and the case
// fixture, and Sorted's own test asserts the same two constants.
//
// The load-bearing assertion is the last one: every string in the site's own content file reads
// back unchanged. Nothing about this change is allowed to alter a single word on the site.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
	escapeHtml,
	sanitizeInlineHtml,
	isSafeInlineHtml,
	renderInline,
	inlineToPlain,
	safeHref,
	restrictInlineHtml
} from '../src/lib/site/inline-html';
import { rich, plain } from '../src/lib/site/rich';

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
	if (cond) console.log(`  ✓ ${name}`);
	else {
		failures++;
		console.error(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`);
	}
}
function section(t: string) {
	console.log(`\n${t}`);
}

const MODULE_SHA256 = '214a6f2e0ca5e64132de34fdc3af9d0929579bdd63908512cb9488fe0a42e3cd';
const FIXTURE_SHA256 = '48bc06fca59c95ee3c85862ae8e2de79c73c233eb8761e8137d0d391e8f78c48';

const moduleSrc = readFileSync(new URL('../src/lib/site/inline-html.ts', import.meta.url), 'utf8');
const rawFixture = readFileSync(new URL('./fixtures/inline-html-cases.json', import.meta.url), 'utf8');

section('The two copies have not drifted');
check(
	'src/lib/site/inline-html.ts is byte-identical to Sorted’s',
	createHash('sha256').update(moduleSrc).digest('hex') === MODULE_SHA256,
	'Copy the file across and update MODULE_SHA256 in BOTH repos — never edit one side alone.'
);
check(
	'the case fixture is the same file Sorted tests against',
	createHash('sha256').update(rawFixture).digest('hex') === FIXTURE_SHA256
);

const fixture = JSON.parse(rawFixture) as {
	cases: { input: string; sanitized: string; inputIsSafe: boolean; rendered: string; plain: string }[];
	hrefs: { raw: string; safe: string | null }[];
	restrict: { input: string; output: string }[];
};

section('Every case, both directions');
let bad = '';
for (const c of fixture.cases) {
	const got = {
		sanitized: sanitizeInlineHtml(c.input),
		inputIsSafe: isSafeInlineHtml(c.input),
		rendered: renderInline(c.input),
		plain: inlineToPlain(renderInline(c.input))
	};
	for (const k of ['sanitized', 'inputIsSafe', 'rendered', 'plain'] as const) {
		if (got[k] !== c[k]) {
			bad = `${JSON.stringify(c.input)} · ${k}: got ${JSON.stringify(got[k])}, want ${JSON.stringify(c[k])}`;
			break;
		}
	}
	if (bad) break;
}
check(`all ${fixture.cases.length} cases behave as the fixture records`, !bad, bad);

let badHref = '';
for (const h of fixture.hrefs) {
	if (safeHref(h.raw) !== h.safe) {
		badHref = `${JSON.stringify(h.raw)}: got ${JSON.stringify(safeHref(h.raw))}, want ${JSON.stringify(h.safe)}`;
		break;
	}
}
check(`all ${fixture.hrefs.length} link cases behave as the fixture records`, !badHref, badHref);

section('The editor read path the CMS uses');
// Nothing on the site calls this — it is here because the module is shared byte for byte, and
// a case the CMS relies on must fail here too if somebody edits this copy.
let badR = '';
for (const r of fixture.restrict) {
	const got = restrictInlineHtml(r.input);
	if (got !== r.output) { badR = `${JSON.stringify(r.input)}: got ${JSON.stringify(got)}, want ${JSON.stringify(r.output)}`; break; }
	if (!isSafeInlineHtml(got)) { badR = `output fails the grammar: ${JSON.stringify(r.input)} → ${JSON.stringify(got)}`; break; }
}
check(`all ${fixture.restrict.length} editor reads behave as the fixture records`, !badR, badR);

section('rich() and plain()');
check('rich is renderInline', fixture.cases.every((c) => rich(c.input) === c.rendered));
check('plain is the words alone', fixture.cases.every((c) => plain(c.input) === c.plain));
check('both tolerate null and undefined', rich(null) === '' && plain(undefined) === '');
check('rich is idempotent, so a value rendered twice is rendered once', fixture.cases.every((c) => rich(rich(c.input)) === rich(c.input)));
check('plain strips markup rich would keep', plain('<strong>Bold</strong> words') === 'Bold words');
check('plain never leaves an entity in structured data', plain('Trust & Security') === 'Trust & Security');
check('memoising returns the same answer twice', fixture.cases.every((c) => rich(c.input) === rich(c.input) && plain(c.input) === plain(c.input)));

section('Nothing on the site renders differently than it does today');
const content = JSON.parse(readFileSync(new URL('../data/database.json', import.meta.url), 'utf8'));
const leaves: string[] = [];
(function walk(v: unknown) {
	if (typeof v === 'string') {
		leaves.push(v);
		return;
	}
	if (v && typeof v === 'object') Object.values(v as Record<string, unknown>).forEach(walk);
})(content);

check('the content file still holds a thousand strings to check', leaves.length > 900, `${leaves.length}`);
const drifted = leaves.filter((v) => plain(v) !== v);
check(
	`every one of ${leaves.length} strings reads back unchanged`,
	drifted.length === 0,
	drifted
		.slice(0, 5)
		.map((v) => `${JSON.stringify(v.slice(0, 70))}\n        → ${JSON.stringify(plain(v).slice(0, 70))}`)
		.join('\n      ')
);
const amped = leaves.filter((v) => v.includes('&'));
check(`the ${amped.length} values carrying an & are escaped, not passed through`, amped.every((v) => rich(v) === escapeHtml(v)));
check('nothing in the file is markup yet', leaves.every((v) => !v.includes('<')));

console.log(failures ? `\n${failures} failure(s)` : '\nAll passed');
process.exit(failures ? 1 : 0);
