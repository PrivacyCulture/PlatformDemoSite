// Scroll-to-frame maths for the home journey: scene zones, frame quantising, Back targets.
// npx tsx --tsconfig .svelte-kit/tsconfig.json scripts/test-scene-scrub.ts
import {
	beatEnterProgress,
	beatRestProgress,
	beatWindow,
	DEFAULT_BEAT_DEFS,
	frameCount,
	frameIndexAt,
	frameTime,
	lastFrameTime,
	prevVisibleBeatIndex,
	sceneLocalProgress,
	sceneProgressAt,
	sceneZones
} from '../src/lib/journey/beats';

let passed = 0;
const failures: string[] = [];
function ok(label: string, actual: unknown, expected: unknown) {
	if (JSON.stringify(actual) === JSON.stringify(expected)) passed++;
	else failures.push(`${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`);
}
const near = (label: string, actual: number, expected: number, eps = 1e-6) =>
	ok(label, Math.abs(actual - expected) < eps ? expected : actual, expected);

const beats = DEFAULT_BEAT_DEFS;
const idx = (id: string) => beats.findIndex((b) => b.id === id);
const s1 = idx('beat-scene-1');
const s2 = idx('beat-scene-2');
const s6 = idx('beat-scene-6');
const lens = idx('beat-lens');

// ── zones ─────────────────────────────────────────────────────────────────────
const z = sceneZones(beats, s2);
ok('zones sit inside the beat window', z.from < z.enter && z.enter < z.playFrom && z.playFrom < z.playTo && z.playTo < z.rest && z.rest < z.to, true);
near('zone window matches beatWindow', z.from, beatWindow(beats, s2).from);
near('zone window end matches beatWindow', z.to, beatWindow(beats, s2).to);

// ── scroll → local playhead ───────────────────────────────────────────────────
ok('head zone holds the first frame', sceneLocalProgress(z.enter, beats, s2), 0);
ok('rest zone holds the last frame', sceneLocalProgress(z.rest, beats, s2), 1);
near('play zone is linear', sceneLocalProgress((z.playFrom + z.playTo) / 2, beats, s2), 0.5);
for (const local of [0, 0.25, 0.5, 0.9, 1]) {
	near(`progress round-trips at ${local}`, sceneLocalProgress(sceneProgressAt(beats, s2, local), beats, s2), local);
}
// A clip playing to its end never scrolls past its own window.
ok('playhead end stays in the scene', sceneProgressAt(beats, s6, 1) < beats[lens]!.at, true);

// ── frames ────────────────────────────────────────────────────────────────────
ok('5 s at 24 fps is 120 frames', frameCount(5), 120);
ok('5.042 s at 24 fps is 121 frames', frameCount(5.042), 121);
ok('bad duration counts one frame', frameCount(NaN), 1);
near('frame 0 seeks to its centre', frameTime(0, 5), 0.5 / 24);
near('last frame time', lastFrameTime(5), 5 - 0.5 / 24);
near('frame time clamps to the last frame', frameTime(500, 5), lastFrameTime(5));
for (const i of [0, 1, 60, 119]) ok(`frame ${i} round-trips`, frameIndexAt(frameTime(i, 5), 5), i);
ok('last frame time is the last frame', frameIndexAt(lastFrameTime(5), 5), 119);
ok('ended playhead is the last frame', frameIndexAt(5, 5), 119);
ok('ended playhead, 121-frame clip', frameIndexAt(5.042, 5.042), 120);
ok('negative time is frame 0', frameIndexAt(-1, 5), 0);

// ── Next / Back landing points ────────────────────────────────────────────────
near('Next lands on the enter point', beatEnterProgress(beats[s2]!, beats), z.enter);
near('Back lands on the rest point', beatRestProgress(beats[s2]!, beats), z.rest);
ok('Back to the hero is the top', beatRestProgress(beats[0]!, beats), 0);
ok('lens lands on its cue', beatRestProgress(beats[lens]!, beats), beats[lens]!.at);
ok('Back from scene 2 is scene 1', prevVisibleBeatIndex(beats, s2), s1);
ok('Back from scene 1 is the hero', prevVisibleBeatIndex(beats, s1), 0);
ok('Back from the lens is scene 6', prevVisibleBeatIndex(beats, lens), s6);
ok('Back from the hero stays on the hero', prevVisibleBeatIndex(beats, 0), 0);
ok('Back skips hidden beats', prevVisibleBeatIndex(beats, idx('beat-doors')), lens);

if (failures.length) {
	console.error(`\n✗ ${failures.length} failed, ${passed} passed\n`);
	for (const f of failures) console.error('  ' + f);
	process.exit(1);
}
console.log(`✓ ${passed} assertions passed`);
