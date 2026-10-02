<script lang="ts">
	import { onMount } from 'svelte';
	import Beat from '$lib/components/Beat.svelte';
	import JourneyLoader from '$lib/components/JourneyLoader.svelte';
	import JourneyNav from '$lib/components/JourneyNav.svelte';
	import JourneyScene from '$lib/components/JourneyScene.svelte';
	import JourneySceneIndex from '$lib/components/JourneySceneIndex.svelte';
	import JourneyLegal from '$lib/components/JourneyLegal.svelte';
	import JourneyFaq from '$lib/components/JourneyFaq.svelte';
	import { faqDrawerCopy } from '$lib/site/faq-drawer';
	import JourneyVideo from '$lib/components/JourneyVideo.svelte';
	import ShowMeFlash from '$lib/components/ShowMeFlash.svelte';
	import {
		beatFocusProgress,
		beatRestProgress,
		CLIP_FPS,
		cloneBeatDefs,
		currentBeatIndex,
		frameIndexAt,
		frameTime,
		initialActiveBeats,
		isBeatActive,
		isPayoffBeatId,
		isSceneBeatId,
		isSceneTextActive,
		lastFrameTime,
		navJumpsFromBeats,
		nextBeatProgress,
		nextVisibleBeatIndex,
		prevVisibleBeatIndex,
		SCENE_TEXT_AFTER_SECONDS,
		sceneLocalProgress,
		sceneProgressAt,
		sceneZones,
		type BeatDef,
		type BeatId
	} from '$lib/journey/beats';
	import {
		focusForSrc,
		getTheme,
		nextSceneSrcAfterBeat,
		prevSceneSrcBeforeBeat,
		sceneSrcForBeat
	} from '$lib/journey/videos';
	import { content, sceneClassName, sceneShowMe } from '$lib/journey/content';
	import { site } from '$lib/content';
	import { idleTiming } from '$lib/site/idle-timing';

	const SCENES = content.scenes;
	const UI = content.ui;
	const PRINCIPLES = content.lens.principles;

	const theme = getTheme();
	let videoEl = $state<HTMLVideoElement | null>(null);
	let clipSrc = $state(sceneSrcForBeat(theme, 'beat-hero') ?? '');
	let videoDuration = $state(0);
	let beatDefs = $state<BeatDef[]>(cloneBeatDefs());
	let missing = $state(false);
	let scrollP = $state(0);
	let activeBeats = $state(initialActiveBeats());
	let reduced = $state(false);
	// The FAQ sheet's words and on/off switch, edited in the CMS (Globals → FAQ drawer).
	const faqDrawer = $derived(faqDrawerCopy((site as unknown as { faqDrawer?: unknown }).faqDrawer));
	let loading = $state(true);
	let loadProgress = $state(0);
	let mounted = $state(false);
	let journeyStarted = $state(false);

	/** Which way the visitor is travelling; picks which neighbouring clip to warm. */
	let scrollDir = $state<1 | -1>(1);
	/**
	 * Desktop: the page scroll drives the clip frame by frame. Touch devices: scrubbing is off,
	 * the scroll space is collapsed and progress is a value the page writes itself, so the
	 * journey moves only by Next / Back / the scene index / the idle auto-advance.
	 */
	let scrubEnabled = $state(true);
	/** Reactive mirror of `playback.nativePlay` (a clip is playing at 1x). */
	let clipPlaying = $state(false);
	/** Bumped by every visitor input; restarts the idle clock behind the Next hint. */
	let idleGen = $state(0);
	/** Scenes whose Show Me preview is open: the idle clock holds while someone is reading. */
	let openPreviews = $state<Set<BeatId>>(new Set());
	/** The FAQ sheet or the mobile menu is open: the idle clock holds. */
	let sheetOpen = $state(false);
	/** Beat whose forward button (the hero's Begin, a scene's Next arrow) is glowing. */
	let idleHintBeat = $state<BeatId | null>(null);
	// The idle timers are edited in the CMS (Home journey → Idle timing); 0 switches a step off.
	const idle = idleTiming(content.idle);
	/** Nothing happened for this long on a settled beat: its forward button glows. */
	const IDLE_HINT_AFTER_MS = idle.glowAfterMs;
	/** Nothing happened for this long on the hero: the journey begins by itself. */
	const HERO_AUTO_BEGIN_AFTER_MS = idle.beginAfterMs;
	/** Nothing happened for this long on a settled scene: the journey moves on by itself. */
	const AUTO_ADVANCE_AFTER_MS = idle.nextAfterMs;
	const navJumps = $derived(navJumpsFromBeats(beatDefs));
	const activeBeatId = $derived.by(() => {
		const on = Object.entries(activeBeats).find(([, active]) => active)?.[0] as BeatId | undefined;
		if (on) return on;
		const idx = currentBeatIndex(scrollP, beatDefs);
		for (let i = idx; i >= 0; i--) {
			if (!beatDefs[i]!.hidden) return beatDefs[i]!.id;
		}
		return 'beat-hero';
	});
	const activeSceneNumber = $derived.by(() => {
		const idx = currentBeatIndex(scrollP, beatDefs);
		const id = beatDefs[idx]?.id;
		if (id && isSceneBeatId(id)) return Number(id.replace('beat-scene-', ''));
		return 0;
	});
	const sceneIndexVisible = $derived(
		!loading && journeyStarted && activeSceneNumber > 0
	);
	/** Clip the visitor is heading into (next, or previous on the way back), warmed in the idle layer. */
	const nextClipSrc = $derived(
		(scrollDir < 0
			? prevSceneSrcBeforeBeat(theme, activeBeatId)
			: nextSceneSrcAfterBeat(theme, activeBeatId)) ?? ''
	);

	let heroShowMeOpen = $state(false);
	const HERO_SHOW_ME_DELAY_MS = 1100;
	const onHero = $derived(!loading && activeBeatId === 'beat-hero');

	let lensCopyOpen = $state(false);
	const LENS_COPY_DELAY_MS = (content.lens.textAfterSeconds ?? 3) * 1000;
	// Reduced motion shows every beat at once, so the lens copy must count as "on" too.
	const onLens = $derived(!loading && (reduced || activeBeatId === 'beat-lens'));

	const playback = {
		ready: false,
		hasVideo: false,
		/** Eased playhead (seconds) the scrub is heading for; below 0 snaps on the next frame. */
		easedT: -1,
		/** Frame last seeked to (or showing); -1 forces a seek. */
		frameIndex: -1,
		localScrollP: 0,
		nativePlay: false,
		/** scrollY the page last wrote itself, to tell its own scrolling from the visitor's. */
		lastWrittenY: -1
	};

	let clipTime = $state(0);
	let clipReady = $state(false);
	let scenePlayGen = 0;
	/** The lens clip has played through and holds its last frame. */
	let payoffFinished = false;
	/** Scene that Next / Begin / the scene index asked to play once its clip is showing. */
	let pendingPlayBeat = $state<BeatId | null>(null);
	/** Furthest point reached in the current direction (direction flips need 0.01 of travel). */
	let dirAnchor = 0;
	/** True while Back is rewinding the clip by animating the scroll. */
	let reverseNavigating = $state(false);
	let reverseNavGen = 0;
	let reverseRaf = 0;
	/** Beat the running Back animation is heading for, so a second press steps further back. */
	let retreatTargetIdx: number | null = null;

	/** Back rewinds a clip at this multiple of real time. */
	const REWIND_RATE = 1.25;
	/** ms per unit of scroll progress across stretches that hold one frame (pads, hero, lens). */
	const REWIND_FAST_MS_PER_PROGRESS = 4000;
	/** Share of the gap to the scroll's frame closed each animation frame while scrubbing. */
	const SCRUB_EASE = 0.3;

	function setNativePlay(on: boolean) {
		playback.nativePlay = on;
		clipPlaying = on;
	}

	function noteActivity() {
		idleGen += 1;
	}

	function setDirection(dir: 1 | -1) {
		scrollDir = dir;
		dirAnchor = playback.localScrollP;
	}

	function stopReverseNav() {
		reverseNavGen += 1;
		if (reverseRaf) {
			cancelAnimationFrame(reverseRaf);
			reverseRaf = 0;
		}
		reverseNavigating = false;
		retreatTargetIdx = null;
	}

	/** Point the scrub at the frame already showing, so handing over to the scroll never jumps. */
	function holdCurrentFrame(video: HTMLVideoElement | null) {
		if (!video?.duration || !Number.isFinite(video.duration)) {
			playback.easedT = -1;
			playback.frameIndex = -1;
			return;
		}
		playback.easedT = video.currentTime;
		playback.frameIndex = frameIndexAt(video.currentTime, video.duration);
	}

	function stopNativePlay() {
		scenePlayGen += 1;
		setNativePlay(false);
		const video = videoEl;
		if (video) {
			video.loop = false;
			video.playbackRate = 1;
			if (!video.paused) video.pause();
		}
		holdCurrentFrame(video);
	}

	/** Seek to the first frame and resolve after the browser paints it (avoids end-frame flash). */
	function seekVideoToStart(video: HTMLVideoElement, gen: number): Promise<void> {
		return new Promise((resolve) => {
			if (gen !== scenePlayGen) {
				resolve();
				return;
			}

			const done = () => {
				video.removeEventListener('seeked', done);
				window.clearTimeout(fallback);
				clipTime = 0;
				playback.easedT = 0;
				playback.frameIndex = 0;
				resolve();
			};

			// Already on (or very near) the first frame.
			if (video.currentTime < 0.05 && !video.seeking) {
				clipTime = 0;
				playback.easedT = 0;
				playback.frameIndex = 0;
				resolve();
				return;
			}

			video.addEventListener('seeked', done);
			const fallback = window.setTimeout(done, 250);
			try {
				video.currentTime = 0;
			} catch {
				done();
			}
		});
	}

	function isPlayableClipBeat(id: BeatId) {
		return isSceneBeatId(id) || isPayoffBeatId(id);
	}

	function activeIndex(): number {
		const index = beatDefs.findIndex((b) => b.id === activeBeatId);
		return index >= 0 ? index : currentBeatIndex(scrollProgress(), beatDefs);
	}

	/** Scroll the page to `p` (0–1) as the page itself rather than the visitor. */
	function writeScroll(p: number) {
		const clamped = Math.min(1, Math.max(0, p));
		if (!scrubEnabled) {
			// No scroll space on touch devices: progress lives only in the page's state.
			syncScrollState(clamped);
			return;
		}
		const max = document.documentElement.scrollHeight - window.innerHeight;
		const top = max * clamped;
		if (Math.abs(window.scrollY - top) > 0.5) window.scrollTo({ top, behavior: 'auto' });
		playback.lastWrittenY = top;
		syncScrollState(clamped);
	}

	/**
	 * Play a scene / payoff clip from the first frame to the last at 1×. For scenes the scroll
	 * follows the playhead (see `followPlayhead`), and the clip parks in its rest zone when done,
	 * so scrolling afterwards scrubs on from the last frame.
	 */
	async function playActiveSceneToEnd(beatId: BeatId): Promise<void> {
		if (!isPlayableClipBeat(beatId)) return;
		if (!playback.hasVideo || !clipReady) return;

		const video = videoEl;
		if (!video) return;

		const expected = sceneSrcForBeat(theme, beatId);
		if (!expected || clipSrc !== expected || !videoMatchesSrc(video, expected)) return;

		const gen = ++scenePlayGen;
		video.loop = false;
		video.playbackRate = 1;
		setNativePlay(true);
		if (isPayoffBeatId(beatId)) payoffFinished = false;

		await seekVideoToStart(video, gen);
		if (gen !== scenePlayGen) return;

		await new Promise<void>((resolve) => {
			let settled = false;
			const dur =
				video.duration && Number.isFinite(video.duration) && video.duration > 0
					? video.duration
					: 12;

			const onTime = () => {
				if (gen !== scenePlayGen) return;
				clipTime = video.currentTime;
			};

			const finish = () => {
				if (settled) return;
				settled = true;
				video.removeEventListener('ended', finish);
				video.removeEventListener('timeupdate', onTime);
				window.clearTimeout(safety);
				resolve();
				// Superseded (Next, Back, the visitor scrolling): leave the playhead alone.
				if (gen !== scenePlayGen) return;

				video.pause();
				setNativePlay(false);
				const d = video.duration;
				const hasDur = Boolean(d) && Number.isFinite(d);

				if (isPayoffBeatId(beatId)) {
					payoffFinished = true;
					if (hasDur) {
						try {
							video.currentTime = lastFrameTime(d);
						} catch {
							/* ignore */
						}
						clipTime = d;
					}
					playback.easedT = -1;
					return;
				}

				// Scene: park the scroll in the rest zone; the scrub then holds the last frame
				// (and seeks to it if playback was cut short).
				if (hasDur) clipTime = d;
				holdCurrentFrame(video);
				playback.easedT = -1;
				const index = beatDefs.findIndex((b) => b.id === beatId);
				if (index >= 0 && activeBeatId === beatId && !reverseNavigating) {
					writeScroll(sceneZones(beatDefs, index).rest);
				}
			};

			const safety = window.setTimeout(finish, (dur + 1.5) * 1000);
			video.addEventListener('ended', finish);
			video.addEventListener('timeupdate', onTime);
			void video.play().catch(() => finish());
		});
	}

	/** While a scene plays, move the scroll with the playhead so scroll and frame always agree. */
	function followPlayhead(t: number, duration: number) {
		const index = beatDefs.findIndex((b) => b.id === activeBeatId);
		if (index < 0) return;
		writeScroll(sceneProgressAt(beatDefs, index, t / Math.max(0.001, lastFrameTime(duration))));
	}

	/** Move the frame toward wherever the scroll maps to, one decoded frame at a time. */
	function scrubTo(video: HTMLVideoElement) {
		if (!video.paused) video.pause();
		const dur = video.duration;
		const target = localClipProgress(playback.localScrollP, activeBeatId) * lastFrameTime(dur);
		if (reverseNavigating || playback.easedT < 0) {
			playback.easedT = target;
		} else {
			const gap = target - playback.easedT;
			playback.easedT = Math.abs(gap) < 0.5 / CLIP_FPS ? target : playback.easedT + gap * SCRUB_EASE;
		}

		// One seek at a time: with sparse keyframes a seek can take several frames to decode.
		if (video.seeking) return;
		const index = frameIndexAt(playback.easedT, dur);
		const t = frameTime(index, dur);
		if (index === playback.frameIndex && Math.abs(video.currentTime - t) < 0.75 / CLIP_FPS) return;
		try {
			video.currentTime = t;
		} catch {
			return;
		}
		playback.frameIndex = index;
		clipTime = t;
	}

	function jumpTo(p: number, opts: { instant?: boolean } = {}) {
		if (loading) return;
		stopReverseNav();
		pendingPlayBeat = null;
		if (!(p <= 0.02 && isHeroLoopBeat(activeBeatId))) stopNativePlay();
		if (p > 0.02) journeyStarted = true;
		setDirection(p >= playback.localScrollP ? 1 : -1);
		if (opts.instant || reduced || !scrubEnabled) {
			writeScroll(p);
			return;
		}
		const max = document.documentElement.scrollHeight - window.innerHeight;
		window.scrollTo({ top: max * Math.min(1, Math.max(0, p)), behavior: 'smooth' });
	}

	function sceneTextAfter(beatId: BeatId): number {
		return SCENES.find((s) => s.id === beatId)?.textAfterSeconds ?? SCENE_TEXT_AFTER_SECONDS;
	}

	function isHeroLoopBeat(id: BeatId) {
		return id === 'beat-hero' && Boolean(theme.hero);
	}

	/** Keep the hero plate looping at its native speed until the journey starts. */
	function playHeroLoop() {
		if (!isHeroLoopBeat(activeBeatId)) return;
		if (!playback.hasVideo || !clipReady) return;

		const video = videoEl;
		if (!video) return;

		const expected = sceneSrcForBeat(theme, 'beat-hero');
		if (expected && clipSrc !== expected) return;
		if (expected && !videoMatchesSrc(video, expected)) return;

		video.loop = true;
		video.playbackRate = 1;
		setNativePlay(true);
		if (video.paused) {
			void video.play().catch(() => {
				/* autoplay blocked — still frame is fine */
			});
		}
	}

	/** Cut to a scene's first frame and play it through once its clip is showing. */
	function enterScene(id: BeatId) {
		if (loading) return;
		const index = beatDefs.findIndex((b) => b.id === id);
		if (index < 0) return;
		stopReverseNav();
		// The hero keeps looping underneath until the scene's clip fades in over it.
		if (!isHeroLoopBeat(activeBeatId)) stopNativePlay();
		journeyStarted = true;
		pendingPlayBeat = id;
		writeScroll(sceneZones(beatDefs, index).enter);
		setDirection(1);
	}

	function beginJourney() {
		if (loading) return;
		if (beatDefs.some((b) => b.id === 'beat-scene-1')) {
			enterScene('beat-scene-1');
			return;
		}
		jumpTo(nextBeatProgress(0, beatDefs, videoDuration), { instant: true });
	}

	function jumpToScene(sceneNumber: number) {
		enterScene(`beat-scene-${sceneNumber}` as BeatId);
	}

	function advance() {
		if (loading) return;
		const nextIdx = nextVisibleBeatIndex(beatDefs, activeIndex() + 1);
		if (nextIdx < 0) {
			jumpTo(1, { instant: true });
			return;
		}

		const next = beatDefs[nextIdx]!;
		if (isSceneBeatId(next.id)) {
			enterScene(next.id);
			return;
		}
		journeyStarted = true;
		const p = isPayoffBeatId(next.id)
			? next.at + 0.01
			: beatFocusProgress(next, beatDefs, videoDuration, sceneTextAfter(next.id));
		jumpTo(p, { instant: true });
	}

	/**
	 * Rewind: animate the scroll back so the scrub plays the clip backwards to its first frame,
	 * then step into the previous scene on its last frame (the state before Next was pressed).
	 */
	function retreat() {
		if (loading) return;
		const base = retreatTargetIdx ?? activeIndex();
		if (base <= 0) return;
		pendingPlayBeat = null;
		stopNativePlay();

		const targetIdx = prevVisibleBeatIndex(beatDefs, base);
		const target = beatRestProgress(beatDefs[targetIdx]!, beatDefs);
		setDirection(-1);
		animateRetreatTo(target, targetIdx);
	}

	type RewindSegment = { from: number; to: number; ms: number };

	/**
	 * Timed path for a rewind: stretches inside a scene's play zone run at REWIND_RATE × the
	 * clip's real time; stretches that hold a single frame (pads, hero, lens) pass quickly.
	 */
	function rewindPath(startP: number, endP: number): RewindSegment[] {
		if (startP <= endP) {
			return [{ from: startP, to: endP, ms: (endP - startP) * REWIND_FAST_MS_PER_PROGRESS }];
		}
		const clipSeconds = videoDuration > 0 && Number.isFinite(videoDuration) ? videoDuration : 5;
		const zones = beatDefs
			.map((b, i) => (isSceneBeatId(b.id) && !b.hidden ? sceneZones(beatDefs, i) : null))
			.filter((z): z is NonNullable<typeof z> => z !== null);

		const cuts = [startP, endP];
		for (const z of zones) {
			for (const pt of [z.playFrom, z.playTo]) {
				if (pt < startP && pt > endP) cuts.push(pt);
			}
		}
		cuts.sort((a, b) => b - a);

		const segments: RewindSegment[] = [];
		for (let i = 0; i < cuts.length - 1; i++) {
			const from = cuts[i]!;
			const to = cuts[i + 1]!;
			if (from - to < 1e-6) continue;
			const mid = (from + to) / 2;
			const zone = zones.find((z) => mid > z.playFrom && mid < z.playTo);
			const ms = zone
				? ((from - to) / (zone.playTo - zone.playFrom)) * (clipSeconds / REWIND_RATE) * 1000
				: (from - to) * REWIND_FAST_MS_PER_PROGRESS;
			segments.push({ from, to, ms });
		}
		return segments;
	}

	function animateRetreatTo(target: number, targetIdx: number) {
		const gen = ++reverseNavGen;
		if (reverseRaf) {
			cancelAnimationFrame(reverseRaf);
			reverseRaf = 0;
		}
		reverseNavigating = true;
		retreatTargetIdx = targetIdx;

		const endP = Math.min(1, Math.max(0, target));
		const path = rewindPath(scrollProgress(), endP);
		const total = path.reduce((sum, seg) => sum + seg.ms, 0);

		const finish = () => {
			if (gen !== reverseNavGen) return;
			writeScroll(endP);
			if (endP <= 0.02) journeyStarted = false;
			playback.easedT = -1;
			reverseNavigating = false;
			reverseRaf = 0;
			retreatTargetIdx = null;
		};

		if (reduced || total < 16) {
			finish();
			return;
		}

		const start = performance.now();
		const step = (now: number) => {
			if (gen !== reverseNavGen) return;
			let elapsed = now - start;
			if (elapsed >= total) {
				finish();
				return;
			}
			let p = endP;
			for (const seg of path) {
				if (elapsed <= seg.ms) {
					p = seg.from + (seg.to - seg.from) * (seg.ms > 0 ? elapsed / seg.ms : 1);
					break;
				}
				elapsed -= seg.ms;
			}
			writeScroll(p);
			reverseRaf = requestAnimationFrame(step);
		};
		reverseRaf = requestAnimationFrame(step);
	}

	function scrollProgress(): number {
		if (!scrubEnabled) return playback.localScrollP;
		const max = document.documentElement.scrollHeight - window.innerHeight;
		return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
	}

	function syncScrollState(progress = scrollProgress()) {
		playback.localScrollP = progress;
		scrollP = progress;
		if (progress > 0.02) journeyStarted = true;
	}

	function setLoading(next: boolean) {
		loading = next;
		document.documentElement.classList.toggle('loading', next);
	}

	/** Non-reactive: must not be read as an $effect dependency. */
	let firstClipLoaded = false;

	/** Runs each time a clip is brought to the front (see JourneyVideo `promote`). */
	function handleClipReady() {
		firstClipLoaded = true;
		playback.ready = true;
		playback.hasVideo = true;
		clipReady = true;
		const video = videoEl;
		if (video?.duration && Number.isFinite(video.duration)) {
			videoDuration = video.duration;
		}
		if (video && isHeroLoopBeat(activeBeatId)) {
			playHeroLoop();
		} else if (video) {
			// A scene or the lens has just faded in, already on the frame the scroll maps to
			// (`startTimeFor`). Scroll drives it from here unless a play was asked for.
			scenePlayGen += 1;
			setNativePlay(false);
			payoffFinished = false;
			try {
				video.loop = false;
				video.playbackRate = 1;
				video.pause();
			} catch {
				/* ignore */
			}
			clipTime = video.currentTime;
			holdCurrentFrame(video);
			playback.easedT = -1;
		}
		window.setTimeout(() => setLoading(false), 200);
	}

	/** Frame an incoming clip should land on, from where the scroll is when it has loaded. */
	function startTimeFor(url: string, duration: number): number {
		if (!duration || !Number.isFinite(duration)) return 0;
		let beat: BeatId | null = null;
		if (sceneSrcForBeat(theme, activeBeatId) === url) beat = activeBeatId;
		else beat = beatDefs.find((b) => !b.hidden && sceneSrcForBeat(theme, b.id) === url)?.id ?? null;
		if (!beat || !isSceneBeatId(beat) || pendingPlayBeat === beat) return 0;
		const local = localClipProgress(playback.localScrollP, beat);
		return frameTime(frameIndexAt(local * lastFrameTime(duration), duration), duration);
	}

	function videoMatchesSrc(video: HTMLVideoElement, expected: string) {
		const activeSrc = video.currentSrc || video.src;
		if (!activeSrc) return false;
		return activeSrc.includes(expected) || activeSrc.endsWith(expected.replace(/^\//, ''));
	}

	/** Local 0–1 playhead position the scroll maps to inside `beatId`. */
	function localClipProgress(progress: number, beatId: BeatId): number {
		const index = beatDefs.findIndex((b) => b.id === beatId);
		if (index < 0 || beatId === 'beat-hero' || !journeyStarted) return 0;
		// The lens plays through on its own, then holds its last frame.
		if (isPayoffBeatId(beatId)) return payoffFinished ? 1 : 0;
		if (isSceneBeatId(beatId)) return sceneLocalProgress(progress, beatDefs, index);
		return 0;
	}

	/**
	 * True once the front layer is showing this scene's own clip. Between a beat change and the
	 * crossfade, `videoEl`, `clipTime` and `videoDuration` still describe the outgoing clip, and
	 * timing a scene's text off those would flash it up on the first frame of the new scene.
	 */
	function sceneClipShown(sceneId: BeatId): boolean {
		const own = sceneSrcForBeat(theme, sceneId);
		if (!own || clipSrc !== own) return false;
		const video = videoEl;
		return Boolean(video && videoMatchesSrc(video, own));
	}

	function sceneShowsText(sceneId: BeatId, sceneIndex: number, afterSeconds: number): boolean {
		if (sceneIndex < 0) return false;
		if (!isBeatActive(scrollP, beatDefs, sceneIndex)) return false;
		if (activeBeatId === sceneId && videoDuration > 0) {
			if (!sceneClipShown(sceneId)) return false;
			return clipTime >= afterSeconds;
		}
		return isSceneTextActive(scrollP, beatDefs, sceneIndex, videoDuration, afterSeconds);
	}

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;

		if (reduced) {
			activeBeats = initialActiveBeats(true, beatDefs);
			loadProgress = 1;
			setLoading(false);
			return;
		}

		// Phones and tablets: scrolling frame by frame is too rough on touch, so the journey is
		// driven by its buttons (and the idle auto-advance) instead. Decided once, at mount.
		scrubEnabled = !window.matchMedia('(hover: none) and (pointer: coarse)').matches;
		document.documentElement.classList.toggle('journey-no-scrub', !scrubEnabled);

		let raf = 0;

		/** The page is scrolling itself: a scene playing, Back rewinding, or a scene about to play. */
		const pageDriving = () =>
			reverseNavigating ||
			pendingPlayBeat !== null ||
			(playback.nativePlay && isSceneBeatId(activeBeatId));

		/** The visitor scrolled: hand the video back to the scroll at the frame it is on. */
		const takeOver = () => {
			if (reverseNavigating) stopReverseNav();
			pendingPlayBeat = null;
			if (playback.nativePlay && isSceneBeatId(activeBeatId)) stopNativePlay();
			playback.lastWrittenY = -1;
		};

		const onUserScrollIntent = () => {
			noteActivity();
			if (scrubEnabled && pageDriving()) takeOver();
		};

		const onScroll = () => {
			if (!scrubEnabled) return;
			if (loading && !playback.ready) return;
			// Scrollbar drags and keyboard scrolling have no wheel/touch event: spot them by the
			// scroll moving away from where the page last put it.
			const byVisitor =
				playback.lastWrittenY < 0 || Math.abs(window.scrollY - playback.lastWrittenY) > 4;
			if (byVisitor) noteActivity();
			if (pageDriving() && playback.lastWrittenY >= 0 && byVisitor) {
				takeOver();
			}

			const p = scrollProgress();
			playback.localScrollP = p;
			scrollP = p;

			if (scrollDir > 0) {
				if (p > dirAnchor) dirAnchor = p;
				else if (p < dirAnchor - 0.01) {
					scrollDir = -1;
					dirAnchor = p;
				}
			} else if (p < dirAnchor) {
				dirAnchor = p;
			} else if (p > dirAnchor + 0.01) {
				scrollDir = 1;
				dirAnchor = p;
			}

			if (p > 0.02) journeyStarted = true;
		};

		const frame = () => {
			const video = videoEl;
			if (
				playback.ready &&
				playback.hasVideo &&
				video &&
				video.duration &&
				Number.isFinite(video.duration) &&
				video.readyState >= 2 &&
				// Until the crossfade promotes the new clip, `video` is still the outgoing layer;
				// driving it from the incoming beat's scroll would show the wrong frames.
				clipSrc === sceneSrcForBeat(theme, activeBeatId) &&
				videoMatchesSrc(video, clipSrc)
			) {
				if (playback.nativePlay) {
					const t = video.currentTime;
					// Throttle the reactive write: ~30 Hz is plenty for text-reveal thresholds
					// and avoids re-evaluating every scene's visibility on each frame.
					if (Math.abs(t - clipTime) > 1 / 30) clipTime = t;
					playback.easedT = t;
					if (!reverseNavigating && !video.paused && isSceneBeatId(activeBeatId)) {
						followPlayhead(t, video.duration);
					}
				} else {
					scrubTo(video);
				}
			}
			raf = requestAnimationFrame(frame);
		};

		window.addEventListener('wheel', onUserScrollIntent, { passive: true });
		window.addEventListener('touchmove', onUserScrollIntent, { passive: true });
		window.addEventListener('pointerdown', noteActivity, { passive: true });
		window.addEventListener('touchstart', noteActivity, { passive: true });
		// Coming back to the tab starts the idle clock afresh rather than jumping scenes at once.
		document.addEventListener('visibilitychange', noteActivity);
		// The FAQ sheet and the mobile menu flag themselves on <html>; the journey waits for them.
		const syncSheetOpen = () => {
			const root = document.documentElement.classList;
			sheetOpen = root.contains('faq-open') || root.contains('journey-menu-open');
		};
		const sheetObserver = new MutationObserver(syncSheetOpen);
		sheetObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		syncSheetOpen();
		const onKeyNav = (e: KeyboardEvent) => {
			noteActivity();
			const tag = (e.target as HTMLElement | null)?.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement | null)?.isContentEditable) {
				return;
			}

			if (e.key === 'ArrowRight') {
				e.preventDefault();
				advance();
				return;
			}
			if (e.key === 'ArrowLeft') {
				e.preventDefault();
				retreat();
			}
		};
		window.addEventListener('keydown', onKeyNav);
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		dirAnchor = playback.localScrollP;
		raf = requestAnimationFrame(frame);

		return () => {
			window.removeEventListener('wheel', onUserScrollIntent);
			window.removeEventListener('touchmove', onUserScrollIntent);
			window.removeEventListener('pointerdown', noteActivity);
			window.removeEventListener('touchstart', noteActivity);
			document.removeEventListener('visibilitychange', noteActivity);
			sheetObserver.disconnect();
			document.documentElement.classList.remove('journey-no-scrub');
			window.removeEventListener('keydown', onKeyNav);
			window.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(raf);
			document.documentElement.classList.remove('loading');
			stopReverseNav();
			stopNativePlay();
		};
	});

	// Swap to the active beat's clip whenever the beat changes, in either direction and during
	// a rewind; JourneyVideo lands it on the scroll's frame (`startTimeFor`) before the fade.
	$effect(() => {
		if (!mounted || reduced) return;
		const nextSrc = sceneSrcForBeat(theme, activeBeatId) ?? '';
		if (nextSrc && nextSrc !== clipSrc) {
			clipSrc = nextSrc;
			playback.easedT = -1;
			playback.frameIndex = -1;
			clipTime = 0;
		}
	});

	// Real playback: the hero loops, the lens plays through on arrival, and a scene plays only
	// when Next / Begin / the scene index asked for it. Scrolling into a scene just scrubs.
	$effect(() => {
		if (!mounted || reduced || !clipReady) return;
		const id = activeBeatId;
		const pending = pendingPlayBeat;
		void clipSrc;
		void videoEl;

		if (isHeroLoopBeat(id)) {
			playHeroLoop();
			return;
		}

		if (loading) return;

		if (!isPlayableClipBeat(id)) {
			if (playback.nativePlay) stopNativePlay();
			return;
		}

		if (!sceneClipShown(id)) return;

		if (isPayoffBeatId(id)) {
			if (!payoffFinished && !playback.nativePlay && !reverseNavigating) {
				void playActiveSceneToEnd(id);
			}
			return;
		}

		if (pending === id) {
			pendingPlayBeat = null;
			void playActiveSceneToEnd(id);
		}
	});

	/**
	 * Beat that is settled, so the idle clock may run: the hero before the journey has begun,
	 * or a scene whose clip has finished (or is parked on a frame) with its copy and arrows
	 * showing, while nothing is rewinding or about to play.
	 */
	const settledBeat = $derived.by<BeatId | null>(() => {
		if (!mounted || reduced || loading) return null;
		if (reverseNavigating || pendingPlayBeat !== null) return null;
		const id = activeBeatId;
		if (id === 'beat-hero') return journeyStarted ? null : id;
		if (!isSceneBeatId(id) || clipPlaying) return null;
		const index = beatDefs.findIndex((b) => b.id === id);
		if (!sceneShowsText(id, index, sceneTextAfter(id))) return null;
		return id;
	});

	// Nothing happened for a while on a settled beat: first its forward button glows, then the
	// journey moves on by itself (Begin on the hero, Next on a scene). Any input restarts the
	// clock; an open preview, the FAQ sheet, the mobile menu or a hidden tab holds it.
	$effect(() => {
		const beat = settledBeat;
		void idleGen;
		const held = sheetOpen || openPreviews.size > 0;
		idleHintBeat = null;
		if (!beat || held) return;

		const onHero = beat === 'beat-hero';
		const goAfter = onHero ? HERO_AUTO_BEGIN_AFTER_MS : AUTO_ADVANCE_AFTER_MS;
		// A timer set to 0 in the CMS is that step switched off, not an instant move.
		const hint = IDLE_HINT_AFTER_MS > 0 ? window.setTimeout(() => {
			idleHintBeat = beat;
		}, IDLE_HINT_AFTER_MS) : 0;
		const go = goAfter > 0 ? window.setTimeout(() => {
			idleHintBeat = null;
			if (document.visibilityState !== 'visible') return;
			if (onHero) beginJourney();
			else advance();
		}, goAfter) : 0;
		return () => {
			window.clearTimeout(hint);
			window.clearTimeout(go);
		};
	});

	function setPreviewOpen(id: BeatId, open: boolean) {
		if (openPreviews.has(id) === open) return;
		const next = new Set(openPreviews);
		if (open) next.add(id);
		else next.delete(id);
		openPreviews = next;
	}

	$effect(() => {
		if (missing && loading) {
			loadProgress = 1;
			firstClipLoaded = true;
			document.documentElement.classList.remove('loading');
			loading = false;
		}
	});

	// Single source of truth for which beats are on — derived from scroll progress.
	$effect(() => {
		if (reduced) return;
		const next = {} as Record<BeatId, boolean>;
		for (let i = 0; i < beatDefs.length; i++) {
			const beat = beatDefs[i]!;
			next[beat.id] = isBeatActive(scrollP, beatDefs, i);
		}
		activeBeats = next;
	});

	$effect(() => {
		if (!onHero) {
			heroShowMeOpen = false;
			return;
		}
		if (reduced) {
			heroShowMeOpen = true;
			return;
		}
		heroShowMeOpen = false;
		const timer = window.setTimeout(() => {
			heroShowMeOpen = true;
		}, HERO_SHOW_ME_DELAY_MS);
		return () => window.clearTimeout(timer);
	});

	$effect(() => {
		if (!onLens) {
			lensCopyOpen = false;
			return;
		}
		if (reduced) {
			lensCopyOpen = true;
			return;
		}
		lensCopyOpen = false;
		const timer = window.setTimeout(() => {
			lensCopyOpen = true;
		}, LENS_COPY_DELAY_MS);
		return () => window.clearTimeout(timer);
	});
