// Portrait reframing for the 16:9 journey clips. A cover-fitted clip on a phone shows
// only a narrow vertical slice of the frame, so each clip carries focus stops
// ("time:x, …") that say where its subject sits over time; the crop follows them.

/** [time as 0–1 fraction of the clip, subject centre as % of frame width]. */
export type FocusStop = [number, number];

const CENTRED: FocusStop[] = [[0, 50]];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Parse `"0:50, 0.75:64, 1:64"`. Unreadable stops are skipped; nothing readable stays centred. */
export function parseFocus(value: string | null | undefined): FocusStop[] {
	if (!value) return CENTRED;
	const stops: FocusStop[] = [];
	for (const part of value.split(',')) {
		const [t, x] = part.split(':').map((s) => Number.parseFloat(s.trim()));
		if (t === undefined || x === undefined || !Number.isFinite(t) || !Number.isFinite(x)) continue;
		stops.push([clamp(t, 0, 1), clamp(x, 0, 100)]);
	}
	if (!stops.length) return CENTRED;
	return stops.sort((a, b) => a[0] - b[0]);
}

/** Subject centre (% of frame width) at `t`, eased between stops so pans start and settle gently. */
export function focusAt(stops: FocusStop[], t: number): number {
	const first = stops[0];
	if (!first) return 50;
	if (t <= first[0]) return first[1];
	for (let i = 1; i < stops.length; i++) {
		const [t1, x1] = stops[i]!;
		if (t <= t1) {
			const [t0, x0] = stops[i - 1]!;
			const span = t1 - t0;
			if (span <= 0) return x1;
			const k = (t - t0) / span;
			return x0 + (x1 - x0) * k * k * (3 - 2 * k);
		}
	}
	return stops[stops.length - 1]![1];
}

/**
 * The `object-position` x (%) that centres a subject at `focusPct` of the frame width in a
 * cover-fitted box, pinned to the frame edge when the subject is too close to it.
 * Returns 50 when the box is at least as wide as the video, so nothing is cropped sideways.
 */
export function objectPositionX(
	focusPct: number,
	boxW: number,
	boxH: number,
	videoW: number,
	videoH: number
): number {
	if (!boxW || !boxH || !videoW || !videoH) return 50;
	const visible = boxW / boxH / (videoW / videoH);
	if (visible >= 1) return 50;
	const left = clamp(focusPct / 100 - visible / 2, 0, 1 - visible);
	return (left / (1 - visible)) * 100;
}
