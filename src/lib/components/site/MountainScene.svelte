<script lang="ts">
	/**
	 * Washed-out mountain path behind a block of content, anchored to one edge of
	 * the browser rather than the page column. `left` uses the path that fades out
	 * to the right; `right` uses the one that fades out to the left.
	 */
	let {
		side = 'left',
		class: className = '',
		children
	}: {
		side?: 'left' | 'right';
		class?: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<div class={['mountain-scene relative w-full py-10 sm:py-14', `scene-${side}`, className]}>
	<div class="relative z-10">
		{@render children()}
	</div>
</div>

<style>
	.mountain-scene::before,
	.mountain-scene::after {
		content: '';
		position: absolute;
		top: 0;
		height: 85%;
		width: 64vw;
		z-index: 0;
		pointer-events: none;
	}

	.scene-left::before,
	.scene-left::after {
		left: calc(50% - 50vw);
	}

	.scene-right::before,
	.scene-right::after {
		right: calc(50% - 50vw);
	}

	.mountain-scene::before {
		background-size: 100% auto;
		background-repeat: no-repeat;
	}

	.scene-left::before {
		background-image: url('/Images/mountainPath.webp');
		background-position: left top;
		filter: saturate(0.55) brightness(1.22);
	}

	.scene-right::before {
		background-image: url('/Images/LeftMountainPath.webp');
		background-position: right top;
		filter: saturate(0.9) brightness(1.05);
	}

	/* Same wash as the hero in SiteShell; the horizontal fade runs toward the copy. */
	.scene-left::after {
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
				rgba(255, 255, 255, 0.5) 100%
			);
	}

	.scene-right::after {
		background:
			linear-gradient(
				180deg,
				rgba(255, 255, 255, 0.28) 0%,
				rgba(255, 255, 255, 0.62) 38%,
				rgba(255, 255, 255, 0.92) 72%,
				#ffffff 100%
			),
			linear-gradient(
				270deg,
				rgba(255, 255, 255, 0.22) 0%,
				transparent 28%,
				transparent 72%,
				rgba(255, 255, 255, 0.5) 100%
			);
	}

	@media (max-width: 640px) {
		.mountain-scene::after {
			background: rgba(255, 255, 255, 0.88);
		}
	}
</style>
