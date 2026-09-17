<script lang="ts">
	import { site } from '$lib/site/content';

	let {
		src = site.video.src,
		label = site.video.label,
		compact = false,
		open = $bindable(false)
	}: {
		src?: string;
		label?: string;
		compact?: boolean;
		open?: boolean;
	} = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let started = $state(false);

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
		<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Explainer</p>
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
			<track kind="captions" src="/clips/overview-captions.vtt" srclang="en" label="English" />
		</video>

		{#if !started}
			<button
				type="button"
				onclick={startPlayback}
				class="absolute inset-0 flex cursor-pointer items-center justify-center bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold"
				aria-label={label}
			>
				<span
					class="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-gold-ink shadow-[0_6px_20px_rgba(212,175,106,0.35)] transition-transform duration-200 group-hover:scale-[1.05]"
					aria-hidden="true"
				>
					<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
						<path d="M8 5.14v13.72L19.06 12 8 5.14z" />
					</svg>
				</span>
			</button>
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
