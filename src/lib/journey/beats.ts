import { live } from '$lib/content/runtime';

export type BeatId =
	| 'beat-hero'
	| 'beat-scene-1'
	| 'beat-scene-2'
	| 'beat-scene-3'
	| 'beat-scene-4'
	| 'beat-scene-5'
	| 'beat-scene-6'
	| 'beat-lens'
	| 'beat-emergence'
	| 'beat-doors';

/** Section cue: shown from `at` (progress 0–1) until the next visible section. */
export type BeatDef = {
	id: BeatId;
	at: number;
	/** When true, section text is not shown. */
	hidden?: boolean;
};

export const BEAT_LABELS: Record<BeatId, string> = live((c) => c.journey.ui.beatLabels);

/**
 * Default cue points as scroll progress (0–1).
 * Hero holds; six journey scenes; then one frozen payoff clip (lens, text only).
 */
export const DEFAULT_BEAT_DEFS: BeatDef[] = [
	{ id: 'beat-hero', at: 0 },
	{ id: 'beat-scene-1', at: 0.08 },
	{ id: 'beat-scene-2', at: 0.18 },
	{ id: 'beat-scene-3', at: 0.28 },
	{ id: 'beat-scene-4', at: 0.38 },
	{ id: 'beat-scene-5', at: 0.48 },
	{ id: 'beat-scene-6', at: 0.58 },
	{ id: 'beat-lens', at: 0.72 },
	{ id: 'beat-emergence', at: 0.8, hidden: true },
	{ id: 'beat-doors', at: 0.9, hidden: true }
];

export const BEAT_DEFS = DEFAULT_BEAT_DEFS;

export const TIMING_STORAGE_KEY = 'journey-beat-at-v5';

export function cloneBeatDefs(defs: BeatDef[] = DEFAULT_BEAT_DEFS): BeatDef[] {
	return defs.map((b, i) => ({
		id: b.id,
		at: b.at,
		hidden: Boolean(DEFAULT_BEAT_DEFS[i]?.hidden || b.hidden)
	}));
}

export function isValidBeatDefs(value: unknown): value is BeatDef[] {
	if (!Array.isArray(value) || value.length !== DEFAULT_BEAT_DEFS.length) return false;
	return value.every((item, i) => {
		const expected = DEFAULT_BEAT_DEFS[i]!;
		const beat = item as BeatDef;
		return (
			item &&
			typeof item === 'object' &&
			beat.id === expected.id &&
			typeof beat.at === 'number' &&
			Number.isFinite(beat.at) &&
			(beat.hidden === undefined || typeof beat.hidden === 'boolean')
		);
	});
}

export function loadBeatDefsForVideo(videoSrc: string): BeatDef[] {
	try {
		const raw = localStorage.getItem(TIMING_STORAGE_KEY);
		if (!raw) return cloneBeatDefs();
		const all = JSON.parse(raw) as Record<string, unknown>;
		const saved = all[videoSrc];
		if (isValidBeatDefs(saved)) return cloneBeatDefs(saved);
	} catch {
		/* ignore */
	}
	return cloneBeatDefs();
}

export function saveBeatDefsForVideo(videoSrc: string, defs: BeatDef[]) {
	try {
		const raw = localStorage.getItem(TIMING_STORAGE_KEY);
		const all = raw ? (JSON.parse(raw) as Record<string, BeatDef[]>) : {};
		all[videoSrc] = cloneBeatDefs(defs);
		localStorage.setItem(TIMING_STORAGE_KEY, JSON.stringify(all));
	} catch {
		/* ignore quota / private mode */
	}
}

export function clearBeatDefsForVideo(videoSrc: string) {
	try {
		const raw = localStorage.getItem(TIMING_STORAGE_KEY);
		if (!raw) return;
		const all = JSON.parse(raw) as Record<string, BeatDef[]>;
		delete all[videoSrc];
		localStorage.setItem(TIMING_STORAGE_KEY, JSON.stringify(all));
	} catch {
		/* ignore */
	}
}

/**
 * Half-open window [from, to) so neighbouring beats share a boundary
 * without a blank gap between them. The last visible beat is open through 1.
 */
export function beatWindow(
	beats: BeatDef[],
	index: number
): { from: number; to: number } {
	const beat = beats[index]!;
	const from = index === 0 ? -0.02 : beat.at;
	let to = 1.03;
	for (let i = index + 1; i < beats.length; i++) {
		if (!beats[i]!.hidden) {
			to = beats[i]!.at;
			break;
		}
	}
	return { from, to: Math.max(from + 0.001, to) };
}

export function isBeatActive(progress: number, beats: BeatDef[], index: number): boolean {
	const beat = beats[index];
	if (!beat || beat.hidden) return false;
	const { from, to } = beatWindow(beats, index);
	if (to >= 1) return progress >= from;
	return progress >= from && progress < to;
}

export function isSceneBeatId(id: BeatId): boolean {
	return id.startsWith('beat-scene-');
}

/** Shared frozen payoff clip: lens (emergence / doors hidden for now). */
export function isPayoffBeatId(id: BeatId): boolean {
	return id === 'beat-lens' || id === 'beat-emergence' || id === 'beat-doors';}

/** Local 0–1 progress within a beat's scroll window. */
export function beatLocalProgress(progress: number, beats: BeatDef[], index: number): number {
	const { from, to } = beatWindow(beats, index);
	return Math.min(1, Math.max(0, (progress - from) / Math.max(0.01, to - from)));
}

/** Scene copy appears this many seconds after the clip starts. */
export const SCENE_TEXT_AFTER_SECONDS = 1.5;