</script>

<JourneyLoader progress={loadProgress} visible={loading} />
<!-- Every fixed layer of the journey, lifted as one when the FAQ opens, so the video moves up and
     the questions rise in beneath it (see JourneyFaq and .journey-lift in layout.css). -->
<div class="journey-lift">
{#if mounted && !reduced}
	<JourneyVideo
		bind:videoEl
		bind:missing
		bind:ready={clipReady}
		bind:loadProgress
		src={clipSrc}
		nextSrc={nextClipSrc}
		focusFor={(url) => focusForSrc(theme, url)}
		{startTimeFor}
		onReady={handleClipReady}
	/>
{/if}
<!-- Three scrims crossfade by opacity; gradient backgrounds cannot be transitioned. -->
<div id="scrim" aria-hidden="true">
	<div class={['scrim-layer scrim-base', !onLens && 'on']}></div>
	<div class={['scrim-layer scrim-view', onLens && !lensCopyOpen && 'on']}></div>
	<div class={['scrim-layer scrim-payoff', onLens && lensCopyOpen && 'on']}></div>
</div>

<!-- The hero sits outside the loading gate so the page's one <h1> is in the server-rendered
     HTML. Nothing shows early: a beat is opacity 0 until it is on, and the loader covers the
     page at z-60 until the first clip is ready. -->
	<Beat id="beat-hero" active={activeBeats['beat-hero']} label={UI.heroBeatLabel} class="hero-copy">
		<div class="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
			<div class="hero-main w-full min-w-0">
				<p
					class="mb-4 text-[12px] tracking-[0.2em] text-lens uppercase sm:text-[13px] sm:tracking-[0.22em]"
				>
					{content.hero.strapline}
				</p>
				<h1
					class="text-[clamp(2.25rem,6.5vw,5rem)] leading-[1.02] font-bold tracking-tight text-bone"
				>
					{#each content.hero.titleLines as line, i (line)}
						{#if i > 0}<br />{/if}{line}
					{/each}
				</h1>

				<div class="mt-7 flex flex-wrap items-center gap-5 sm:mt-9">
					<button
						type="button"
						onclick={beginJourney}
						class={[
							'inline-flex max-w-full cursor-pointer items-center gap-2 rounded-full bg-lens px-6 py-3 text-center text-[14px] sm:px-7 sm:py-3.5 sm:text-[15px] font-semibold tracking-wide text-white shadow-[0_0_0_1px_rgba(0,155,204,0.35),0_0_32px_rgba(0,155,204,0.35),0_10px_28px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens',
							idleHintBeat === 'beat-hero' && 'idle-hint'
						]}
					>
						{content.hero.cta}
					</button>
				</div>

				<p
					class="mt-5 max-w-[42ch] text-[14px] leading-relaxed font-light text-bone/75 [text-shadow:0_1px_18px_rgba(4,6,10,0.8)] sm:mt-6 sm:text-[15px]"
				>
					{content.hero.subline}
				</p>
			</div>

			<div class="hero-specs flex w-full justify-end sm:w-auto sm:justify-start">
				<ShowMeFlash
					label={content.hero.showMe.label}
					href={content.hero.showMe.href}
					open={heroShowMeOpen}
					stacked
				/>
			</div>
		</div>
	</Beat>

{#if !loading}
	<JourneyNav
		onHome={() => jumpTo(navJumps.hero, { instant: true })}
		onJump={(p) => jumpTo(p, { instant: true })}
		jumps={navJumps}
		copy={site.nav}
	/>
	<JourneySceneIndex
		current={activeSceneNumber}
		visible={sceneIndexVisible}
		onSelect={jumpToScene}
	/>
	<JourneyLegal links={site.legal.links} ariaLabel={site.legal.ariaLabel} />


	{#each SCENES as scene (scene.id)}
		{@const sceneIndex = beatDefs.findIndex((b) => b.id === scene.id)}
		{@const lead = scene.textAfterSeconds ?? SCENE_TEXT_AFTER_SECONDS}
		<JourneyScene
			id={scene.id}
			active={reduced || sceneShowsText(scene.id, sceneIndex, lead)}
			label={scene.label}
			pain={scene.pain}
			whatIfRest={scene.whatIfRest}
			showMe={sceneShowMe(scene.showMe)}
			class={sceneClassName(scene)}
			hint={idleHintBeat === scene.id}
			onAdvance={advance}
			onRetreat={retreat}
			onPreviewChange={(open) => setPreviewOpen(scene.id, open)}
		/>
	{/each}

	<Beat
		id="beat-lens"
		active={activeBeats['beat-lens']}
		label={UI.lensBeatLabel}
		class="lens-copy px-5 sm:px-8 {lensCopyOpen ? '' : 'lens-view'}"
	>
		<h2
			class={[
				'transition-all duration-700',
				lensCopyOpen
					? 'mb-3 text-[11px] tracking-[0.28em] text-gold uppercase [text-shadow:0_1px_12px_rgba(4,6,10,0.7)] sm:text-[12px]'
					: 'text-[clamp(2.5rem,5.8vw,4.15rem)] leading-[1.08] font-bold tracking-tight text-bone'
			]}
		>
			{#if lensCopyOpen}
				{content.lens.eyebrow}
			{:else}
				{#each content.lens.eyebrowLines ?? [content.lens.eyebrow] as line, i (line)}
					{#if i > 0}<br />{/if}{line}
				{/each}
			{/if}
		</h2>
		{#if !lensCopyOpen}
			<div class="lens-view-arrow" aria-hidden="true">
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none">
					<path
						d="M12 5v14M6 11l6-6 6 6"
						stroke="currentColor"
						stroke-width="1.75"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</div>
		{/if}
		<div class={['lens-rest', lensCopyOpen && 'open']} inert={!lensCopyOpen}>
			<div class="lens-rest-inner">
				<p
					class="text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.04] font-bold tracking-tight text-bone"
				>
					{content.lens.title}
				</p>
				<p
					class="mx-auto mt-4 max-w-[52ch] text-[15px] leading-relaxed font-light text-bone/90 [text-shadow:0_1px_18px_rgba(4,6,10,0.85)] sm:text-[16px]"
				>
					{content.lens.body}
				</p>

				<div class="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
					<a
						id="demo"
						href={content.lens.primaryCta.href}
						class="inline-flex cursor-pointer items-center justify-center rounded-full bg-gold px-7 py-3 text-[14px] font-semibold tracking-wide text-gold-ink shadow-[0_0_0_1px_rgba(212,175,106,0.35),0_0_28px_rgba(212,175,106,0.28),0_10px_24px_rgba(0,0,0,0.35)] no-underline transition-all hover:-translate-y-0.5 hover:bg-[#e0c07a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
					>
						{content.lens.primaryCta.label}
					</a>
					<a
						href={content.lens.showMe.href}
						class="inline-flex cursor-pointer items-center justify-center rounded-full bg-lens px-7 py-3 text-[14px] font-semibold tracking-wide text-white shadow-[0_0_0_1px_rgba(0,155,204,0.35),0_0_28px_rgba(0,155,204,0.28),0_10px_24px_rgba(0,0,0,0.35)] no-underline transition-all hover:-translate-y-0.5 hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
					>
						{content.lens.showMe.label}
					</a>
				</div>
				<a
					href={content.lens.secondaryCta.href}
					target="_blank"
					rel="noopener noreferrer"
					class="mt-3 inline-flex cursor-pointer items-center justify-center gap-2 text-[13px] font-medium text-bone/80 no-underline underline-offset-4 transition-colors hover:text-gold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M8 5.14v13.72L19.06 12 8 5.14z" />
					</svg>
					{content.lens.secondaryCta.label}
				</a>

				<h2 class="mt-8 mb-4 text-[11px] tracking-[0.24em] text-bone/80 uppercase [text-shadow:0_1px_12px_rgba(4,6,10,0.7)]">
					{content.lens.principlesLabel}
				</h2>
				<ol class="grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
					{#each PRINCIPLES as item, i (item.title)}
						<li
							class="relative overflow-hidden rounded-2xl border border-gold/40 bg-ink/80 p-5 shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_16px_48px_rgba(4,6,10,0.5)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gold/70 before:to-transparent"
						>
							<p class="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-gold tabular-nums">
								{String(i + 1).padStart(2, '0')}
								<span class="h-px flex-1 bg-gold/30" aria-hidden="true"></span>
							</p>
							<p class="mt-3 text-[15px] leading-snug font-bold tracking-tight text-bone sm:text-[16px]">
								{item.title}
								{#if item.subtitle}
									<span class="mt-0.5 block text-[12px] font-medium text-gold/90">{item.subtitle}</span>
								{/if}
							</p>
							<p class="mt-2 text-[13px] leading-relaxed font-light text-bone/80">
								{item.body}
							</p>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</Beat>
{/if}

</div>

<div id="scroll-space" aria-hidden="true"></div>

<!-- Outside the loading gate, so the questions and answers are in the server-rendered page. -->
{#if faqDrawer.show}
	<JourneyFaq labels={faqDrawer} />
{/if}
