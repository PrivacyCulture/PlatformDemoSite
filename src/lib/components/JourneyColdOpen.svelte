<script lang="ts">
	import type { JourneyContent } from '$lib/journey/content';

	let {
		visible,
		copy,
		onBegin,
		onSkip
	}: {
		visible: boolean;
		copy: JourneyContent['coldOpen'];
		onBegin: () => void;
		onSkip: () => void;
	} = $props();
</script>

{#if visible}
	<div
		id="cold-open"
		class="fixed inset-0 z-[80] flex items-center justify-center bg-ink px-6"
		role="dialog"
		aria-modal="true"
		aria-labelledby="cold-open-title"
	>
		<div class="max-w-[38rem] text-center">
			<p
				id="cold-open-title"
				class="text-[clamp(1.65rem,4vw,2.6rem)] leading-[1.15] font-bold tracking-tight text-bone"
			>
				{copy.title}
			</p>
			{#each copy.paragraphs as paragraph, i (paragraph)}
				<p
					class={[
						'mx-auto max-w-[42ch] text-[16px] leading-relaxed font-light text-bone-dim',
						i === 0 ? 'mt-6' : 'mt-5',
						i === copy.paragraphs.length - 1 && 'max-w-[44ch]'
					]}
				>
					{paragraph}
				</p>
			{/each}
			<p class="mt-8 text-[clamp(1.35rem,3vw,1.85rem)] font-bold tracking-tight text-lens">
				{copy.tagline}
			</p>
			<div class="mt-10 flex flex-wrap items-center justify-center gap-4">
				<button
					type="button"
					onclick={onBegin}
					class="cursor-pointer rounded-full bg-lens px-7 py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					{copy.begin}
				</button>
				<button
					type="button"
					onclick={onSkip}
					class="cursor-pointer rounded-full bg-bone/15 px-6 py-3.5 text-sm font-medium tracking-wide text-bone shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-colors hover:bg-bone/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					{copy.skip}
				</button>
			</div>
		</div>
	</div>
{/if}
