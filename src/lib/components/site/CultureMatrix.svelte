<script lang="ts">
	import UiChrome from './UiChrome.svelte';
	import { panels } from '$lib/content';

	const panel = panels.cultureMatrix;
	const cells = panel.cells;
</script>

<UiChrome title={panel.title} badge={panel.badge}>
	<p class="mb-4 max-w-[46ch] text-[13px] font-light text-bone/65">
		{panel.intro}
	</p>
	<div class="grid gap-3 sm:grid-cols-2">
		{#each cells as cell (cell.note)}
			<div
				class="rounded-xl border p-4
				{cell.tone === 'alert'
					? 'border-gold/45 bg-gold/10'
					: cell.tone === 'warn'
						? 'border-red-400/30 bg-red-400/10'
						: cell.tone === 'ok'
							? 'border-lens/30 bg-lens/10'
							: 'border-bone/15 bg-white/[0.03]'}"
			>
				<p class="text-[11px] tracking-[0.14em] text-bone/50 uppercase">{cell.y}</p>
				<p class="mt-1 text-[13px] text-bone/70">{cell.x}</p>
				<p class="mt-3 text-[16px] font-bold tracking-tight">{cell.note}</p>
			</div>
		{/each}
	</div>
</UiChrome>
