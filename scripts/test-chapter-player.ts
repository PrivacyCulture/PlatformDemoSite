// The chapter player's maths and auto-hide timing.
// npx tsx scripts/test-chapter-player.ts
import {
	AutoHide,
	chapterIndexAt,
	chapterTimeLabel,
	fitToDuration,
	formatTime,
	MAX_PLAYER_CHAPTERS,
	nextChapterTime,
	normaliseChapters,
	parseCssMs,
	previousChapterTime,
	segmentFill,
	segmentWidths,
	timeAtFraction,
	type Scheduler
} from '../src/lib/site/chapter-player.ts';

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
	console.log(`  ${cond ? '✓' : '✗'} ${name}`);
	if (!cond) {
		failures++;
		if (detail !== undefined) console.log('     ', JSON.stringify(detail));
	}
}
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

// A file as Sorted writes it: ten chapters of uneven length.
const LENGTHS = [12, 30, 18, 24, 9, 36, 15, 21, 27, 18];
let at = 0;
const FILE = {
	version: 1,
	duration: LENGTHS.reduce((a, b) => a + b, 0),
	chapters: LENGTHS.map((len, i) => {
		const c = { title: `Chapter title ${i + 1}`, start: at, end: at + len, thumbnail: `https://media.example.com/ch-${i + 1}.webp` };
		at += len;
		return c;
	})
};
const ch = normaliseChapters(FILE);

console.log('Reading a chapter file');
check('ten chapters, in order, indexed', ch.length === 10 && ch.every((c, i) => c.index === i));
check('ends are the next starts', ch.every((c, i) => i === ch.length - 1 || c.end === ch[i + 1].start));
check('the last ends at the film’s length', ch[9].end === 210);
check('thumbnails kept', ch[0].thumbnail === 'https://media.example.com/ch-1.webp');
check('a bare array is read', normaliseChapters([{ title: 'A', start: 0 }, { title: 'B', start: 5 }], 10).length === 2);
check('unsorted starts are sorted', normaliseChapters([{ title: 'B', start: 5 }, { title: 'A', start: 0 }], 10)[0].title === 'A');
check('a numeric string start is read', normaliseChapters([{ title: 'A', start: '0' }, { title: 'B', start: '4.5' }], 9)[1].start === 4.5);
check('negative / NaN / missing starts dropped', normaliseChapters([{ start: -1 }, { start: 'x' }, {}, { title: 'Ok', start: 0 }], 5).length === 1);
check('a blank title becomes "Chapter N"', normaliseChapters([{ title: '  ', start: 0 }], 5)[0].title === 'Chapter 1');
check('two starts a frame apart are one chapter', normaliseChapters([{ start: 0 }, { start: 3 }, { start: 3.01 }], 9).length === 2);
check('a chapter starting past the film’s end is dropped', normaliseChapters([{ start: 0 }, { start: 20 }], 10).length === 1);
check('the first chapter starts at 0 even if listed late', normaliseChapters([{ start: 2 }, { start: 6 }], 10)[0].start === 0);
check('unsafe thumbnails are dropped', normaliseChapters([{ start: 0, thumbnail: 'javascript:alert(1)' }, { start: 2, thumbnail: '//evil.example/x.png' }, { start: 4, thumbnail: 'http://plain.example/x.png' }], 6).every((c) => c.thumbnail === ''));
check('a site-relative thumbnail is kept', normaliseChapters([{ start: 0, thumbnail: '/demo/t.jpg' }], 6)[0].thumbnail === '/demo/t.jpg');
check(`capped at ${MAX_PLAYER_CHAPTERS}`, normaliseChapters(Array.from({ length: 60 }, (_, i) => ({ start: i })), 60).length === MAX_PLAYER_CHAPTERS);
check('garbage reads as no chapters', normaliseChapters('nope').length === 0 && normaliseChapters(null).length === 0 && normaliseChapters({ chapters: 'x' }).length === 0);

console.log('Fitting to the video’s real length');
check('the last chapter is closed by the video', fitToDuration(normaliseChapters([{ start: 0 }, { start: 5 }]), 12)[1].end === 12);
check('a chapter past the end is dropped', fitToDuration(ch, 100).every((c) => c.start < 100) && fitToDuration(ch, 100).at(-1)!.end === 100);
check('no chapters → the whole film is one', (() => { const f = fitToDuration([], 42, 'Overview'); return f.length === 1 && f[0].end === 42 && f[0].title === 'Overview'; })());
check('an unknown length changes nothing', fitToDuration(ch, NaN) === ch);

console.log('Current chapter from time');
check('t=0 is chapter 1', chapterIndexAt(ch, 0) === 0);
check('just before a start is the chapter before', chapterIndexAt(ch, 11.9) === 0);
check('exactly on a start is that chapter', chapterIndexAt(ch, 12) === 1);
check('a seek landing a hair early counts as its target', chapterIndexAt(ch, 11.9995) === 1);
check('mid-film', chapterIndexAt(ch, 100) === 5);
check('past the end is the last chapter', chapterIndexAt(ch, 999) === 9);
check('negative or NaN time is chapter 1', chapterIndexAt(ch, -3) === 0 && chapterIndexAt(ch, NaN) === 0);
check('no chapters → -1', chapterIndexAt([], 5) === -1);

