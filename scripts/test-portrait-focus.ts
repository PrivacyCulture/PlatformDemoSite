import { focusAt, objectPositionX, parseFocus } from '../src/lib/journey/portrait-focus';

let passed = 0;
const failures: string[] = [];
function ok(label: string, actual: unknown, expected: unknown) {
	if (JSON.stringify(actual) === JSON.stringify(expected)) passed++;
	else failures.push(`${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`);
}
const near = (label: string, actual: number, expected: number) =>
	ok(label, Math.abs(actual - expected) < 0.01 ? expected : actual, expected);

// ── parseFocus ────────────────────────────────────────────────────────────────
ok('empty is centred', parseFocus(''), [[0, 50]]);
ok('undefined is centred', parseFocus(undefined), [[0, 50]]);
ok('gibberish is centred', parseFocus('left please'), [[0, 50]]);
ok('parses and sorts stops', parseFocus('1:64, 0:50 , 0.75:60'), [[0, 50], [0.75, 60], [1, 64]]);
ok('skips an unreadable stop', parseFocus('0:40, oops, 1:70'), [[0, 40], [1, 70]]);
ok('clamps out-of-range values', parseFocus('-1:-20, 2:150'), [[0, 0], [1, 100]]);

// ── focusAt ───────────────────────────────────────────────────────────────────
const stops = parseFocus('0.2:40, 0.6:80');
ok('holds the first stop before it', focusAt(stops, 0), 40);
ok('holds the last stop after it', focusAt(stops, 1), 80);
near('hits a stop exactly', focusAt(stops, 0.6), 80);
near('eases to the midpoint halfway', focusAt(stops, 0.4), 60);
ok('eases in: a quarter of the way is under a quarter of the move', focusAt(stops, 0.3) < 50, true);
ok('no stops is centred', focusAt([], 0.5), 50);

// ── objectPositionX ───────────────────────────────────────────────────────────
// iPhone 13 portrait over a 1280×720 clip shows 26% of the frame width.
near('centred subject stays centred', objectPositionX(50, 390, 844, 1280, 720), 50);
near('subject at 5% pins the crop to the left edge', objectPositionX(5, 390, 844, 1280, 720), 0);
near('subject at 95% pins the crop to the right edge', objectPositionX(95, 390, 844, 1280, 720), 100);
{
	const visible = 390 / 844 / (1280 / 720);
	const p = objectPositionX(70, 390, 844, 1280, 720) / 100;
	near('subject at 70% lands mid-screen', (1 - visible) * p + visible / 2, 0.7);
}
ok('a box wider than 16:9 is not cropped sideways', objectPositionX(80, 2000, 900, 1280, 720), 50);
ok('unknown video size stays centred', objectPositionX(80, 390, 844, 0, 0), 50);

if (failures.length) {
	console.error(`\n✗ ${failures.length} failed, ${passed} passed\n`);
	for (const f of failures) console.error('  ' + f);
	process.exit(1);
}
console.log(`✓ ${passed} assertions passed`);
