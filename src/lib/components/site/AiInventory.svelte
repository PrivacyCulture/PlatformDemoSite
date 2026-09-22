<script lang="ts">
	import UiChrome from './UiChrome.svelte';
	import { panels } from '$lib/content';

	const panel = panels.aiInventory;
	const tools = panel.tools;
</script>

<UiChrome title={panel.title} badge={panel.badge}>
	<div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
		<p class="text-[13px] font-light text-bone/65">{panel.intro}</p>
		<p class="text-[13px] text-bone/85">
			<span class="font-bold text-gold tabular-nums">{panel.count}</span>
			<span class="text-bone/50">{panel.countLabel}</span>
			<span class="text-red-300">{panel.unrecordedLabel}</span>
		</p>
	</div>
	<ul class="divide-y divide-bone/10 border-y border-bone/10">
		{#each tools as item (item.tool)}
			<li class="flex items-center justify-between gap-4 py-3">
				<div class="min-w-0">
					<p class="truncate text-[14px] text-bone/85">{item.tool}</p>
					<p class="text-[12px] text-bone/45">
						{item.team} · {item.data}
						{#if item.note}<span class="text-gold/80"> · {item.note}</span>{/if}
					</p>
				</div>
				<span
					class="shrink-0 rounded-full px-2.5 py-1 text-[11px] tracking-[0.12em] uppercase
					{item.tone === 'live'
						? 'border border-lens/35 bg-lens/10 text-lens'
						: item.tone === 'stale'
							? 'border border-gold/40 bg-gold/10 text-gold'
							: 'border border-red-400/35 bg-red-400/10 text-red-300'}"
				>
					{item.status}
				</span>
			</li>
		{/each}
	</ul>
</UiChrome>
