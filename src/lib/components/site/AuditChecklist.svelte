<script lang="ts">
	import UiChrome from './UiChrome.svelte';
	import { panels } from '$lib/content';

	const panel = panels.auditChecklist;
	const rows = panel.rows;
</script>

<UiChrome title={panel.title} badge={panel.badge}>
	<p class="mb-4 text-[13px] font-light text-bone/65">
		{panel.intro}
	</p>
	<ul class="divide-y divide-bone/10 border-y border-bone/10">
		{#each rows as row (row.label)}
			<li class="flex items-center justify-between gap-4 py-3">
				<span class="text-[14px] text-bone/85">{row.label}</span>
				<span
					class="rounded-full px-2.5 py-1 text-[11px] tracking-[0.12em] uppercase
					{row.tone === 'live'
						? 'border border-lens/35 bg-lens/10 text-lens'
						: row.tone === 'stale'
							? 'border border-gold/40 bg-gold/10 text-gold'
							: 'border border-red-400/35 bg-red-400/10 text-red-300'}"
				>
					{row.status}
				</span>
			</li>
		{/each}
	</ul>
</UiChrome>
