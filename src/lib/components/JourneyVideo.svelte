<script lang="ts">
	let {
		src = '/journey.mp4',
		videoEl = $bindable(null),
		missing = $bindable(false)
	}: {
		src?: string;
		videoEl?: HTMLVideoElement | null;
		missing?: boolean;
	} = $props();

	function markMissing() {
		missing = true;
	}
</script>

<div id="video-stage" class="bg-ink">
	<video
		id="journey-video"
		bind:this={videoEl}
		muted
		playsinline
		preload="auto"
		onerror={markMissing}
	>
		<source {src} type="video/mp4" onerror={markMissing} />
	</video>
	{#if missing}
		<div class="absolute inset-0 flex items-center justify-center p-6 text-center">
			<div
				class="max-w-[520px] rounded-2xl border border-dashed border-bone/30 p-7 text-sm leading-relaxed font-light text-bone-dim"
			>
				<strong class="text-bone">Drop your journey footage here.</strong><br /><br />
				Save your AI-generated video as
				<code class="font-mono text-[13px] text-lens">journey.mp4</code> in
				<code class="font-mono text-[13px] text-lens">static/</code>. For buttery scroll-scrubbing,
				re-encode it with a keyframe on every frame:<br /><br />
				<code class="font-mono text-[13px] text-lens"
					>ffmpeg -i raw.mp4 -vf scale=1920:-2 -c:v libx264 -g 1 -crf 23 -an -movflags +faststart
					journey.mp4</code
				>
			</div>
		</div>
	{/if}
</div>
