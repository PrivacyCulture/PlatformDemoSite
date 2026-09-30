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

/** Frame rate the scene clips are rendered at. */
export const CLIP_FPS = 24;

/**
 * Each scene window is split into three zones, as fractions of its span:
 * a short head that holds the first frame, the play zone that maps scroll to frames,
 * and a rest zone that holds the last frame. Next lands in the head, a finished clip
 * (and Back) parks in the rest, so a scene can sit on either end frame well clear of
 * the boundary where the clip swaps.
 */
export const SCENE_HEAD_PAD = 0.03;
export const SCENE_REST_PAD = 0.08;

export type SceneZones = {
	from: number;
	to: number;
	/** Scroll progress where frame 0 starts to advance. */
	playFrom: number;
	/** Scroll progress where the last frame is reached. */
	playTo: number;
	/** Middle of the head zone: where Next lands (frame 0). */
	enter: number;
	/** Middle of the rest zone: where a finished clip parks (last frame). */
	rest: number;
};

export function sceneZones(beats: BeatDef[], index: number): SceneZones {
	const { from, to } = beatWindow(beats, index);
	const span = to - from;
	const playFrom = from + span * SCENE_HEAD_PAD;
	const playTo = to - span * SCENE_REST_PAD;
	return {
		from,
		to,
		playFrom,
		playTo,
		enter: from + (span * SCENE_HEAD_PAD) / 2,
		rest: to - (span * SCENE_REST_PAD) / 2
	};
}

/** 0 in the head zone, 1 in the rest zone, linear across the play zone. */
export function sceneLocalProgress(progress: number, beats: BeatDef[], index: number): number {
	const { playFrom, playTo } = sceneZones(beats, index);
	return Math.min(1, Math.max(0, (progress - playFrom) / Math.max(0.0001, playTo - playFrom)));
}

/** Scroll progress in a scene's play zone for a playhead fraction 0–1. */
export function sceneProgressAt(beats: BeatDef[], index: number, local: number): number {
	const { playFrom, playTo } = sceneZones(beats, index);
	return playFrom + (playTo - playFrom) * Math.min(1, Math.max(0, local));
}

/** Number of frames in a clip of `duration` seconds. */
export function frameCount(duration: number, fps = CLIP_FPS): number {
	if (!duration || !Number.isFinite(duration)) return 1;
	return Math.max(1, Math.round(duration * fps));
}

/** Seek time that shows the last frame (its centre, so it never reads as the end). */
export function lastFrameTime(duration: number, fps = CLIP_FPS): number {
	if (!duration || !Number.isFinite(duration)) return 0;
	return Math.max(0, duration - 0.5 / fps);
}

/** Seek time for frame `index`: the centre of the frame, clamped to the last frame. */
export function frameTime(index: number, duration: number, fps = CLIP_FPS): number {
	return Math.min(lastFrameTime(duration, fps), Math.max(0, (index + 0.5) / fps));
}

/** Frame showing at playhead `time`. */
export function frameIndexAt(time: number, duration: number, fps = CLIP_FPS): number {
	const last = frameCount(duration, fps) - 1;
	return Math.min(last, Math.max(0, Math.round(time * fps - 0.5)));
}

/** Where Next / the scene index land: a scene's first frame, or the beat's cue point. */
export function beatEnterProgress(beat: BeatDef, beats: BeatDef[]): number {
	const index = beats.findIndex((b) => b.id === beat.id);
	if (index >= 0 && isSceneBeatId(beat.id)) return sceneZones(beats, index).enter;
	return Math.min(1, Math.max(0, beat.at));
}

/** Where Back lands: a scene's last frame, the top for the hero, or the beat's cue point. */
export function beatRestProgress(beat: BeatDef, beats: BeatDef[]): number {
	if (beat.id === 'beat-hero') return 0;
	const index = beats.findIndex((b) => b.id === beat.id);
	if (index >= 0 && isSceneBeatId(beat.id)) return sceneZones(beats, index).rest;
	return Math.min(1, Math.max(0, beat.at));
}

/** Previous visible beat before `index`, or 0 (the hero). */
export function prevVisibleBeatIndex(beats: BeatDef[], index: number): number {
	for (let i = Math.min(index, beats.length) - 1; i >= 0; i--) {
		if (!beats[i]!.hidden) return i;
	}
	return 0;
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
	return sceneLocalProgress(progress, beats, index) >= sceneTextThreshold(clipDuration, afterSeconds);
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
		return sceneProgressAt(beats, index, sceneTextThreshold(clipDuration, leadSeconds));
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
