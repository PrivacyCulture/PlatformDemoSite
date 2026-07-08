export type BeatId =
	| 'beat-hero'
	| 'beat-clutter-1'
	| 'beat-clutter-2'
	| 'beat-clutter-3'
	| 'beat-clutter-4'
	| 'beat-clutter-5'
	| 'beat-free'
	| 'beat-lens'
	| 'beat-platform'
	| 'beat-doors';

export type BeatDef = {
	id: BeatId;
	from: number;
	to: number;
};

export const BEAT_DEFS: BeatDef[] = [
	{ id: 'beat-hero', from: -0.02, to: 0.05 },
	{ id: 'beat-clutter-1', from: 0.08, to: 0.135 },
	{ id: 'beat-clutter-2', from: 0.155, to: 0.21 },
	{ id: 'beat-clutter-3', from: 0.23, to: 0.285 },
	{ id: 'beat-clutter-4', from: 0.305, to: 0.36 },
	{ id: 'beat-clutter-5', from: 0.38, to: 0.44 },
	{ id: 'beat-free', from: 0.48, to: 0.62 },
	{ id: 'beat-lens', from: 0.66, to: 0.78 },
	{ id: 'beat-platform', from: 0.81, to: 0.9 },
	{ id: 'beat-doors', from: 0.93, to: 1.03 }
];

export const NAV_JUMPS = {
	free: 0.54,
	platform: 0.84,
	start: 0.96
} as const;

export function initialActiveBeats(allOn = false): Record<BeatId, boolean> {
	return Object.fromEntries(BEAT_DEFS.map((b) => [b.id, allOn ? true : b.id === 'beat-hero'])) as Record<
		BeatId,
		boolean
	>;
}

/** Jump to the next beat after the current scroll position. */
export function nextBeatProgress(current: number): number {
	for (const beat of BEAT_DEFS) {
		if (beat.from > current + 0.012) {
			return beat.from + (beat.to - beat.from) * 0.35;
		}
	}
	return 1;
}

/** Mid-window scroll progress for a beat (good resting point while touring). */
export function beatFocusProgress(beat: BeatDef): number {
	const from = Math.max(0, beat.from);
	const to = Math.min(1, beat.to);
	return from + (to - from) * 0.35;
}

/** Index of the beat currently under the scroll position, or -1. */
export function currentBeatIndex(current: number): number {
	for (let i = 0; i < BEAT_DEFS.length; i++) {
		const beat = BEAT_DEFS[i]!;
		if (current >= beat.from && current <= beat.to) return i;
	}
	// Between beats: next one ahead
	for (let i = 0; i < BEAT_DEFS.length; i++) {
		if (BEAT_DEFS[i]!.from > current) return i;
	}
	return BEAT_DEFS.length - 1;
}
