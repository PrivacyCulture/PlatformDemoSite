<script lang="ts">
	import { onMount } from 'svelte';
	import SiteFooter from './SiteFooter.svelte';
	import SiteHeader from './SiteHeader.svelte';
	import { asset } from '$lib/content/assets';
	import { site } from '$lib/site/content';

	const poster = asset(site.shell.poster);
	const loopSrc = asset(site.shell.loop);
	const grain = `url('${site.shell.grain}')`;

	let { children }: { children: import('svelte').Snippet } = $props();

	let loopMounted = $state(false);
	let loopPlaying = $state(false);

	// The still is the hero's LCP and must paint on its own. The loop is not in the server HTML:
	// it mounts once the page has loaded, a frame has painted and the main thread is idle, so its
	// download never competes with the first render, then fades in over the still once playing.
	// The painted frame matters: the third-party scripts can hold the first paint past `load`.
	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
			return;

		let cancelled = false;
		let frame = 0;
		let idle = 0;
		// Safari has no requestIdleCallback; a short timeout stands in for it.
		const hasIdle = 'requestIdleCallback' in window;
		const mount = () => {
			if (!cancelled) loopMounted = true;
		};
		// The second frame callback runs only after the first frame has been painted.
		const afterPaint = () => {
			frame = requestAnimationFrame(() => {
				frame = requestAnimationFrame(() => {
					idle = hasIdle
						? requestIdleCallback(mount, { timeout: 3000 })
						: window.setTimeout(mount, 500);
				});
			});
		};
		if (document.readyState === 'complete') afterPaint();
		else window.addEventListener('load', afterPaint, { once: true });

		return () => {
			cancelled = true;
			window.removeEventListener('load', afterPaint);
			cancelAnimationFrame(frame);
			if (hasIdle) cancelIdleCallback(idle);
			else window.clearTimeout(idle);
		};
	});
</script>

<div class="site-shell relative min-h-dvh overflow-x-clip bg-white text-ink" style:--site-grain={grain}>
	<div class="site-mountain pointer-events-none absolute inset-x-0 top-0" aria-hidden="true">
		<img src={poster} alt="" width="1280" height="720" fetchpriority="high" />
		{#if loopMounted}
			<video
				class={['site-mountain-video', loopPlaying && 'playing']}
				src={loopSrc}
				muted
				loop
				autoplay
				playsinline
				preload="auto"
				onplaying={() => (loopPlaying = true)}
			></video>
		{/if}
	</div>
	<div class="site-grain pointer-events-none absolute inset-0" aria-hidden="true"></div>

	<a
		href="#main"
		class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-gold-ink"
	>
		{site.shell.skipToContent}
	</a>

	<div class="relative z-20 px-page">
		<div class="mx-auto w-full max-w-page">
			<SiteHeader />
			<main id="main" class="pb-10">
				{@render children()}
			</main>
		</div>
	</div>

	<SiteFooter />
</div>

<style>
	.site-mountain {
		height: min(78vh, 46rem);
		overflow: hidden;
	}

	.site-mountain img,
	.site-mountain-video {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 42%;
		filter: saturate(0.55) brightness(1.22);
	}

	.site-mountain-video {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 0.8s ease;
	}

	.site-mountain-video.playing {
		opacity: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.site-mountain-video {
			display: none;
		}
	}

	.site-mountain::after {
		content: '';
		position: absolute;
		inset: 0;
		background:
			linear-gradient(
				180deg,
				rgba(255, 255, 255, 0.28) 0%,
				rgba(255, 255, 255, 0.62) 38%,
				rgba(255, 255, 255, 0.92) 72%,
				#ffffff 100%
			),
			linear-gradient(
				90deg,
				rgba(255, 255, 255, 0.22) 0%,
				transparent 28%,
				transparent 72%,
				rgba(255, 255, 255, 0.18) 100%
			);
	}

	.site-grain {
		opacity: 0.08;
		background-image: var(--site-grain);
		background-size: 180px 180px;
		mix-blend-mode: multiply;
	}

	.site-shell :global(h1),
	.site-shell :global(h2),
	.site-shell :global(h3) {
		color: var(--color-heading);
	}

	.site-shell :global(.on-ink h1),
	.site-shell :global(.on-ink h2),
	.site-shell :global(.on-ink h3) {
		color: var(--color-bone);
	}
</style>
