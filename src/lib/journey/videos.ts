import type { BeatId } from '$lib/journey/beats';
import { asset } from '$lib/content/assets';
import { live } from '$lib/content/runtime';

// Clip paths are recorded in the site content under `journey.clips`. They point at
// bundled files under src/lib/assets (not /static) so Vite fingerprints the
// URLs and adapter-node sends them with `cache-control: immutable`. Drop
// re-rendered clips into src/lib/assets/clips/Mountain/ under the same names.

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

export const JOURNEY_THEMES: JourneyTheme[] = live(
	({ journey }) => [
		{
			id: journey.clips.themeId,
			label: journey.clips.themeLabel,
			hero: asset(journey.clips.hero),
			scenes: journey.clips.scenes.map(asset)
		}
	],
	'array'
);

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

/** The theme with `id`, or the first (default) theme when absent or unknown. */
export function getTheme(id?: string): JourneyTheme {
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
