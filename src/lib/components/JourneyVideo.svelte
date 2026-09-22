<script lang="ts">
	import { journey } from '$lib/content';

	const MISSING = journey.ui.footageMissing;

	const CROSSFADE_MS = 320;

	let {
		src = '',
		nextSrc = '',
		videoEl = $bindable(null),
		missing = $bindable(false),
		ready = $bindable(false),
		loadProgress = $bindable(0),
		onReady
	}: {
		src?: string;
		/** Clip expected after `src`; warmed in the idle layer so the swap is instant. */
		nextSrc?: string;
		videoEl?: HTMLVideoElement | null;
		missing?: boolean;
		ready?: boolean;
		loadProgress?: number;
		onReady?: () => void;
	} = $props();

	let layerA = $state<HTMLVideoElement | null>(null);
	let layerB = $state<HTMLVideoElement | null>(null);
	/** 0–1 opacity for each layer (drives the crossfade). */
	let opacityA = $state(1);
	let opacityB = $state(0);
	/** Which layer sits on top during / after a fade. */
	let topIsA = $state(true);
	/**
	 * True from the moment a swap starts until the outgoing layer has fully faded out.
	 * Prefetch must wait: reassigning `src` on a layer that is still visible blanks it and
	 * then paints the next clip's first frame under the crossfade.
	 */
	let swapping = $state(false);
	/** Non-reactive mirror so the load effect does not re-run on promote. */
	let frontIsARef = true;
	let shownSrc = '';
	let swapGen = 0;
	let fadeTimer = 0;
	/** URL last assigned to each layer, so a prefetched clip is not reloaded. */
	const assigned = new WeakMap<HTMLVideoElement, string>();

	function reducedMotion() {
		return (
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	function assignSrc(video: HTMLVideoElement, url: string) {
		if (assigned.get(video) === url) return;
		assigned.set(video, url);
		video.src = url;
		try {
			video.load();
		} catch {
			/* ignore */
		}
	}

	function bufferedRatio(video: HTMLVideoElement) {
		if (!video.duration || !Number.isFinite(video.duration)) return 0;
		if (!video.buffered.length) return 0;
		let end = 0;
		for (let i = 0; i < video.buffered.length; i++) {
			end = Math.max(end, video.buffered.end(i));
		}
		return Math.min(1, end / video.duration);
	}

	function waitEvent(video: HTMLVideoElement, event: string, timeoutMs: number) {
		return new Promise<void>((resolve) => {
			let settled = false;
			const done = () => {
				if (settled) return;
				settled = true;
				video.removeEventListener(event, done);
				window.clearTimeout(timer);
				resolve();
			};
			video.addEventListener(event, done);
			const timer = window.setTimeout(done, timeoutMs);
		});
	}

	async function loadInto(
		video: HTMLVideoElement,
		url: string,
		gen: number,
		trackProgress: boolean
	): Promise<boolean> {
		missing = false;
		video.loop = false;
		video.playbackRate = 1;
		video.pause();
		assignSrc(video, url);

		const enough = () =>
			Boolean(video.duration) && (bufferedRatio(video) >= 0.12 || video.readyState >= 2);

		await new Promise<void>((resolve) => {
			let settled = false;
			const finish = () => {
				if (settled || gen !== swapGen) return;
				settled = true;
				cleanup();
				resolve();
			};
			const onUpdate = () => {
				if (gen !== swapGen) return;
				if (trackProgress) {
					const buffered = bufferedRatio(video);
					const stateBoost = Math.min(1, video.readyState / 4);
					loadProgress = Math.max(loadProgress, buffered * 0.85 + stateBoost * 0.15);
				}
				if (enough()) finish();
			};
			const onThrough = () => {
				if (trackProgress) loadProgress = Math.max(loadProgress, 0.95);
				finish();
			};
			const cleanup = () => {
				video.removeEventListener('loadedmetadata', onUpdate);
				video.removeEventListener('progress', onUpdate);
				video.removeEventListener('canplay', onUpdate);
				video.removeEventListener('canplaythrough', onThrough);
				window.clearInterval(poll);
				window.clearTimeout(timeout);
			};

			video.addEventListener('loadedmetadata', onUpdate);
			video.addEventListener('progress', onUpdate);
			video.addEventListener('canplay', onUpdate);
			video.addEventListener('canplaythrough', onThrough);
			const poll = window.setInterval(onUpdate, 100);
			const timeout = window.setTimeout(finish, trackProgress ? 12000 : 6000);
			onUpdate();
		});

		if (gen !== swapGen) return false;

		try {
			video.pause();
			if (Math.abs(video.currentTime) > 0.02) {
				video.currentTime = 0;
				await waitEvent(video, 'seeked', 250);
			} else if (video.readyState < 2) {
				await waitEvent(video, 'loadeddata', 250);
			}
			await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
		} catch {
			/* ignore */
		}

		return gen === swapGen;
	}

	function promote(incoming: HTMLVideoElement, url: string, first: boolean) {
		window.clearTimeout(fadeTimer);
		const outgoing = frontIsARef ? layerA : layerB;
		const incomingIsA = incoming === layerA;

		shownSrc = url;
		videoEl = incoming;
		ready = true;
		loadProgress = 1;
		frontIsARef = incomingIsA;
		topIsA = incomingIsA;
		onReady?.();

		if (first || reducedMotion() || !outgoing || outgoing === incoming) {
			opacityA = incomingIsA ? 1 : 0;
			opacityB = incomingIsA ? 0 : 1;
			if (outgoing && outgoing !== incoming) {
				try {
					outgoing.pause();
				} catch {
					/* ignore */
				}
			}
			swapping = false;
			return;
		}

		if (incomingIsA) {
			opacityA = 0;
			opacityB = 1;
		} else {
			opacityB = 0;
			opacityA = 1;
		}

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (incomingIsA) {
					opacityA = 1;
					opacityB = 0;
				} else {
					opacityB = 1;
					opacityA = 0;
				}
			});
		});

		fadeTimer = window.setTimeout(() => {
			if (outgoing && outgoing !== incoming) {
				try {
					outgoing.pause();
				} catch {
					/* ignore */
				}
			}
			// Outgoing layer is now at opacity 0 — safe to reuse it for the next prefetch.
			swapping = false;
		}, CROSSFADE_MS + 40);
	}

	// Swap: load `src` into the idle layer, then crossfade it to the front.
	$effect(() => {
		const url = src;
		const a = layerA;
		const b = layerB;
		if (!url || !a || !b) return;
		if (url === shownSrc && videoEl) return;

		const gen = ++swapGen;
		const first = !shownSrc;
		const incoming = first ? a : frontIsARef ? b : a;
		const trackProgress = first;

		if (first) ready = false;
		swapping = true;

		void (async () => {
			const ok = await loadInto(incoming, url, gen, trackProgress);
			if (!ok || gen !== swapGen) return;
			promote(incoming, url, first);
		})();
	});

	// Prefetch: once a swap settles, start downloading the next clip into the idle layer
	// (preload="auto" pulls the whole file) so the following scene change needs no network.
	$effect(() => {
		const url = nextSrc;
		const a = layerA;
		const b = layerB;
		const idle = topIsA ? b : a;
		if (swapping || !url || !a || !b || !videoEl || !idle || idle === videoEl) return;
		if (url === shownSrc || assigned.get(idle) === url) return;
		if (Number(idle.style.opacity || 0) > 0) return;
		try {
			idle.pause();
		} catch {
			/* ignore */
		}
		assignSrc(idle, url);
	});

	/** Only flag "missing" for the clip we are actually trying to show, not a prefetch. */
	function onLayerError(layer: HTMLVideoElement | null) {
		if (layer && assigned.get(layer) === src) missing = true;
	}
