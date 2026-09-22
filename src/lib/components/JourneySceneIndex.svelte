<script lang="ts">
	import { journey } from '$lib/content';

	const UI = journey.ui;

	let {
		current = 0,
		visible = false,
		onSelect
	}: {
		/** 1–6 when a journey scene is active; 0 otherwise. */
		current?: number;
		visible?: boolean;
		onSelect: (sceneNumber: number) => void;
	} = $props();
</script>

{#if visible}
	<nav
		id="scene-index"
		aria-label={UI.sceneIndexAriaLabel}
		class="fixed top-1/2 right-2 z-40 hidden -translate-y-1/2 flex-col items-end md:flex"
	>
		{#each [1, 2, 3, 4, 5, 6] as n (n)}
			<button
				type="button"
				onclick={() => onSelect(n)}
				aria-current={current === n ? 'step' : undefined}
				aria-label="{UI.scenePrefix} {String(n).padStart(2, '0')}"
				class={[
					'flex h-11 min-w-11 cursor-pointer items-center justify-end px-3 font-mono text-[13px] tracking-[0.12em] tabular-nums transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens',
					current === n ? 'text-bone' : 'text-bone/30 hover:text-bone/60'
				]}
			>
				{String(n).padStart(2, '0')}
			</button>
		{/each}
	</nav>
{/if}
