<script lang="ts">
	import { onMount } from 'svelte';
	import Beat from '$lib/components/Beat.svelte';
	import JourneyColdOpen from '$lib/components/JourneyColdOpen.svelte';
	import JourneyLoader from '$lib/components/JourneyLoader.svelte';
	import JourneyNav from '$lib/components/JourneyNav.svelte';
	import JourneyScene from '$lib/components/JourneyScene.svelte';
	import JourneySceneIndex from '$lib/components/JourneySceneIndex.svelte';
	import JourneyLegal from '$lib/components/JourneyLegal.svelte';
	import JourneyVideo from '$lib/components/JourneyVideo.svelte';
	import ShowMeFlash from '$lib/components/ShowMeFlash.svelte';
	import {
		beatFocusProgress,
		beatWindow,
		cloneBeatDefs,
		currentBeatIndex,
		initialActiveBeats,
		isBeatActive,
		isPayoffBeatId,
		isSceneBeatId,
		isSceneTextActive,
		loadBeatDefsForVideo,
		navJumpsFromBeats,
		nextBeatProgress,
		nextVisibleBeatIndex,
		prevBeatProgress,
		SCENE_TEXT_AFTER_SECONDS,
		type BeatDef,
		type BeatId
	} from '$lib/journey/beats';
	import {
		COLD_OPEN_STORAGE_KEY,
		DEFAULT_THEME_ID,
		getTheme,
		isJourneyThemeId,
		sceneSrcForBeat,
		themeTimingKey,
		VIDEO_STORAGE_KEY,
		type JourneyTheme
	} from '$lib/journey/videos';
	import { content, sceneClassName } from '$lib/journey/content';

	const SCENES = content.scenes;
	const PRINCIPLES = content.lens.principles;

	let videoEl = $state<HTMLVideoElement | null>(null);
	let themeId = $state(DEFAULT_THEME_ID);
	let theme = $state<JourneyTheme>(getTheme(DEFAULT_THEME_ID));
	let clipSrc = $state(sceneSrcForBeat(getTheme(DEFAULT_THEME_ID), 'beat-hero') ?? '');
	let videoDuration = $state(0);
	let beatDefs = $state<BeatDef[]>(cloneBeatDefs());
	let missing = $state(false);
	let scrollP = $state(0);
	let activeBeats = $state(initialActiveBeats());
	let reduced = $state(false);
	let loading = $state(true);
	let loadProgress = $state(0);
	let mounted = $state(false);
	let coldOpen = $state(false);
	let journeyStarted = $state(false);

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
		!loading && !coldOpen && journeyStarted && activeSceneNumber > 0
	);

	let heroShowMeOpen = $state(false);
	const HERO_SHOW_ME_DELAY_MS = 1100;
	const onHero = $derived(!loading && !coldOpen && activeBeatId === 'beat-hero');

	let lensCopyOpen = $state(false);
	const LENS_COPY_DELAY_MS = (content.lens.textAfterSeconds ?? 3) * 1000;
	const onLens = $derived(!loading && !coldOpen && activeBeatId === 'beat-lens');

	const playback = {
		ready: false,
		hasVideo: false,
		easedT: 0,
		lastSet: -1,
		localScrollP: 0,
		nativePlay: false,
		clipFinished: false
	};

	let clipTime = $state(0);
	let clipReady = $state(false);
	let scenePlayGen = 0;
	let lastScenePlayed: string | null = null;
	/** True while the back control is reverse-scrubbing via scroll. */
	let reverseNavigating = $state(false);

	let reverseNavGen = 0;
	let reverseRaf = 0;

	function stopReverseNav() {
		reverseNavGen += 1;
		if (reverseRaf) {
			cancelAnimationFrame(reverseRaf);
			reverseRaf = 0;
		}
		reverseNavigating = false;
	}

	function stopNativePlay(opts: { hold?: boolean } = {}) {
		scenePlayGen += 1;
		playback.nativePlay = false;
		const video = videoEl;
		if (video) {
			video.loop = false;
			video.playbackRate = 1;
			if (!video.paused) video.pause();
		}
		if (opts.hold && video?.duration) {
			try {
				video.currentTime = Math.max(0, video.duration - 0.05);
				clipTime = video.duration;
				playback.clipFinished = true;
			} catch {
				/* ignore */
			}
		}
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
				playback.lastSet = 0;
				resolve();
			};

			// Already on (or very near) the first frame.
			if (video.currentTime < 0.05 && !video.seeking) {
				clipTime = 0;
				playback.easedT = 0;
				playback.lastSet = 0;
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

	/** Play a scene / payoff clip from the start to the end (real playback). */
	async function playActiveSceneToEnd(forBeatId?: BeatId): Promise<void> {
		const beatId = forBeatId ?? activeBeatId;
		if (!isPlayableClipBeat(beatId)) return;

		// Clear end-hold before any scrub/frame loop can paint the last frame.
		playback.clipFinished = false;
		if (lastScenePlayed === beatId) lastScenePlayed = null;

		if (!playback.hasVideo || !clipReady) return;

		const video = videoEl;
		if (!video) return;

		const expected = sceneSrcForBeat(theme, beatId);
		if (expected && clipSrc !== expected) return;
		if (expected && !videoMatchesSrc(video, expected)) return;

		const gen = ++scenePlayGen;
		video.loop = false;
		video.playbackRate = 1;
		playback.nativePlay = true;
		playback.clipFinished = false;
		lastScenePlayed = beatId;

		await seekVideoToStart(video, gen);
		if (gen !== scenePlayGen) return;

		await new Promise<void>((resolve) => {
			let settled = false;
			const finish = () => {
				if (settled || gen !== scenePlayGen) return;
				settled = true;
				video.removeEventListener('ended', finish);
				video.removeEventListener('timeupdate', onTime);
				window.clearTimeout(safety);
				try {
					if (video.duration && Number.isFinite(video.duration)) {
						video.currentTime = Math.max(0, video.duration - 0.05);
						clipTime = video.duration;
					}
				} catch {
					/* ignore */
				}
				video.pause();
				if (gen === scenePlayGen) {
					playback.nativePlay = false;
					playback.clipFinished = true;
				}
				resolve();
			};

			const onTime = () => {
				if (gen !== scenePlayGen) return;
				clipTime = video.currentTime;
			};

			video.addEventListener('ended', finish);
			video.addEventListener('timeupdate', onTime);

			void video.play().catch(() => finish());

			const dur =
				video.duration && Number.isFinite(video.duration) && video.duration > 0
					? video.duration
					: 12;
			const safety = window.setTimeout(finish, (dur + 1.5) * 1000);
		});
	}

	function jumpTo(p: number, opts: { instant?: boolean; keepPlayhead?: boolean } = {}) {
		if (loading || coldOpen) return;
		stopReverseNav();
		if (!opts.keepPlayhead && !(p <= 0.02 && isHeroLoopBeat(activeBeatId))) {
			stopNativePlay();
		}
		if (p > 0.02) journeyStarted = true;
		const max = document.documentElement.scrollHeight - window.innerHeight;
		const top = max * Math.min(1, Math.max(0, p));
		window.scrollTo({
			top,
			behavior: opts.instant || reduced ? 'auto' : 'smooth'
		});
		if (opts.instant || reduced) {
			syncScrollState(Math.min(1, Math.max(0, p)));
		}
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
		playback.nativePlay = true;
		playback.clipFinished = false;
		lastScenePlayed = null;
		if (video.paused) {
			void video.play().catch(() => {
				/* autoplay blocked — still frame is fine */
			});
		}
	}

	/** Keep playhead ready for scene / payoff autoplay (no end-frame flash). */
	function prepareSceneEnter(beatId: BeatId) {
		if (!isPlayableClipBeat(beatId)) return;
		playback.clipFinished = false;
		lastScenePlayed = null;
		playback.easedT = 0;
		playback.lastSet = -1;
		playback.nativePlay = true;
		const expected = sceneSrcForBeat(theme, beatId);
		const video = videoEl;
		if (video && expected && clipSrc === expected) {
			try {
				video.pause();
				video.currentTime = 0;
			} catch {
				/* ignore */
			}
			clipTime = 0;
		}
	}

	function beginJourney() {
		if (loading) return;
		stopReverseNav();
		journeyStarted = true;
		const firstScene = beatDefs.find((b) => b.id === 'beat-scene-1');
		if (!firstScene) {
			jumpTo(nextBeatProgress(0, beatDefs, videoDuration), { instant: true });
			return;
		}
		prepareSceneEnter(firstScene.id);
		jumpTo(firstScene.at + 0.01, { instant: true, keepPlayhead: true });
	}

	function jumpToScene(sceneNumber: number) {
		const id = `beat-scene-${sceneNumber}` as BeatId;
		const beat = beatDefs.find((b) => b.id === id);
		if (!beat) return;
		journeyStarted = true;
		prepareSceneEnter(id);
		jumpTo(beat.at + 0.01, { instant: true, keepPlayhead: true });
	}

	function advance() {
		if (loading || coldOpen) return;
		stopReverseNav();
		journeyStarted = true;
		const idx = currentBeatIndex(scrollProgress(), beatDefs);

		const nextIdx = nextVisibleBeatIndex(beatDefs, idx + 1);
		if (nextIdx < 0) {
			jumpTo(1, { instant: true });
			return;
		}

		const next = beatDefs[nextIdx]!;
		if (isPlayableClipBeat(next.id)) {
			prepareSceneEnter(next.id);
			jumpTo(next.at + 0.01, { instant: true, keepPlayhead: true });
		} else {
			jumpTo(beatFocusProgress(next, beatDefs, videoDuration, sceneTextAfter(next.id)), {
				instant: true
			});
		}
	}

	/** Animate scroll backward so the active clip scrubs in reverse, like scrolling up. */
	function retreat() {
		if (loading || coldOpen) return;
		stopNativePlay();
		playback.clipFinished = false;
		lastScenePlayed = null;
		playback.easedT = -1;
		playback.lastSet = -1;

		const cur = scrollProgress();
		const idx = currentBeatIndex(cur, beatDefs);
		const lead = sceneTextAfter(beatDefs[idx]?.id ?? 'beat-hero');
		const target = prevBeatProgress(cur, beatDefs, videoDuration, lead);
		if (Math.abs(cur - target) < 0.002) return;

		void animateRetreatTo(target);
	}

	function animateRetreatTo(target: number): Promise<void> {
		const gen = ++reverseNavGen;
		if (reverseRaf) {
			cancelAnimationFrame(reverseRaf);
			reverseRaf = 0;
		}
		reverseNavigating = true;

		return new Promise((resolve) => {
			const max = document.documentElement.scrollHeight - window.innerHeight;
			const startY = window.scrollY;
			const endY = max * Math.min(1, Math.max(0, target));
			const distance = Math.abs(endY - startY);

			const finish = () => {
				if (gen !== reverseNavGen) {
					resolve();
					return;
				}
				window.scrollTo({ top: endY, behavior: 'auto' });
				syncScrollState(Math.min(1, Math.max(0, target)));
				if (target <= 0.02) journeyStarted = false;

				// Land on the previous beat's text hold (end frame for scenes).
				const landed = beatDefs[currentBeatIndex(target, beatDefs)];
				if (landed && isSceneBeatId(landed.id)) {
					playback.clipFinished = true;
					lastScenePlayed = landed.id;
					const video = videoEl;
					if (video?.duration) {
						try {
							video.currentTime = Math.max(0, video.duration - 0.05);
							clipTime = video.duration;
							playback.easedT = video.currentTime;
							playback.lastSet = video.currentTime;
						} catch {
							/* ignore */
						}
					}
				}

				reverseNavigating = false;
				reverseRaf = 0;
				resolve();
			};

			if (reduced || distance < 2) {
				finish();
				return;
			}

			// Pace reverse scrub roughly like watching the clip rewind (~1.15× realtime).
			const clipMs =
				videoDuration && Number.isFinite(videoDuration) ? videoDuration * 1000 * 1.15 : 1400;
			const durationMs = Math.min(3200, Math.max(900, Math.max(clipMs * 0.55, distance * 5500)));
			const start = performance.now();

			const step = (now: number) => {
				if (gen !== reverseNavGen) {
					resolve();
					return;
				}
				const t = Math.min(1, (now - start) / durationMs);
				// Gentle ease — mostly linear so reverse scrub stays readable.
				const eased = t * (2 - t);
				const y = startY + (endY - startY) * eased;
				window.scrollTo({ top: y, behavior: 'auto' });
				syncScrollState(max > 0 ? y / max : 0);
				if (t < 1) {
					reverseRaf = requestAnimationFrame(step);
				} else {
					finish();
				}
			};
			reverseRaf = requestAnimationFrame(step);
		});
	}

	function markColdOpenSeen() {
		try {
			localStorage.setItem(COLD_OPEN_STORAGE_KEY, '1');
		} catch {
			/* ignore */
		}
	}

	function dismissColdOpen(skipToPlatform: boolean) {
		markColdOpenSeen();
		coldOpen = false;
		if (skipToPlatform) {
			journeyStarted = true;
			jumpTo(navJumps.platform);
			return;
		}
		journeyStarted = false;
		jumpTo(0);
	}

	function scrollProgress(): number {
		const max = document.documentElement.scrollHeight - window.innerHeight;
		return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
	}

	function syncScrollState(progress = scrollProgress()) {
		playback.localScrollP = progress;
		scrollP = progress;
		const next = {} as Record<BeatId, boolean>;
		for (let i = 0; i < beatDefs.length; i++) {
			const beat = beatDefs[i]!;
			next[beat.id] = isBeatActive(progress, beatDefs, i);
		}
		activeBeats = next;
		if (progress > 0.02) journeyStarted = true;
	}

	function setLoading(next: boolean) {
		loading = next;
		document.documentElement.classList.toggle('loading', next);
	}

	/** Non-reactive: must not be read as an $effect dependency. */
	let firstClipLoaded = false;

	function handleClipReady() {
		firstClipLoaded = true;
		playback.ready = true;
		playback.hasVideo = true;
		clipReady = true;
		const video = videoEl;
		if (video?.duration && Number.isFinite(video.duration)) {
			videoDuration = video.duration;
		}
		if (reverseNavigating && video?.duration && Number.isFinite(video.duration)) {
			try {
				const local = localClipProgress(playback.localScrollP, activeBeatId);
				const dur = Math.max(0.001, video.duration - 0.05);
				const seekTo = Math.min(dur, Math.max(0, local * dur));
				video.currentTime = seekTo;
				clipTime = seekTo;
				playback.easedT = seekTo;
				playback.lastSet = seekTo;
			} catch {
				/* ignore */
			}
		} else if (video && isHeroLoopBeat(activeBeatId)) {
			playHeroLoop();
		} else if (video) {
			try {
				video.loop = false;
				video.playbackRate = 1;
				video.pause();
				if (video.currentTime > 0.05) video.currentTime = 0;
				clipTime = video.currentTime;
			} catch {
				/* ignore */
			}
		}
		window.setTimeout(() => setLoading(false), 200);
	}

	function videoMatchesSrc(video: HTMLVideoElement, expected: string) {
		const activeSrc = video.currentSrc || video.src;
		if (!activeSrc) return false;
		return activeSrc.includes(expected) || activeSrc.endsWith(expected.replace(/^\//, ''));
	}

	/** Local 0–1 progress inside the active beat (scrub mode only). */
	function localClipProgress(progress: number, beatId: BeatId): number {
		const index = beatDefs.findIndex((b) => b.id === beatId);
		if (index < 0) return 0;

		if (beatId === 'beat-hero' || !journeyStarted) return 0;

		// Finished scene / payoff clip: hold the end frame (not during reverse scrub).
		if (
			!playback.nativePlay &&
			isPlayableClipBeat(beatId) &&
			playback.clipFinished &&
			lastScenePlayed === beatId
		) {
			return 1;
		}

		// Payoff waiting to play: stay on the first frame. Seeking to the end
		// of a freshly loaded clip often paints black.
		if (isPayoffBeatId(beatId)) return 0;

		const { from, to } = beatWindow(beatDefs, index);
		const span = Math.max(0.01, to - from);
		return Math.min(1, Math.max(0, (progress - from) / span));
	}

	function sceneShowsText(sceneId: BeatId, sceneIndex: number, afterSeconds: number): boolean {
		if (sceneIndex < 0) return false;
		if (!isBeatActive(scrollP, beatDefs, sceneIndex)) return false;
		if (activeBeatId === sceneId && videoDuration > 0) {
			return clipTime >= afterSeconds;
		}
		return isSceneTextActive(scrollP, beatDefs, sceneIndex, videoDuration, afterSeconds);
	}

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		try {
			const savedTheme = localStorage.getItem(VIDEO_STORAGE_KEY);
			if (savedTheme && isJourneyThemeId(savedTheme)) {
				themeId = savedTheme;
				theme = getTheme(savedTheme);
				beatDefs = loadBeatDefsForVideo(themeTimingKey(theme));
				clipSrc = sceneSrcForBeat(theme, 'beat-hero') ?? theme.src ?? '';
			}
			const seenCold = localStorage.getItem(COLD_OPEN_STORAGE_KEY);
			coldOpen = seenCold !== '1';
		} catch {
			coldOpen = true;
		}

		mounted = true;

		if (reduced) {
			activeBeats = initialActiveBeats(true, beatDefs);
			loadProgress = 1;
			setLoading(false);
			coldOpen = false;
			return;
		}

		let raf = 0;
		let lastScrollP = 0;

		const onUserScrollIntent = () => {
			if (reverseNavigating) stopReverseNav();
		};

		const onScroll = () => {
			if (loading && !playback.ready) return;
			if (coldOpen) return;
			const max = document.documentElement.scrollHeight - window.innerHeight;
			playback.localScrollP = max > 0 ? window.scrollY / max : 0;
			playback.localScrollP = Math.min(1, Math.max(0, playback.localScrollP));
			scrollP = playback.localScrollP;

			// Manual scrub backward — snap video ease so it doesn't keep drifting forward.
			if (playback.localScrollP < lastScrollP - 0.008) {
				playback.easedT = -1;
				playback.lastSet = -1;
			}
			lastScrollP = playback.localScrollP;

			if (playback.localScrollP > 0.02) journeyStarted = true;

			const next = {} as Record<BeatId, boolean>;
			for (let i = 0; i < beatDefs.length; i++) {
				const beat = beatDefs[i]!;
				next[beat.id] = isBeatActive(playback.localScrollP, beatDefs, i);
			}
			activeBeats = next;
		};

		const frame = () => {
			const video = videoEl;
			if (
				playback.ready &&
				playback.hasVideo &&
				video &&
				video.duration &&
				video.readyState >= 2
			) {
				if (playback.nativePlay) {
					clipTime = video.currentTime;
					playback.easedT = video.currentTime;
					playback.lastSet = video.currentTime;
				} else {
					if (!video.paused) video.pause();

					const dur = Math.max(0.001, video.duration - 0.05);
					const local = theme.scenes?.length
						? localClipProgress(playback.localScrollP, activeBeatId)
						: playback.localScrollP;
					const target = local * dur;
					if (reverseNavigating || playback.easedT < 0) {
						playback.easedT = target;
					} else {
						playback.easedT += (target - playback.easedT) * 0.12;
					}

					const shouldSeek =
						!video.seeking &&
						(playback.lastSet < 0 || Math.abs(playback.lastSet - playback.easedT) > 1 / 30) &&
						Math.abs(video.currentTime - playback.easedT) > 0.02;

					if (shouldSeek) {
						const clamped = Math.min(dur, Math.max(0, playback.easedT));
						video.currentTime = clamped;
						playback.lastSet = clamped;
						clipTime = clamped;
					}
				}
			}
			raf = requestAnimationFrame(frame);
		};

		window.addEventListener('wheel', onUserScrollIntent, { passive: true });
		window.addEventListener('touchstart', onUserScrollIntent, { passive: true });
		const onKeyNav = (e: KeyboardEvent) => {
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
		raf = requestAnimationFrame(frame);

		return () => {
			window.removeEventListener('wheel', onUserScrollIntent);
			window.removeEventListener('touchstart', onUserScrollIntent);
			window.removeEventListener('keydown', onKeyNav);
			window.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(raf);
			document.documentElement.classList.remove('loading');
			stopReverseNav();
			stopNativePlay();
		};
	});

	$effect(() => {
		if (!mounted || reduced) return;
		// Finish reverse-scrub on the current clip, then swap (hero loop / next scene).
		if (reverseNavigating) return;
		const nextSrc = sceneSrcForBeat(theme, activeBeatId) ?? theme.src ?? '';
		if (nextSrc && nextSrc !== clipSrc) {
			clipSrc = nextSrc;
			playback.easedT = 0;
			playback.lastSet = -1;
			playback.clipFinished = false;
			clipTime = 0;
			// Hold the outgoing layer (hero keeps looping; scenes keep last frame) until promote.
			playback.nativePlay = true;
			if (isPlayableClipBeat(activeBeatId)) lastScenePlayed = null;
		}
	});

	$effect(() => {
		if (!mounted || reduced || !clipReady || reverseNavigating) return;
		const id = activeBeatId;
		void clipSrc;
		void videoEl;

		if (isHeroLoopBeat(id)) {
			playHeroLoop();
			return;
		}

		if (loading) return;

		if (!isPlayableClipBeat(id)) {
			if (playback.nativePlay) stopNativePlay();
			lastScenePlayed = null;
			return;
		}

		const expected = sceneSrcForBeat(theme, id);
		if (expected && clipSrc !== expected) return;
		const video = videoEl;
		if (!video || (expected && !videoMatchesSrc(video, expected))) return;

		if (id === lastScenePlayed && (playback.clipFinished || playback.nativePlay)) return;

		void playActiveSceneToEnd();
	});

	$effect(() => {
		if (missing && loading) {
			loadProgress = 1;
			firstClipLoaded = true;
			document.documentElement.classList.remove('loading');
			loading = false;
		}
	});

	$effect(() => {
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
{#if mounted && !reduced}
	<JourneyVideo
		bind:videoEl
		bind:missing
		bind:ready={clipReady}
		bind:loadProgress
		src={clipSrc}
		onReady={handleClipReady}
	/>
{/if}
<div id="scrim" class={onLens ? (lensCopyOpen ? 'scrim-payoff' : 'scrim-view') : ''}></div>

{#if mounted}
	<JourneyColdOpen
		visible={coldOpen && !loading}
		copy={content.coldOpen}
		onBegin={() => dismissColdOpen(false)}
		onSkip={() => dismissColdOpen(true)}
	/>
{/if}

{#if !loading && !coldOpen}
	<JourneyNav
		onHome={() => jumpTo(navJumps.hero)}
		onJump={jumpTo}
		jumps={navJumps}
		copy={content.nav}
	/>
	<JourneySceneIndex
		current={activeSceneNumber}
		visible={sceneIndexVisible}
		onSelect={jumpToScene}
	/>
	<JourneyLegal links={content.legal.links} />

	<Beat id="beat-hero" active={activeBeats['beat-hero']} label="Hero" class="hero-copy">
		<div class="flex items-end justify-between gap-4 sm:gap-8">
			<div class="hero-main min-w-0">
				<p
					class="mb-4 text-[12px] tracking-[0.2em] text-lens uppercase sm:text-[13px] sm:tracking-[0.22em]"
				>
					{content.hero.strapline}
				</p>
				<h1
					class="text-[clamp(2.75rem,6.5vw,5rem)] leading-[1.02] font-bold tracking-tight text-bone"
				>
					{#each content.hero.titleLines as line, i (line)}
						{#if i > 0}<br />{/if}{line}
					{/each}
				</h1>

				<div class="mt-9 flex flex-wrap items-center gap-5">
					<button
						type="button"
						onclick={beginJourney}
						class="inline-flex cursor-pointer items-center gap-2 rounded-full bg-lens px-7 py-3.5 text-[15px] font-semibold tracking-wide text-white shadow-[0_0_0_1px_rgba(0,155,204,0.35),0_0_32px_rgba(0,155,204,0.35),0_10px_28px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
					>
						{content.hero.cta}
					</button>
				</div>

				<p
					class="mt-6 max-w-[42ch] text-[15px] leading-relaxed font-light text-bone/75 [text-shadow:0_1px_18px_rgba(4,6,10,0.8)]"
				>
					{content.hero.subline}
				</p>
			</div>

			<div class="hero-specs">
				<ShowMeFlash
					label={content.hero.showMe.label}
					href={content.hero.showMe.href}
					open={heroShowMeOpen}
					stacked
				/>
			</div>
		</div>
	</Beat>

	{#each SCENES as scene (scene.id)}
		{@const sceneIndex = beatDefs.findIndex((b) => b.id === scene.id)}
		{@const lead = scene.textAfterSeconds ?? SCENE_TEXT_AFTER_SECONDS}
		<JourneyScene
			id={scene.id}
			active={reduced || sceneShowsText(scene.id, sceneIndex, lead)}
			label={scene.label}
			pain={scene.pain}
			whatIfRest={scene.whatIfRest}
			showMe={scene.showMe}
			class={sceneClassName(scene)}
			onAdvance={advance}
			onRetreat={retreat}
		/>
	{/each}

	<Beat
		id="beat-lens"
		active={activeBeats['beat-lens']}
		label="The view"
		class="lens-copy px-5 sm:px-8 {lensCopyOpen ? '' : 'lens-view'}"
	>
		<h2
			class={[
				'transition-all duration-700',
				lensCopyOpen
					? 'mb-2 text-[10px] tracking-[0.28em] text-gold uppercase sm:text-[11px]'
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
					class="text-[clamp(1.7rem,3.6vw,2.75rem)] leading-[1.08] font-bold tracking-tight text-bone"
				>
					{content.lens.title}
				</p>
				<p
					class="mx-auto mt-3 max-w-[50ch] text-[14px] leading-relaxed font-light text-bone/85 [text-shadow:0_1px_18px_rgba(4,6,10,0.8)] sm:text-[15px]"
				>
					{content.lens.body}
				</p>

				<div class="mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
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

				<h3 class="mt-6 mb-3 text-[11px] tracking-[0.24em] text-bone/70 uppercase">
					{content.lens.principlesLabel}
				</h3>
				<ol class="grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
					{#each PRINCIPLES as item, i (item.title)}
						<li
							class="rounded-2xl border border-gold/25 bg-ink/55 p-4 shadow-[0_12px_40px_rgba(4,6,10,0.35)] backdrop-blur-md"
						>
							<p class="font-mono text-[10px] tracking-[0.18em] text-gold tabular-nums">
								{String(i + 1).padStart(2, '0')}
							</p>
							<p class="mt-1.5 text-[14px] leading-snug font-bold tracking-tight text-bone">
								{item.title}
								{#if item.subtitle}
									<span class="mt-0.5 block text-[12px] font-medium text-gold/90">{item.subtitle}</span>
								{/if}
							</p>
							<p class="mt-1.5 text-[12px] leading-relaxed font-light text-bone-dim">
								{item.body}
							</p>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</Beat>
{/if}

<div id="scroll-space" aria-hidden="true"></div>
