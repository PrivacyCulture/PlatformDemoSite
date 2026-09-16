<script lang="ts">
	import { formatSeconds, progressToSeconds } from '$lib/journey/beats';

	let {
		progress = 0,
		duration = 0
	}: {
		progress?: number;
		duration?: number;
	} = $props();

	const currentSec = $derived(progressToSeconds(progress, duration));
</script>

<div
	id="progress"
	aria-hidden="true"
	class="fixed top-1/2 right-6 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex"
>
	<div class="h-[180px] w-0.5 rounded-sm bg-bone/20">
		<div class="fill w-full rounded-sm bg-lens" style="height: {progress * 100}%"></div>
	</div>
	{#if duration > 0}
		<div
			id="video-clock"
			class="min-w-[4.5rem] rounded-full border border-bone/15 bg-ink/70 px-3 py-1.5 text-center font-mono text-[12px] tracking-wide text-lens tabular-nums backdrop-blur-md"
		>
			{formatSeconds(currentSec)}s
		</div>
	{/if}
</div>

{#if duration > 0}
	<div
		id="video-clock-mobile"
		aria-hidden="true"
		class="fixed top-[22px] right-4 z-40 rounded-full border border-bone/15 bg-ink/70 px-3 py-1.5 font-mono text-[12px] tracking-wide text-lens tabular-nums backdrop-blur-md md:hidden"
	>
		{formatSeconds(currentSec)}s
	</div>
{/if}
