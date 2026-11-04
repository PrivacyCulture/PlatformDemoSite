// The chapter player's rules: reading a chapter file, which chapter a moment belongs to, how wide
// each progress segment is, how times are written, where Previous and Next go, and when the
// controls hide. Pure — no DOM, no Svelte — so it is tested offline:
// npx tsx scripts/test-chapter-player.ts
//
// The <video> element's currentTime is the only source of truth. Nothing here holds "the current
// chapter"; every reader asks `chapterIndexAt` with the time it has, so the bar, the numbered
// circles, the title and the toast can never disagree with what is on screen.
//
// The chapter file is written by Sorted when a film is chosen from its Explainer Studio
// (pcl-abm `src/lib/explainer-chapters.ts` — keep the two shapes in step):
//   { "version": 1, "duration": 312.4, "chapters": [{ "title": "…", "start": 0, "end": 31.2, "thumbnail": "https://…" }] }
// A bare array of chapters is read too, and `end` is optional (the next start, or the film's length).

export interface PlayerChapter {
	/** 0-based position. */
	index: number;
	title: string;
	/** Seconds into the film. */
	start: number;
	/** Seconds into the film; the next chapter's start, or the film's length for the last. */
	end: number;
	/** A still for the chapter's tooltip, or ''. */
	thumbnail: string;
}

/** A bound on one file — every chapter is a numbered circle in the control bar. */
export const MAX_PLAYER_CHAPTERS = 40;
/** Pressing Previous more than this far into a chapter restarts it rather than going back one. */
export const RESTART_THRESHOLD_SECONDS = 3;
/** Two starts closer than this are one chapter — a re-cut can leave a start a frame apart. */
const SAME_START = 0.05;