console.log('Segment widths');
const w = segmentWidths(ch);
check('one per chapter', w.length === 10);
check('sum to 1', near(w.reduce((a, b) => a + b, 0), 1));
check('proportional to length (36s of 210s)', near(w[5], 36 / 210));
check('the longest is widest', w.indexOf(Math.max(...w)) === 5);
check('zero-length chapters share equally', segmentWidths(normaliseChapters([{ start: 0 }, { start: 0.5 }])).length === 2 && near(segmentWidths([{ index: 0, title: '', start: 0, end: 0, thumbnail: '' }])[0], 1));
check('fill: 0 before, ½ midway, 1 after', segmentFill(ch[1], 5) === 0 && near(segmentFill(ch[1], 27), 0.5) && segmentFill(ch[1], 50) === 1);
check('fraction → time is the inverse of the widths', near(timeAtFraction(ch, w[0]), 12) && timeAtFraction(ch, 0) === 0 && timeAtFraction(ch, 1) === 210);
check('fraction inside a segment lands inside its chapter', chapterIndexAt(ch, timeAtFraction(ch, w[0] + w[1] / 2)) === 1);

console.log('Time formatting');
check('0 → 0:00', formatTime(0) === '0:00');
check('65.9 → 1:05 (floors)', formatTime(65.9) === '1:05');
check('599 → 9:59', formatTime(599) === '9:59');
check('3725 → 1:02:05', formatTime(3725) === '1:02:05');
check('NaN / negative / Infinity → 0:00', formatTime(NaN) === '0:00' && formatTime(-4) === '0:00' && formatTime(Infinity) === '0:00');
check('chapter-relative label', chapterTimeLabel(ch, 54) === '0:12 / 0:18');
check('label at a chapter start', chapterTimeLabel(ch, 12) === '0:00 / 0:30');
check('label with no chapters is the plain time', chapterTimeLabel([], 75) === '1:15');

console.log('Previous / Next');
check('Previous well into a chapter restarts it', previousChapterTime(ch, 20) === 12);
check('Previous at the very start goes back one', previousChapterTime(ch, 13) === 0);
check('Previous in chapter 1 goes to 0', previousChapterTime(ch, 1) === 0);
check('Next goes to the following start', nextChapterTime(ch, 13) === 42);
check('Next on the last chapter is null', nextChapterTime(ch, 200) === null);

console.log('CSS times');
check('"3s" → 3000', parseCssMs('3s', 0) === 3000);
check('"2400ms" → 2400', parseCssMs(' 2400ms ', 0) === 2400);
check('"1.5" → 1500 (seconds)', parseCssMs('1.5', 0) === 1500);
check('garbage → fallback', parseCssMs('soon', 777) === 777 && parseCssMs('', 5) === 5 && parseCssMs(undefined, 9) === 9);

console.log('Auto-hide');
class FakeClock implements Scheduler {
	now = 0;
	private timers: { at: number; fn: () => void; id: number }[] = [];
	private next = 1;
	set(fn: () => void, ms: number) {
		const id = this.next++;
		this.timers.push({ at: this.now + ms, fn, id });
		return id;
	}
	clear(h: unknown) {
		this.timers = this.timers.filter((t) => t.id !== h);
	}
	advance(ms: number) {
		const end = this.now + ms;
		for (;;) {
			this.timers.sort((a, b) => a.at - b.at);
			const t = this.timers[0];
			if (!t || t.at > end) break;
			this.timers.shift();
			this.now = t.at;
			t.fn();
		}
		this.now = end;
	}
	get pending() {
		return this.timers.length;
	}
}
{
	const clock = new FakeClock();
	const changes: boolean[] = [];
	const ah = new AutoHide(3000, (v) => changes.push(v), clock);
	check('starts visible', ah.visible);
	clock.advance(10_000);
	check('paused: never hides', ah.visible && clock.pending === 0);
	ah.setPlaying(true);
	clock.advance(2999);
	check('playing: still visible just before the delay', ah.visible);
	clock.advance(1);
	check('playing: hides at the delay', !ah.visible && changes.at(-1) === false);
	ah.activity();
	check('activity shows them again', ah.visible);
	clock.advance(2000);
	ah.activity();
	clock.advance(2000);
	check('activity restarts the countdown', ah.visible);
	clock.advance(1000);
	check('…and it runs out 3s after the last activity', !ah.visible);
	ah.hold('focus', true);
	check('a hold shows them', ah.visible);
	clock.advance(60_000);
	check('held: never hides', ah.visible);
	ah.hold('hover', true);
	ah.hold('focus', false);
	clock.advance(60_000);
	check('one hold released, another kept: still visible', ah.visible);
	ah.hold('hover', false);
	clock.advance(3000);
	check('all holds released: hides after the delay', !ah.visible);
	ah.setPlaying(false);
	check('pausing shows them at once', ah.visible);
	clock.advance(60_000);
	check('and they stay while paused', ah.visible);
	ah.setPlaying(true);
	ah.hideNow();
	check('hideNow while playing hides at once', !ah.visible);
	ah.setPlaying(false);
	ah.hideNow();
	check('hideNow while paused does nothing', ah.visible);
	const n = changes.length;
	ah.activity();
	ah.activity();
	check('no duplicate change events', changes.length === n);
	ah.setPlaying(true);
	ah.setDelay(0);
	clock.advance(60_000);
	check('a delay of 0 never hides', ah.visible && clock.pending === 0);
	ah.dispose();
	check('dispose clears the timer', clock.pending === 0);
}

console.log(failures ? `\n${failures} failed` : '\nAll passed');
process.exit(failures ? 1 : 0);