/** @deprecated Use SCENE_TEXT_AFTER_SECONDS — kept as alias for older call sites. */
export const SCENE_TEXT_LEAD_SECONDS = SCENE_TEXT_AFTER_SECONDS;

/** Local progress threshold for scene text, from clip duration. */
export function sceneTextThreshold(
	clipDuration: number,
	afterSeconds = SCENE_TEXT_AFTER_SECONDS
): number {
	const after = Math.max(0.25, afterSeconds);
	if (!clipDuration || !Number.isFinite(clipDuration) || clipDuration <= after) {
		return 0.2;
	}
	return Math.max(0.05, Math.min(0.9, after / clipDuration));
}

export function isSceneTextActive(
	progress: number,
	beats: BeatDef[],
	index: number,
	clipDuration = 0,
	afterSeconds = SCENE_TEXT_AFTER_SECONDS
): boolean {
	const beat = beats[index];
	if (!beat || beat.hidden || !isSceneBeatId(beat.id)) return false;
	if (!isBeatActive(progress, beats, index)) return false;
	return beatLocalProgress(progress, beats, index) >= sceneTextThreshold(clipDuration, afterSeconds);
}

export function navJumpsFromBeats(beats: BeatDef[]) {
	const at = (id: BeatId, fallback: number) => beats.find((b) => b.id === id)?.at ?? fallback;
	return {
		hero: at('beat-hero', 0),
		platform: at('beat-lens', 0.72)
	};
}

export const NAV_JUMPS = navJumpsFromBeats(DEFAULT_BEAT_DEFS);

export function initialActiveBeats(
	allOn = false,
	beats: BeatDef[] = DEFAULT_BEAT_DEFS
): Record<BeatId, boolean> {
	return Object.fromEntries(
		beats.map((b) => [b.id, allOn ? !b.hidden : b.id === 'beat-hero' && !b.hidden])
	) as Record<BeatId, boolean>;
}

export function nextBeatProgress(
	current: number,
	beats: BeatDef[] = DEFAULT_BEAT_DEFS,
	clipDuration = 0,
	leadSeconds = SCENE_TEXT_LEAD_SECONDS
): number {
	for (let i = 0; i < beats.length; i++) {
		const beat = beats[i]!;
		if (beat.hidden) continue;
		const focus = beatFocusProgress(beat, beats, clipDuration, leadSeconds);
		if (focus > current + 0.012) return focus;
	}
	return 1;
}

/** Previous beat focus behind the current progress, or 0. */
export function prevBeatProgress(
	current: number,
	beats: BeatDef[] = DEFAULT_BEAT_DEFS,
	clipDuration = 0,
	leadSeconds = SCENE_TEXT_LEAD_SECONDS
): number {
	let prev = 0;
	for (let i = 0; i < beats.length; i++) {
		const beat = beats[i]!;
		if (beat.hidden) continue;
		const focus = beatFocusProgress(beat, beats, clipDuration, leadSeconds);
		if (focus < current - 0.012) prev = focus;
		else break;
	}
	return prev;
}

/** Scroll target when focusing a beat — scenes land on the text reveal. */
export function beatFocusProgress(
	beat: BeatDef,
	beats: BeatDef[] = DEFAULT_BEAT_DEFS,
	clipDuration = 0,
	leadSeconds = SCENE_TEXT_LEAD_SECONDS
): number {
	const index = beats.findIndex((b) => b.id === beat.id);
	if (index >= 0 && isSceneBeatId(beat.id)) {
		const { from, to } = beatWindow(beats, index);
		return from + (to - from) * sceneTextThreshold(clipDuration, leadSeconds);
	}
	return Math.min(1, Math.max(0, beat.at));
}

export function currentBeatIndex(current: number, beats: BeatDef[] = DEFAULT_BEAT_DEFS): number {
	let index = 0;
	for (let i = 0; i < beats.length; i++) {
		if (beats[i]!.at <= current + 0.001) index = i;
		else break;
	}
	return index;
}

/** Next visible beat index at or after `fromIndex`, or -1. */
export function nextVisibleBeatIndex(beats: BeatDef[], fromIndex: number): number {
	for (let i = Math.max(0, fromIndex); i < beats.length; i++) {
		if (!beats[i]!.hidden) return i;
	}
	return -1;
}

export function progressToSeconds(progress: number, duration: number): number {
	if (!duration || !Number.isFinite(duration)) return 0;
	return Math.max(0, progress) * duration;
}

export function secondsToProgress(seconds: number, duration: number): number {
	if (!duration || !Number.isFinite(duration) || duration <= 0) return 0;
	return Math.max(0, seconds) / duration;
}

export function formatSeconds(seconds: number): string {
	if (!Number.isFinite(seconds)) return '0.0';
	return Math.max(0, seconds).toFixed(1);
}

export function splitMinSec(totalSeconds: number): { min: number; sec: number } {
	const clamped = Math.max(0, Number.isFinite(totalSeconds) ? totalSeconds : 0);
	const min = Math.floor(clamped / 60);
	const sec = Math.round((clamped - min * 60) * 10) / 10;
	return { min, sec };
}

export function joinMinSec(min: number, sec: number): number {
	const m = Number.isFinite(min) ? Math.max(0, min) : 0;
	const s = Number.isFinite(sec) ? Math.max(0, sec) : 0;
	return m * 60 + s;
}

export function formatMinSec(totalSeconds: number): string {
	const { min, sec } = splitMinSec(totalSeconds);
	const whole = Math.floor(sec);
	const frac = Math.round((sec - whole) * 10);
	const secStr = `${String(whole).padStart(2, '0')}${frac ? `.${frac}` : ''}`;
	return `${min}:${secStr}`;
}
