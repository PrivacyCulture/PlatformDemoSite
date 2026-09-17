import type { BeatId } from '$lib/journey/beats';
// Imported (not served from /static) so Vite fingerprints the URLs and adapter-node
// sends them with `cache-control: immutable`. Drop re-rendered clips into
// src/lib/assets/clips/Mountain/ under the same names.
import startClip from '$lib/assets/clips/Mountain/start.mp4';
import shot2 from '$lib/assets/clips/Mountain/shot-2.mp4';
import shot3 from '$lib/assets/clips/Mountain/shot-3.mp4';
import shot4 from '$lib/assets/clips/Mountain/shot-4.mp4';
import shot5 from '$lib/assets/clips/Mountain/shot-5.mp4';
import shot6 from '$lib/assets/clips/Mountain/shot-6.mp4';
import shot7 from '$lib/assets/clips/Mountain/shot-7.mp4';
import shot8 from '$lib/assets/clips/Mountain/shot-8.mp4';

export type JourneyTheme = {
	id: string;
	label: string;
	/** Ambient looping plate on the landing hero. Never scrubbed. */
	hero: string;
	/**
	 * Individual scene clips. Order: scenes 1–6, then lens/emergence (shared last clip).
	 * Mountains: shot-2…shot-8. Hero uses `hero` (`start.mp4`), not this list.
	 */
	scenes: string[];
};

export const JOURNEY_THEMES: JourneyTheme[] = [
	{
		id: 'mountains',
		label: 'Mountains',
		hero: startClip,
		scenes: [shot2, shot3, shot4, shot5, shot6, shot7, shot8]
	}
];

/**
 * Beat → scene index. Hero uses `theme.hero`.
 * Scenes 1–6 → shots 2–7; lens + emergence + doors share shot-8.
 */
export const BEAT_SCENE_INDEX: Record<BeatId, number> = {
	'beat-hero': 0,
	'beat-scene-1': 0,
	'beat-scene-2': 1,
	'beat-scene-3': 2,
	'beat-scene-4': 3,
	'beat-scene-5': 4,
	'beat-scene-6': 5,
	'beat-lens': 6,
	'beat-emergence': 6,
	'beat-doors': 6
};

export const DEFAULT_THEME_ID = JOURNEY_THEMES[0]!.id;

export function getTheme(id: string): JourneyTheme {
	return JOURNEY_THEMES.find((t) => t.id === id) ?? JOURNEY_THEMES[0]!;
}

/** Stable key for per-theme beat timing storage. */
export function themeTimingKey(theme: JourneyTheme): string {
	return `scenes:${theme.id}:v5`;
}

export function sceneSrcForBeat(theme: JourneyTheme, beatId: BeatId): string | null {
	if (beatId === 'beat-hero') return theme.hero;
	const index = BEAT_SCENE_INDEX[beatId] ?? 0;
	return theme.scenes[Math.min(index, theme.scenes.length - 1)] ?? null;
}

/** The clip that plays after `beatId`, so it can be warmed in the idle video layer. */
export function nextSceneSrcAfterBeat(theme: JourneyTheme, beatId: BeatId): string | null {
	if (beatId === 'beat-hero') return theme.scenes[0] ?? null;
	const current = sceneSrcForBeat(theme, beatId);
	const index = BEAT_SCENE_INDEX[beatId] ?? 0;
	for (let i = index + 1; i < theme.scenes.length; i++) {
		if (theme.scenes[i] !== current) return theme.scenes[i]!;
	}
	return null;
}
