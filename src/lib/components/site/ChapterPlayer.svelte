<!--
	A full-screen, chaptered explainer player.

	One film, split into chapters. The video fills the screen, letterboxed on ink; a slim bar along
	the bottom carries play/pause, previous/next chapter, the time within the current chapter, its
	title, one numbered circle per chapter, captions and exit. Above the bar, a 3px progress bar in
	one segment per chapter, each as wide as its chapter is long.

	The <video> element's currentTime is the only source of truth: the current chapter, every
	segment's fill, the circles and the title are all derived from it on every frame, so
	nothing on screen can disagree with the picture. The rules live in $lib/site/chapter-player.ts.

	Every colour, size and timing is a CSS custom property on `.cp` (see the top of the style block),
	so a page can restyle it without touching this file. See docs/chapter-player.md.
-->
<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import {
		AutoHide,
		chapterIndexAt,
		chapterTimeLabel,
		fitToDuration,
		formatTime,
		nextChapterTime,
		normaliseChapters,
		parseCssMs,
		previousChapterTime,
		RESTART_THRESHOLD_SECONDS,
		segmentFill,
		segmentWidths,
		timeAtFraction,
		type PlayerChapter
	} from '$lib/site/chapter-player';

	export type ChapterChangeDetail = { index: number; chapter: PlayerChapter; previous: number };

	let {
		src,
		chapters: chaptersIn = undefined,
		chaptersUrl = '',
		poster = '',
		captions = '',
		captionsLang = 'en',
		captionsLabel = 'English',
		title = 'Explainer video',
		autoplay = true,
		startAt = 0,
		contained = false,
		fullscreen = true,
		onclose,
		onchapterchange,
		onplay,
		onpause
	}: {
		/** The film. */
		src: string;
		/** Chapters as data (a chapter file's object, or a bare list). Wins over `chaptersUrl`. */
		chapters?: unknown;
		/** A same-origin address answering with a chapter file, fetched when `chapters` is absent. */
		chaptersUrl?: string;
		poster?: string;
		/** A WebVTT captions file. Blank = no captions button. */
		captions?: string;
		captionsLang?: string;
		captionsLabel?: string;
		/** The film's name, for screen readers. */
		title?: string;
		/** Start playing on open. The player is opened by a click, so a browser allows it; when one
		 *  refuses, the paused screen's big play button is there. */
		autoplay?: boolean;
		/** Seconds to start from. */
		startAt?: number;
		/** Fill the parent box instead of the viewport (the demo's phone frame). */
		contained?: boolean;
		/** Ask the browser for real full screen on open (ignored when `contained`). */
		fullscreen?: boolean;
		/** The viewer closed the player (the exit button, Escape, or leaving full screen). */
		onclose?: () => void;
		onchapterchange?: (detail: ChapterChangeDetail) => void;
		onplay?: () => void;
		onpause?: () => void;
	} = $props();

	let root = $state<HTMLDivElement | null>(null);
	let video = $state<HTMLVideoElement | null>(null);
	let barEl = $state<HTMLDivElement | null>(null);

	let fetched = $state<PlayerChapter[] | null>(null);
	let duration = $state(0);
	let time = $state(0);
	let paused = $state(true);
	let ended = $state(false);
	let started = $state(false);
	let captionsOn = $state(false);
	let controlsVisible = $state(true);
	let seeking = $state(false);
	let touch = $state(false);
	let rootWidth = $state(0);

	const base = $derived(chaptersIn !== undefined ? normaliseChapters(chaptersIn, duration || null) : (fetched ?? []));
	const chapters = $derived(duration > 0 ? fitToDuration(base, duration, title) : base);
	const widths = $derived(segmentWidths(chapters));
	const current = $derived(chapterIndexAt(chapters, time));
	const chapter = $derived(current >= 0 ? chapters[current] : null);
	const nextTime = $derived(nextChapterTime(chapters, time));
	const atFirstStart = $derived(current <= 0 && time <= RESTART_THRESHOLD_SECONDS);

	// ── Chapters from an address ────────────────────────────────────────────
	$effect(() => {
		if (chaptersIn !== undefined || !chaptersUrl) return;
		const url = chaptersUrl;
		let cancelled = false;
		fetch(url, { headers: { accept: 'application/json' } })
			.then((r) => (r.ok ? r.json() : null))
			.then((json) => {
				if (!cancelled) fetched = normaliseChapters(json);
			})
			.catch(() => {
				if (!cancelled) fetched = [];
			});
		return () => {
			cancelled = true;
		};
	});

	// ── Time, read off the video every frame while it plays ────────────────
	let raf = 0;
	function frame() {
		if (video && !seeking) time = video.currentTime;
		raf = requestAnimationFrame(frame);
	}
	function stopFrames() {
		if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
		raf = 0;
	}

	// ── Auto-hide ───────────────────────────────────────────────────────────
	const autohide = new AutoHide(3000, (v) => (controlsVisible = v));

	// ── Chapter changes: an event and a screen-reader announcement, never on the first chapter shown.
	//    Nothing is drawn over the picture — the bar's title and circles already say where you are.
	let lastIndex = -1;
	let announcement = $state('');
	$effect(() => {
		const i = current;
		if (i < 0) return;
		const prev = lastIndex;
		lastIndex = i;
		if (prev === -1 || prev === i) return;
		const c = chapters[i];
		const detail: ChapterChangeDetail = { index: i, chapter: c, previous: prev };
		onchapterchange?.(detail);
		root?.dispatchEvent(new CustomEvent('chapterchange', { detail, bubbles: true }));
		announcement = `Chapter ${i + 1} of ${chapters.length} · ${c.title}`;
	});

	// ── Loop: play the film round again from the start. Remembered per browser. ──
	const LOOP_KEY = 'pcl-platform:chapterPlayerLoop:v1';
	let looping = $state(false);
	function toggleLoop() {
		looping = !looping;
		try {
			localStorage.setItem(LOOP_KEY, looping ? '1' : '0');
		} catch {
			/* private window: the choice lasts for this film only */
		}
		autohide.activity();
	}

	// ── Playback ────────────────────────────────────────────────────────────
	function play() {
		if (!video) return;
		if (ended) seekTo(0);
		void video.play().catch(() => {
			paused = true;
		});
	}
	function pause() {
		video?.pause();
	}
	function togglePlay() {
		if (paused) play();
		else pause();
	}
	function seekTo(t: number) {
		if (!video) return;
		const limit = duration > 0 ? duration : Infinity;
		const target = Math.min(Math.max(0, t), limit);
		video.currentTime = target;
		time = target;
		ended = false;
		autohide.activity();
	}
	function goToChapter(i: number) {
		const c = chapters[i];
		if (!c) return;
		seekTo(c.start);
		if (paused) play();
	}
	function previous() {
		seekTo(previousChapterTime(chapters, time));
	}
	function next() {
		if (nextTime !== null) seekTo(nextTime);
	}
	function toggleCaptions() {
		captionsOn = !captionsOn;
	}
	$effect(() => {
		const on = captionsOn;
		const track = video?.textTracks?.[0];
		if (track) track.mode = on ? 'showing' : 'hidden';
	});

	// ── Full screen and closing ─────────────────────────────────────────────
	let enteredFullscreen = false;
	let closing = false;
	async function close() {
		if (closing) return;
		closing = true;
		pause();
		if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
		onclose?.();
	}
	function onFullscreenChange() {
		if (document.fullscreenElement === root) enteredFullscreen = true;
		// Leaving full screen by the browser's own means (Escape, the system gesture) closes the player.
		else if (enteredFullscreen && !document.fullscreenElement) void close();
	}

	// ── Keyboard ────────────────────────────────────────────────────────────
	function onKey(e: KeyboardEvent) {
		if (e.altKey || e.ctrlKey || e.metaKey) return;
		const target = e.target as HTMLElement | null;
		const onButton = target?.tagName === 'BUTTON';
		autohide.activity();
		const k = e.key;
		const handled = () => e.preventDefault();
		if (k === 'Escape') {
			if (preview) preview = null;
			else void close();
			return handled();
		}
		if ((k === ' ' || k === 'Enter') && onButton) return; // the button's own action
		if (k === ' ' || k === 'k' || k === 'K') return (togglePlay(), handled());
		if ((k === 'ArrowLeft' && e.shiftKey) || k === 'PageUp' || k === 'p' || k === 'P') return (previous(), handled());
		if ((k === 'ArrowRight' && e.shiftKey) || k === 'PageDown' || k === 'n' || k === 'N') return (next(), handled());
		if (k === 'ArrowLeft') return (seekTo(time - 5), handled());
		if (k === 'ArrowRight') return (seekTo(time + 5), handled());
		if (k === 'j' || k === 'J') return (seekTo(time - 10), handled());
		if (k === 'l' || k === 'L') return (seekTo(time + 10), handled());
		if (k === 'Home') return (seekTo(0), handled());
		if (k === 'End' && chapters.length) return (seekTo(chapters[chapters.length - 1].start), handled());
		if ((k === 'c' || k === 'C') && captions) return (toggleCaptions(), handled());
		if ((k === 'm' || k === 'M') && video) return ((video.muted = !video.muted), handled());
		if (/^[0-9]$/.test(k)) {
			const i = k === '0' ? 9 : Number(k) - 1;
			if (i < chapters.length) goToChapter(i);
			return handled();
		}
	}

	// ── Pointer activity and the picture ────────────────────────────────────
	function onPointerMove(e: PointerEvent) {
		if (e.pointerType === 'mouse') autohide.activity();
	}
	function onStageClick(e: MouseEvent) {
		const pe = e as PointerEvent;
		// Touch: a tap shows or hides the controls. A mouse: a click plays or pauses, like every player.
		if (pe.pointerType === 'touch' || touch) {
			if (controlsVisible && !paused) autohide.hideNow();
			else autohide.activity();
		} else togglePlay();
	}

	// ── Tooltips (pointer + focus) and the phone preview card ───────────────
	type Tip = { index: number; time: number; x: number; from: 'circle' | 'bar' };
	let tip = $state<Tip | null>(null);
	let preview = $state<number | null>(null);
	const TIP_HALF = 112;

	/** A pointer position as px inside the player, kept clear of its edges. Divides out any CSS
	 *  scale on an ancestor (the demo's scaled 1920×1080 frame), since `left` is in layout px. */
	function clampX(clientX: number): number {
		const r = root?.getBoundingClientRect();
		if (!r || !root) return 0;
		const width = root.offsetWidth || r.width;
		const scale = r.width / width || 1;
		const x = (clientX - r.left) / scale;
		return Math.min(Math.max(x, TIP_HALF + 8), Math.max(TIP_HALF + 8, width - TIP_HALF - 8));
	}
	function tipForCircle(i: number, el: HTMLElement) {
		const r = el.getBoundingClientRect();
		tip = { index: i, time: chapters[i].start, x: clampX(r.left + r.width / 2), from: 'circle' };
	}
	function tipForBar(clientX: number) {
		if (!barEl || !chapters.length) return;
		const r = barEl.getBoundingClientRect();
		const t = timeAtFraction(chapters, (clientX - r.left) / r.width);
		tip = { index: chapterIndexAt(chapters, t), time: t, x: clampX(clientX), from: 'bar' };
	}
	function hideTip(from: Tip['from']) {
		if (tip?.from === from) tip = null;
	}

	// Long press on a circle (touch): a preview card instead of jumping.
	let holdTimer: ReturnType<typeof setTimeout> | undefined;
	let holdStart: { x: number; y: number } | null = null;
	let suppressClick = false;
	let holdMs = 450;
	function circleDown(e: PointerEvent, i: number) {
		if (e.pointerType !== 'touch') return;
		holdStart = { x: e.clientX, y: e.clientY };
		clearTimeout(holdTimer);
		holdTimer = setTimeout(() => {
			suppressClick = true;
			preview = i;
			holdStart = null;
		}, holdMs);
	}
	function circleMove(e: PointerEvent) {
		if (!holdStart) return;
		if (Math.hypot(e.clientX - holdStart.x, e.clientY - holdStart.y) > 10) cancelHold();
	}
	function cancelHold() {
		clearTimeout(holdTimer);
		holdStart = null;
	}
	function circleClick(i: number) {
		if (suppressClick) {
			suppressClick = false;
			return;
		}
		goToChapter(i);
	}
	$effect(() => autohide.hold('preview', preview !== null));
	/** Takes the chapter as an argument: the card's `{@const}` is reactive, so reading it after
	 *  clearing `preview` would read null. */
	function playPreview(i: number) {
		preview = null;
		goToChapter(i);
	}

	// ── Seek bar (a native range, so it is keyboard- and screen-reader-operable) ──
	function onSeekInput(e: Event) {
		const v = Number((e.currentTarget as HTMLInputElement).value);
		seeking = true;
		autohide.hold('seek', true);
		time = v;
		if (video) video.currentTime = v;
	}
	function endSeek() {
		seeking = false;
		autohide.hold('seek', false);
		if (video) time = video.currentTime;
	}

	// ── Lifecycle ───────────────────────────────────────────────────────────
	let opener: Element | null = null;
	let restoreOverflow = '';
	onMount(() => {
		opener = document.activeElement;
		const css = root ? getComputedStyle(root) : null;
		autohide.setDelay(parseCssMs(css?.getPropertyValue('--cp-autohide-delay'), 3000));
		try {
			looping = localStorage.getItem(LOOP_KEY) === '1';
		} catch {
			looping = false;
		}
		holdMs = parseCssMs(css?.getPropertyValue('--cp-hold-delay'), 450);
		const hoverNone = window.matchMedia('(hover: none)');
		const syncTouch = () => (touch = hoverNone.matches);
		syncTouch();
		hoverNone.addEventListener('change', syncTouch);
		document.addEventListener('fullscreenchange', onFullscreenChange);
		if (!contained) {
			restoreOverflow = document.documentElement.style.overflow;
			document.documentElement.style.overflow = 'hidden';
			if (fullscreen && root?.requestFullscreen) root.requestFullscreen().catch(() => {});
		}
		raf = requestAnimationFrame(frame);
		void tick().then(() => root?.focus({ preventScroll: true }));
		return () => {
			hoverNone.removeEventListener('change', syncTouch);
			document.removeEventListener('fullscreenchange', onFullscreenChange);
		};
	});
	onDestroy(() => {
		// onDestroy also runs on the server, right after render: nothing to undo there.
		if (typeof document === 'undefined') return;
		stopFrames();
		autohide.dispose();
		clearTimeout(holdTimer);
		if (!contained) document.documentElement.style.overflow = restoreOverflow;
		if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
	});

	function onLoadedMetadata() {
		if (!video) return;
		duration = Number.isFinite(video.duration) ? video.duration : 0;
		if (startAt > 0) seekTo(startAt);
		if (autoplay) play();
	}

	const playLabel = $derived(ended ? 'Replay' : paused ? 'Play' : 'Pause');
	const tipChapter = $derived(tip && tip.index >= 0 ? chapters[tip.index] : null);
	const previewChapter = $derived(preview !== null ? (chapters[preview] ?? null) : null);
	const compact = $derived(rootWidth > 0 && rootWidth < 640);
