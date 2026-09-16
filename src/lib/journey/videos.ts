import type { BeatId } from '$lib/journey/beats';

export type JourneyTheme = {
	id: string;
	label: string;
	/** Single scrubbable file (legacy themes). */
	src?: string;
	/** Ambient looping plate on the landing hero. */
	hero?: string;
	/**
	 * Individual scene clips. Order: scenes 1–6, then lens/emergence (shared last clip).
	 * Mountains: shot-2…shot-8. Hero uses `hero` (`start.mp4`), not this list.
	 */
	scenes?: string[];
};

export const JOURNEY_THEMES: JourneyTheme[] = [
	{
		id: 'mountains',
		label: 'Mountains',
		hero: '/clips/Mountain/start.mp4',
		scenes: [
			'/clips/Mountain/shot-2.mp4',
			'/clips/Mountain/shot-3.mp4',
			'/clips/Mountain/shot-4.mp4',
			'/clips/Mountain/shot-5.mp4',
			'/clips/Mountain/shot-6.mp4',
			'/clips/Mountain/shot-7.mp4',
			'/clips/Mountain/shot-8.mp4'
		]
	},
	{ id: 'forest', label: 'Forest', src: '/clips/TestVersionForest.mp4' },
	{ id: 'office', label: 'Office', src: '/clips/TestVersionOffice.mp4' },
	{ id: 'original', label: 'Original', src: '/journey.mp4' }
];

/**
 * Beat → scene index. Hero uses `theme.hero` when set; otherwise scene 0 at rest.
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

export const VIDEO_STORAGE_KEY = 'journey-theme-id';

export const COLD_OPEN_STORAGE_KEY = 'journey-cold-open-seen';

export function getTheme(id: string): JourneyTheme {
	return JOURNEY_THEMES.find((t) => t.id === id) ?? JOURNEY_THEMES[0]!;
}

export function isJourneyThemeId(id: string): boolean {
	return JOURNEY_THEMES.some((t) => t.id === id);
}

/** Stable key for per-theme beat timing storage. */
export function themeTimingKey(theme: JourneyTheme): string {
	if (theme.scenes?.length) return `scenes:${theme.id}:v5`;
	return theme.src ?? theme.id;
}

export function sceneSrcForBeat(theme: JourneyTheme, beatId: BeatId): string | null {
	if (beatId === 'beat-hero' && theme.hero) return theme.hero;
	if (!theme.scenes?.length) return theme.src ?? null;
	const index = BEAT_SCENE_INDEX[beatId] ?? 0;
	return theme.scenes[Math.min(index, theme.scenes.length - 1)] ?? null;
}