</script>

<div id="video-stage" class="bg-ink">
	<video
		id="journey-video-a"
		class="journey-video-layer"
		class:is-top={topIsA}
		style:opacity={opacityA}
		style:--fade-ms="{CROSSFADE_MS}ms"
		bind:this={layerA}
		muted
		playsinline
		preload="auto"
		autoplay={false}
		onerror={() => onLayerError(layerA)}
	></video>
	<video
		id="journey-video-b"
		class="journey-video-layer"
		class:is-top={!topIsA}
		style:opacity={opacityB}
		style:--fade-ms="{CROSSFADE_MS}ms"
		bind:this={layerB}
		muted
		playsinline
		preload="auto"
		autoplay={false}
		onerror={() => onLayerError(layerB)}
	></video>
	{#if missing}
		<div class="absolute inset-0 flex items-center justify-center p-6 text-center">
			<div
				class="max-w-[520px] rounded-2xl border border-dashed border-bone/30 p-7 text-sm leading-relaxed font-light text-bone-dim"
			>
				<strong class="text-bone">{MISSING.title}</strong><br /><br />
				{MISSING.before}
				<code class="font-mono text-[13px] text-lens">{MISSING.clipsPath}</code>
				{MISSING.between}
				<code class="font-mono text-[13px] text-lens">{MISSING.listPath}</code>{MISSING.after}
			</div>
		</div>
	{/if}
</div>

<style>
	.journey-video-layer {
		position: absolute;
		inset: 0;
		z-index: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
		transition: opacity var(--fade-ms, 320ms) ease-in-out;
	}

	.journey-video-layer.is-top {
		z-index: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.journey-video-layer {
			transition: none;
		}
	}
</style>