</script>

<div
	bind:this={root}
	bind:clientWidth={rootWidth}
	class="cp"
	class:contained
	class:idle={!controlsVisible}
	role="dialog"
	aria-modal={contained ? undefined : 'true'}
	aria-label={title}
	tabindex="-1"
	onkeydown={onKey}
	onpointermove={onPointerMove}
>
	<!-- The captions track is inside, when the film has one. -->
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		bind:this={video}
		class="cp-video"
		{src}
		poster={poster || undefined}
		playsinline
		preload="auto"
		loop={looping}
		onloadedmetadata={onLoadedMetadata}
		ondurationchange={() => video && Number.isFinite(video.duration) && (duration = video.duration)}
		onplay={() => {
			paused = false;
			ended = false;
			started = true;
			autohide.setPlaying(true);
			onplay?.();
			root?.dispatchEvent(new CustomEvent('play', { bubbles: true }));
		}}
		onpause={() => {
			paused = true;
			autohide.setPlaying(false);
			onpause?.();
			root?.dispatchEvent(new CustomEvent('pause', { bubbles: true }));
		}}
		onended={() => {
			ended = true;
			paused = true;
			autohide.setPlaying(false);
		}}
		onseeked={() => video && !seeking && (time = video.currentTime)}
	>
		{#if captions}<track kind="captions" src={captions} srclang={captionsLang} label={captionsLabel} />{/if}
	</video>

	<!-- The picture itself: a click plays or pauses (a tap shows the controls on a phone). -->
	<button type="button" class="cp-stage" tabindex="-1" aria-hidden="true" onclick={onStageClick}></button>

	{#if paused}
		<button type="button" class="cp-bigplay" aria-label={ended ? 'Replay from the start' : started ? 'Play' : `Play ${title}`} onclick={play}>
			{#if ended}
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" /></svg>
			{:else}
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z" /></svg>
			{/if}
		</button>
	{/if}

	<p class="cp-sr" role="status" aria-live="polite">{announcement}</p>

	<div
		class="cp-controls"
		role="group"
		aria-label="Player controls"
		onpointerenter={(e) => e.pointerType === 'mouse' && autohide.hold('hover', true)}
		onpointerleave={() => autohide.hold('hover', false)}
		onfocusin={() => autohide.hold('focus', true)}
		onfocusout={(e) => {
			if (!e.currentTarget.contains(e.relatedTarget as Node | null)) autohide.hold('focus', false);
		}}
	>
		<div
			class="cp-progress"
			role="group"
			aria-label="Progress"
			bind:this={barEl}
			onpointermove={(e) => e.pointerType === 'mouse' && tipForBar(e.clientX)}
			onpointerleave={() => hideTip('bar')}
		>
			<div class="cp-segments" aria-hidden="true">
				{#each chapters as c, i (i)}
					<span class="cp-seg" class:hot={tip?.from === 'bar' && tip.index === i} style:flex-grow={widths[i]}>
						<span class="cp-seg-fill" style:transform={`scaleX(${segmentFill(c, time)})`}></span>
					</span>
				{/each}
			</div>
			<input
				class="cp-seek"
				type="range"
				min="0"
				max={duration || 0}
				step="any"
				value={time}
				aria-label="Seek"
				aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}${chapter ? `, chapter ${current + 1}: ${chapter.title}` : ''}`}
				oninput={onSeekInput}
				onchange={endSeek}
				onpointerup={endSeek}
				onblur={() => seeking && endSeek()}
			/>
		</div>

		<div class="cp-strip">
			<div class="cp-left">
				<button type="button" class="cp-btn" aria-label={playLabel} title={playLabel} onclick={togglePlay}>
					{#if paused}
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z" /></svg>
					{:else}
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" /></svg>
					{/if}
				</button>
				<button type="button" class="cp-btn" aria-label="Previous chapter" title="Previous chapter" disabled={!chapters.length || atFirstStart} onclick={previous}>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM19 6.13v11.74a.8.8 0 0 1-1.23.67L9.8 13.35a1.6 1.6 0 0 1 0-2.7l7.97-5.19A.8.8 0 0 1 19 6.13z" /></svg>
				</button>
				<button type="button" class="cp-btn" aria-label="Next chapter" title="Next chapter" disabled={nextTime === null} onclick={next}>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM5 6.13v11.74a.8.8 0 0 0 1.23.67l7.97-5.19a1.6 1.6 0 0 0 0-2.7L6.23 5.46A.8.8 0 0 0 5 6.13z" /></svg>
				</button>
				<span class="cp-time">{chapterTimeLabel(chapters, time)}</span>
				{#if chapter && !compact}<span class="cp-title" title={chapter.title}>{chapter.title}</span>{/if}
			</div>

			<ol class="cp-chapters" aria-label="Chapters">
				{#each chapters as c, i (i)}
					<li>
						<button
							type="button"
							class="cp-dot"
							class:done={i < current}
							class:now={i === current}
							aria-label={`Chapter ${i + 1}: ${c.title}, ${formatTime(c.start)}`}
							aria-current={i === current ? 'step' : undefined}
							onclick={() => circleClick(i)}
							onpointerdown={(e) => circleDown(e, i)}
							onpointermove={circleMove}
							onpointerup={cancelHold}
							onpointercancel={cancelHold}
							oncontextmenu={(e) => e.preventDefault()}
							onpointerenter={(e) => e.pointerType === 'mouse' && tipForCircle(i, e.currentTarget)}
							onpointerleave={() => hideTip('circle')}
							onfocus={(e) => tipForCircle(i, e.currentTarget)}
							onblur={() => hideTip('circle')}
						>{i + 1}</button>
					</li>
				{/each}
			</ol>

			<div class="cp-right">
				<button type="button" class="cp-btn" aria-label="Loop" aria-pressed={looping} title={looping ? 'Loop on — plays again from the start' : 'Loop off'} onclick={toggleLoop}>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z" /></svg>
				</button>
				{#if captions}
					<button type="button" class="cp-btn" aria-label="Captions" aria-pressed={captionsOn} title={captionsOn ? 'Captions on' : 'Captions off'} onclick={toggleCaptions}>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v10h16V7zm2.5 3.5A1.5 1.5 0 0 1 8 9h2.5v1.5H8v3h2.5V15H8a1.5 1.5 0 0 1-1.5-1.5zm7 0A1.5 1.5 0 0 1 15 9h2.5v1.5H15v3h2.5V15H15a1.5 1.5 0 0 1-1.5-1.5z" /></svg>
					</button>
				{/if}
				<button type="button" class="cp-btn" aria-label="Exit full screen" title="Exit full screen" onclick={close}>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h2v7H4V9h3.59L3.3 4.7l1.4-1.4L9 7.59zm6 0h-2v7h7V9h-3.59l4.3-4.3-1.42-1.4L15 7.59zM9 20h2v-7H4v2h3.59l-4.3 4.3 1.42 1.4L9 16.41zm6 0h-2v-7h7v2h-3.59l4.3 4.3-1.42 1.4L15 16.41z" /></svg>
				</button>
			</div>
		</div>
	</div>

	{#if tip && tipChapter && controlsVisible && preview === null}
		<div class="cp-tip" style:left={`${tip.x}px`} aria-hidden="true">
			{#if tipChapter.thumbnail}<img src={tipChapter.thumbnail} alt="" />{:else}<span class="cp-tip-blank"></span>{/if}
			<span class="cp-tip-meta">Chapter {tip.index + 1} · {formatTime(tip.time)}</span>
			<span class="cp-tip-title">{tipChapter.title}</span>
		</div>
	{/if}

	{#if previewChapter && preview !== null}
		{@const i = preview}
		<div class="cp-preview" role="group" aria-label={`Chapter ${i + 1} preview`}>
			{#if previewChapter.thumbnail}<img src={previewChapter.thumbnail} alt="" />{:else}<span class="cp-tip-blank"></span>{/if}
			<div class="cp-preview-text">
				<span class="cp-tip-meta">Chapter {i + 1} of {chapters.length} · {formatTime(previewChapter.start)}</span>
				<span class="cp-tip-title">{previewChapter.title}</span>
				<div class="cp-preview-actions">
					<button type="button" class="cp-pill primary" onclick={() => playPreview(i)}>Play chapter {i + 1}</button>
					<button type="button" class="cp-pill" onclick={() => (preview = null)}>Close</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* ── Tokens ─────────────────────────────────────────────────────────────
	   Every colour, size and timing. The defaults are the site's own palette
	   (layout.css @theme); a page restyles the player by setting these on it. */
	.cp {
		--cp-bg: var(--color-ink, #0b1220);
		--cp-fg: var(--color-bone, #f7fafc);
		--cp-fg-dim: var(--color-bone-dim, rgba(247, 250, 252, 0.68));
		--cp-accent: var(--color-lens, #009bcc);
		--cp-focus: var(--color-gold, #d4af6a);
		--cp-track: rgba(247, 250, 252, 0.26);
		--cp-track-hot: rgba(247, 250, 252, 0.45);
		--cp-done: rgba(247, 250, 252, 0.88);
		--cp-scrim: linear-gradient(to top, rgba(11, 18, 32, 0.92), rgba(11, 18, 32, 0.6) 60%, rgba(11, 18, 32, 0));
		--cp-surface: rgba(11, 18, 32, 0.94);
		--cp-surface-border: rgba(247, 250, 252, 0.14);
		--cp-btn-hover: rgba(247, 250, 252, 0.12);

		--cp-progress-height: 3px;
		--cp-progress-hit: 20px;
		--cp-segment-gap: 2px;
		--cp-strip-height: 64px;
		--cp-strip-pad-x: 20px;
		--cp-btn-size: 40px;
		--cp-icon-size: 22px;
		--cp-dot-size: 26px;
		--cp-dot-gap: 8px;
		--cp-dot-font: 11px;
		--cp-time-font: 13px;
		--cp-title-font: 14px;
		--cp-bigplay-size: 88px;
		--cp-tip-width: 224px;
		--cp-preview-width: 320px;
		--cp-radius: 10px;

		--cp-fade: 200ms;
		--cp-autohide-delay: 3s;
		--cp-hold-delay: 450ms;

		position: fixed;
		inset: 0;
		z-index: 1000;
		background: var(--cp-bg);
		color: var(--cp-fg);
		overflow: hidden;
		font-family: var(--font-sans, system-ui, sans-serif);
		container-type: inline-size;
		outline: none;
		-webkit-tap-highlight-color: transparent;
	}
	.cp.contained {
		position: absolute;
	}
	.cp.idle {
		cursor: none;
	}

	.cp-video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		background: var(--cp-bg);
	}
	.cp-stage {
		position: absolute;
		inset: 0;
		border: 0;
		padding: 0;
		background: transparent;
		cursor: inherit;
	}

	/* ── The paused state ── */
	.cp-bigplay {
		position: absolute;
		left: 50%;
		top: 50%;
		width: var(--cp-bigplay-size);
		height: var(--cp-bigplay-size);
		transform: translate(-50%, -50%);
		display: grid;
		place-items: center;
		border-radius: 999px;
		border: 2px solid var(--cp-fg);
		background: color-mix(in srgb, var(--cp-bg) 70%, transparent);
		color: var(--cp-fg);
		cursor: pointer;
		transition: background var(--cp-fade) ease, transform var(--cp-fade) ease;
	}
	.cp-bigplay:hover {
		background: var(--cp-accent);
		border-color: var(--cp-accent);
	}
	.cp-bigplay svg {
		width: 44%;
		height: 44%;
		fill: currentColor;
	}

	/* ── Controls ── */
	.cp-controls {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding-top: 48px;
		background: var(--cp-scrim);
		transition: opacity var(--cp-fade) ease, transform var(--cp-fade) ease;
	}
	.cp.idle .cp-controls {
		opacity: 0;
		transform: translateY(8px);
		pointer-events: none;
	}

	.cp-progress {
		position: relative;
		height: var(--cp-progress-hit);
		margin: 0 var(--cp-strip-pad-x);
		display: flex;
		align-items: center;
	}
	.cp-segments {
		display: flex;
		gap: var(--cp-segment-gap);
		width: 100%;
		height: var(--cp-progress-height);
	}
	.cp-seg {
		position: relative;
		flex-basis: 0;
		min-width: 2px;
		background: var(--cp-track);
		overflow: hidden;
		border-radius: 1px;
		transition: background var(--cp-fade) ease;
	}
	.cp-seg.hot {
		background: var(--cp-track-hot);
	}
	.cp-seg-fill {
		position: absolute;
		inset: 0;
		background: var(--cp-accent);
		transform-origin: left center;
	}
	.cp-seek {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	.cp-progress:has(.cp-seek:focus-visible) {
		outline: 2px solid var(--cp-focus);
		outline-offset: 2px;
		border-radius: 4px;
	}

	.cp-strip {
		height: var(--cp-strip-height);
		padding: 0 calc(var(--cp-strip-pad-x) - 8px);
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: 12px;
	}
	.cp-left,
	.cp-right {
		display: flex;
		align-items: center;
		gap: 2px;
		min-width: 0;
	}
	.cp-right {
		justify-content: flex-end;
	}
	.cp-btn {
		flex: none;
		width: var(--cp-btn-size);
		height: var(--cp-btn-size);
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: var(--cp-fg);
		cursor: pointer;
		transition: background var(--cp-fade) ease, color var(--cp-fade) ease;
	}
	.cp-btn:hover:not(:disabled) {
		background: var(--cp-btn-hover);
	}
	.cp-btn:disabled {
		opacity: 0.38;
		cursor: default;
	}
	.cp-btn[aria-pressed='true'] {
		color: var(--cp-accent);
	}
	.cp-btn svg {
		width: var(--cp-icon-size);
		height: var(--cp-icon-size);
		fill: currentColor;
	}
	.cp-time {
		flex: none;
		margin-left: 8px;
		font-size: var(--cp-time-font);
		font-variant-numeric: tabular-nums;
		color: var(--cp-fg-dim);
		white-space: nowrap;
	}
	.cp-title {
		min-width: 0;
		margin-left: 12px;
		font-size: var(--cp-title-font);
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.cp-chapters {
		display: flex;
		gap: var(--cp-dot-gap);
		margin: 0;
		padding: 4px;
		list-style: none;
		max-width: 60cqw;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.cp-dot {
		flex: none;
		width: var(--cp-dot-size);
		height: var(--cp-dot-size);
		display: grid;
		place-items: center;
		border-radius: 999px;
		border: 1.5px solid var(--cp-track-hot);
		background: transparent;
		color: var(--cp-fg-dim);
		font: 700 var(--cp-dot-font) / 1 var(--font-sans, system-ui, sans-serif);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
		touch-action: manipulation;
		transition: background var(--cp-fade) ease, border-color var(--cp-fade) ease, color var(--cp-fade) ease;
	}
	.cp-dot:hover {
		border-color: var(--cp-fg);
		color: var(--cp-fg);
	}
	.cp-dot.done {
		background: var(--cp-done);
		border-color: var(--cp-done);
		color: var(--cp-bg);
	}
	.cp-dot.now {
		background: var(--cp-accent);
		border-color: var(--cp-accent);
		color: #fff;
	}

	.cp-btn:focus-visible,
	.cp-dot:focus-visible,
	.cp-bigplay:focus-visible,
	.cp-pill:focus-visible {
		outline: 2px solid var(--cp-focus);
		outline-offset: 2px;
	}

	/* ── Tooltip (hover / focus) ── */
	.cp-tip {
		position: absolute;
		bottom: calc(var(--cp-strip-height) + var(--cp-progress-hit) + 14px);
		width: var(--cp-tip-width);
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 6px 6px 10px;
		border-radius: var(--cp-radius);
		background: var(--cp-surface);
		border: 1px solid var(--cp-surface-border);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
		pointer-events: none;
	}
	.cp-tip img,
	.cp-tip-blank {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: calc(var(--cp-radius) - 4px);
		background: var(--cp-btn-hover);
	}
	.cp-tip-meta {
		padding: 0 4px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--cp-accent);
	}
	.cp-tip-title {
		padding: 0 4px;
		font-size: 13px;
		font-weight: 600;
		line-height: 1.3;
	}

	/* ── Phone preview card (tap and hold) ── */
	.cp-preview {
		position: absolute;
		left: 50%;
		bottom: calc(var(--cp-strip-height) + var(--cp-progress-hit) + 12px);
		transform: translateX(-50%);
		width: min(var(--cp-preview-width), calc(100% - 24px));
		display: flex;
		gap: 10px;
		padding: 8px;
		border-radius: var(--cp-radius);
		background: var(--cp-surface);
		border: 1px solid var(--cp-surface-border);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
	}
	.cp-preview img,
	.cp-preview .cp-tip-blank {
		width: 42%;
		flex: none;
		align-self: flex-start;
	}
	.cp-preview-text {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.cp-preview-actions {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-top: auto;
		padding: 4px 4px 0;
	}
	.cp-pill {
		min-height: 32px;
		padding: 0 12px;
		border-radius: 999px;
		border: 1px solid var(--cp-surface-border);
		background: transparent;
		color: var(--cp-fg);
		font: 600 12px var(--font-sans, system-ui, sans-serif);
		cursor: pointer;
	}
	.cp-pill.primary {
		background: var(--cp-accent);
		border-color: var(--cp-accent);
		color: #fff;
	}

	.cp-sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	/* ── Phone landscape and narrower ──
	   A container query cannot restyle the container itself, so the smaller sizes are set on its
	   children, which is where every token is read. */
	@container (max-width: 900px) {
		.cp > * {
			--cp-strip-height: 52px;
			--cp-strip-pad-x: 14px;
			--cp-btn-size: 36px;
			--cp-icon-size: 20px;
			--cp-dot-size: 22px;
			--cp-dot-gap: 6px;
			--cp-dot-font: 10px;
			--cp-bigplay-size: 72px;
		}
		.cp-controls {
			padding-top: 28px;
		}
	}
	@container (max-width: 520px) {
		.cp > * {
			--cp-dot-size: 20px;
			--cp-dot-gap: 4px;
		}
		.cp-time {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cp *,
		.cp {
			transition: none !important;
			animation: none !important;
		}
		.cp.idle .cp-controls {
			transform: none;
		}
	}
</style>
