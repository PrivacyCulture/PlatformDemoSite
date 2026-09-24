<script lang="ts">
	import { site } from '$lib/site/content';
	import { asset } from '$lib/content/assets';

	let {
		src = site.video.src,
		label = site.video.label,
		// The still shown before playback. Blank = the browser's own first frame.
		poster = site.video.poster,
		compact = false,
		open = $bindable(false)
	}: {
		src?: string;
		label?: string;
		poster?: string;
		compact?: boolean;
		open?: boolean;
	} = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let started = $state(false);
	const posterUrl = $derived(poster?.trim() ? asset(poster.trim()) : undefined);

	function startPlayback() {
		started = true;
		open = true;
		void videoEl?.play();
	}

	$effect(() => {
		if (!open || !videoEl) return;
		started = true;
		void videoEl.play();
	});
</script>

<div class="w-full" id={compact ? 'overview' : undefined}>
	{#if !compact}
		<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">{site.video.eyebrow}</p>
	{/if}

	<div
		class={[
			'group relative overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(11,18,32,0.1)]',
			compact ? '' : 'mt-6'
		]}
	>
		<video
			bind:this={videoEl}
			class="aspect-video w-full bg-black object-cover"
			{src}
			poster={posterUrl}
			controls={started}
			playsinline
			preload="metadata"
			aria-label={label}
			onplay={() => {
				started = true;
				open = true;
			}}
			onended={() => {
				started = false;
				open = false;
				if (videoEl) videoEl.currentTime = 0;
			}}
		>
			<track kind="captions" src={site.video.captions} srclang={site.video.captionsLang} label={site.video.captionsLabel} />
		</video>

		{#if !started}
			<button
				type="button"
				onclick={startPlayback}
				class="absolute inset-0 cursor-pointer bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold"
				aria-label={label}
			></button>
		{/if}
	</div>

	{#if started}
		<p class="mt-3 text-[14px] font-semibold tracking-wide text-lens">{label}</p>
	{:else}
		<button
			type="button"
			onclick={startPlayback}
			class="mt-3 inline-flex cursor-pointer items-center bg-transparent p-0 text-[14px] font-semibold tracking-wide text-lens underline-offset-4 transition-colors hover:text-gold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
		>
			{label}
		</button>
	{/if}
</div>
