/**
 * How long the home journey waits on a settled beat before it nudges the visitor and then moves
 * on by itself (JourneyPage.svelte): the forward button glows after `glowAfterSeconds`; on the
 * hero the journey begins after `beginAfterSeconds`; on a scene it goes to the next one after
 * `nextAfterSeconds`. Edited in the CMS (Home journey → Idle timing) under `journey.idle`; an
 * ABSENT or blank key is the default here, so content served before the keys existed behaves as
 * it always did. 0 switches that step off. Keep in step with JOURNEY_IDLE in Sorted's
 * platform-documents.ts.
 */
export const IDLE_TIMING_DEFAULT = {
	glowAfterSeconds: 2,
	beginAfterSeconds: 5,
	nextAfterSeconds: 6
} as const;

export interface IdleTiming {
	/** Nothing happened for this long on a settled beat: its forward button glows. 0 = never. */
	glowAfterMs: number;
	/** Nothing happened for this long on the hero: the journey begins by itself. 0 = never. */
	beginAfterMs: number;
	/** Nothing happened for this long on a settled scene: the journey moves on. 0 = never. */
	nextAfterMs: number;
}

/** A number of seconds as the CMS stores it (a number, or a string with one in it), else null. */
function seconds(v: unknown): number | null {
	const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
	return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Reads `journey.idle` (any shape) into milliseconds. Blank or unreadable = the default. */
export function idleTiming(raw: unknown): IdleTiming {
	const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
	const ms = (k: keyof typeof IDLE_TIMING_DEFAULT) => Math.round((seconds(r[k]) ?? IDLE_TIMING_DEFAULT[k]) * 1000);
	return { glowAfterMs: ms('glowAfterSeconds'), beginAfterMs: ms('beginAfterSeconds'), nextAfterMs: ms('nextAfterSeconds') };
}