const finite = (v: unknown): number | null => {
	const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
	return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/** Only an address the site can show without trusting the file: site-relative or https. */
function safeImage(v: unknown): string {
	if (typeof v !== 'string') return '';
	const s = v.trim();
	if (/^https:\/\//i.test(s)) return s;
	if (s.startsWith('/') && !s.startsWith('//')) return s;
	return '';
}

/**
 * Reads a chapter file (or a bare list) into ordered, gap-free chapters. Never throws: anything
 * unreadable is dropped, and an empty list means "no chapters", which the player treats as one
 * chapter spanning the film. `duration` (when known) closes the last chapter.
 */
export function normaliseChapters(raw: unknown, duration?: number | null): PlayerChapter[] {
	const rec = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
	const list = Array.isArray(raw) ? raw : Array.isArray(rec?.chapters) ? (rec!.chapters as unknown[]) : [];
	const fileDuration = finite(rec?.duration);
	const total = finite(duration) && (duration as number) > 0 ? (duration as number) : fileDuration && fileDuration > 0 ? fileDuration : null;

	const read = list
		.map((c, i) => {
			const r = c && typeof c === 'object' ? (c as Record<string, unknown>) : {};
			const start = finite(r.start);
			const title = typeof r.title === 'string' ? r.title.replace(/\s+/g, ' ').trim() : '';
			return start === null || start < 0 ? null : { title: title || `Chapter ${i + 1}`, start, end: finite(r.end), thumbnail: safeImage(r.thumbnail) };
		})
		.filter((c): c is { title: string; start: number; end: number | null; thumbnail: string } => !!c)
		.filter((c) => total === null || c.start < total)
		.sort((a, b) => a.start - b.start);

	const unique: typeof read = [];
	for (const c of read) if (!unique.length || c.start - unique[unique.length - 1].start >= SAME_START) unique.push(c);
	const capped = unique.slice(0, MAX_PLAYER_CHAPTERS);

	const out: PlayerChapter[] = capped.map((c, i) => {
		const next = capped[i + 1];
		const end = next ? next.start : total ?? (c.end !== null && c.end > c.start ? c.end : c.start);
		return { index: i, title: c.title, start: c.start, end, thumbnail: c.thumbnail };
	});
	// The film's own start is chapter 1's start: a list that begins late would leave the first
	// seconds belonging to nothing.
	// With no length known yet the last chapter may end where it starts; `fitToDuration` closes it
	// once the video has loaded its metadata.
	if (out.length) out[0].start = 0;
	return out;
}

/**
 * The chapters once the video's real length is known: the last chapter ends where the film does,
 * and any chapter past it is dropped. With no chapters, the whole film is one.
 */
export function fitToDuration(chapters: PlayerChapter[], duration: number, fallbackTitle = 'Chapter 1'): PlayerChapter[] {
	if (!(duration > 0)) return chapters;
	if (!chapters.length) return [{ index: 0, title: fallbackTitle, start: 0, end: duration, thumbnail: '' }];
	const kept = chapters.filter((c) => c.start < duration);
	return kept.map((c, i) => ({ ...c, index: i, end: i === kept.length - 1 ? duration : Math.min(c.end, duration) }));
}

/** The chapter a moment belongs to: the last one starting at or before it. -1 only with no chapters. */
export function chapterIndexAt(chapters: readonly PlayerChapter[], t: number): number {
	if (!chapters.length) return -1;
	const time = Number.isFinite(t) ? t : 0;
	let i = 0;
	// A seek lands a hair before a start (keyframes, float error); count it as the chapter it aimed at.
	while (i + 1 < chapters.length && chapters[i + 1].start <= time + 0.001) i++;
	return i;
}

/** Each chapter's share of the bar, in order, summing to 1. A zero-length film shares it equally. */
export function segmentWidths(chapters: readonly PlayerChapter[]): number[] {
	const lens = chapters.map((c) => Math.max(0, c.end - c.start));
	const total = lens.reduce((a, b) => a + b, 0);
	if (!(total > 0)) return chapters.map(() => 1 / Math.max(1, chapters.length));
	return lens.map((l) => l / total);
}

/** How much of one chapter's segment is filled at time t: 0 before it, 1 after it. */
export function segmentFill(chapter: Pick<PlayerChapter, 'start' | 'end'>, t: number): number {
	const len = chapter.end - chapter.start;
	if (!(len > 0)) return t >= chapter.end ? 1 : 0;
	return Math.min(1, Math.max(0, (t - chapter.start) / len));
}

/** The film time at a point along the whole bar (0–1), honouring each segment's own width. */
export function timeAtFraction(chapters: readonly PlayerChapter[], fraction: number): number {
	if (!chapters.length) return 0;
	const f = Math.min(1, Math.max(0, fraction));
	const widths = segmentWidths(chapters);
	let acc = 0;
	for (let i = 0; i < chapters.length; i++) {
		const w = widths[i];
		if (f <= acc + w || i === chapters.length - 1) {
			const within = w > 0 ? (f - acc) / w : 0;
			const c = chapters[i];
			return c.start + Math.min(1, Math.max(0, within)) * (c.end - c.start);
		}
		acc += w;
	}
	return chapters[chapters.length - 1].end;
}

/** `m:ss`, or `h:mm:ss` from an hour. Anything not a time reads 0:00, never NaN:NaN. */
export function formatTime(seconds: number): string {
	const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const ss = String(s % 60).padStart(2, '0');
	return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** The time shown in the bar: how far into the current chapter, of how long it is. */
export function chapterTimeLabel(chapters: readonly PlayerChapter[], t: number): string {
	const i = chapterIndexAt(chapters, t);
	if (i < 0) return formatTime(t);
	const c = chapters[i];
	return `${formatTime(Math.min(Math.max(0, t - c.start), c.end - c.start))} / ${formatTime(c.end - c.start)}`;
}

/** Where Previous goes: the start of this chapter when well into it, else the start of the one before. */
export function previousChapterTime(chapters: readonly PlayerChapter[], t: number, threshold = RESTART_THRESHOLD_SECONDS): number {
	const i = chapterIndexAt(chapters, t);
	if (i < 0) return 0;
	if (t - chapters[i].start > threshold || i === 0) return chapters[i].start;
	return chapters[i - 1].start;
}

/** Where Next goes: the start of the next chapter, or null on the last one (the button is disabled). */
export function nextChapterTime(chapters: readonly PlayerChapter[], t: number): number | null {
	const i = chapterIndexAt(chapters, t);
	return i >= 0 && i + 1 < chapters.length ? chapters[i + 1].start : null;
}

/** Reads a CSS time ("3s", "2400ms", "1.5") into milliseconds, or the fallback. */
export function parseCssMs(value: string | null | undefined, fallback: number): number {
	const v = (value ?? '').trim();
	const m = /^(-?\d*\.?\d+)\s*(ms|s)?$/i.exec(v);
	if (!m) return fallback;
	const n = Number(m[1]) * (m[2]?.toLowerCase() === 's' ? 1000 : m[2] ? 1 : 1000);
	return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// ── Auto-hide ───────────────────────────────────────────────────────────────

export interface Scheduler {
	set(fn: () => void, ms: number): unknown;
	clear(handle: unknown): void;
}

const realScheduler: Scheduler = {
	set: (fn, ms) => setTimeout(fn, ms),
	clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>)
};

/**
 * When the controls are on screen. They show on any activity and hide `delayMs` after the last one
 * — but only while the film is PLAYING and nothing is holding them up (a pointer over the bar, a
 * focused control, a drag on the progress bar, an open preview). Paused, they never hide: the
 * paused screen is where somebody decides what to do next. `delayMs <= 0` never hides.
 */
export class AutoHide {
	visible = true;
	private playing = false;
	private holds = new Set<string>();
	private timer: unknown = null;
	private readonly scheduler: Scheduler;

	constructor(
		private delayMs: number,
		private readonly onChange: (visible: boolean) => void,
		scheduler?: Scheduler
	) {
		this.scheduler = scheduler ?? realScheduler;
	}

	get canHide(): boolean {
		return this.playing && this.holds.size === 0 && this.delayMs > 0;
	}

	setDelay(ms: number) {
		this.delayMs = ms;
		this.arm();
	}

	/** A pointer move, a tap, a key: show, and start the countdown again. */
	activity() {
		this.show();
		this.arm();
	}

	setPlaying(playing: boolean) {
		this.playing = playing;
		if (!playing) this.show();
		this.arm();
	}

	/** Holds the controls on screen while `on` (one reason per name; several can be held). */
	hold(reason: string, on: boolean) {
		if (on) {
			this.holds.add(reason);
			this.show();
		} else this.holds.delete(reason);
		this.arm();
	}

	/** Hides now, if allowed — the viewer clicked the picture to put the controls away. */
	hideNow() {
		this.cancel();
		if (this.canHide) this.set(false);
	}

	dispose() {
		this.cancel();
	}

	private show() {
		this.set(true);
	}

	private set(v: boolean) {
		if (this.visible === v) return;
		this.visible = v;
		this.onChange(v);
	}

	private cancel() {
		if (this.timer !== null) this.scheduler.clear(this.timer);
		this.timer = null;
	}

	private arm() {
		this.cancel();
		if (!this.canHide || !this.visible) return;
		this.timer = this.scheduler.set(() => {
			this.timer = null;
			if (this.canHide) this.set(false);
		}, this.delayMs);
	}
}
