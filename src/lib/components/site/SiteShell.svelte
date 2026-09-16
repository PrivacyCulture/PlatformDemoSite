<script lang="ts">
	import SiteFooter from './SiteFooter.svelte';
	import SiteHeader from './SiteHeader.svelte';

	let { children }: { children: import('svelte').Snippet } = $props();

	const poster = '/clips/Mountain/startmountain.jpeg';
	const loopSrc = '/clips/Mountain/endmountain.mp4';
</script>

<div class="site-shell relative min-h-dvh overflow-x-hidden bg-white text-ink">
	<div class="site-mountain pointer-events-none absolute inset-x-0 top-0" aria-hidden="true">
		<img src={poster} alt="" width="1920" height="1080" decoding="async" />
		<video
			class="site-mountain-video"
			src={loopSrc}
			{poster}
			muted
			loop
			autoplay
			playsinline
			preload="auto"
		></video>
	</div>
	<div class="site-grain pointer-events-none absolute inset-0" aria-hidden="true"></div>

	<a
		href="#main"
		class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-gold-ink"
	>
		Skip to content
	</a>

	<SiteHeader />

	<main id="main" class="relative z-10 px-page pb-10">
		{@render children()}
	</main>

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
		background-image: url('/textures/grain.svg');
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
