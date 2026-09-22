<script lang="ts">
	import UiChrome from './UiChrome.svelte';
	import { panels } from '$lib/content';

	const panel = panels.trustSnapshot;
	const rows = panel.rows;
</script>

<UiChrome title={panel.title} badge={panel.badge}>
	<dl class="divide-y divide-bone/10 border-y border-bone/10">
		{#each rows as row (row.label)}
			<div class="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6">
				<dt class="text-[12px] tracking-[0.16em] text-gold uppercase">{row.label}</dt>
				<dd class="text-[14px] leading-relaxed text-bone/85">{row.value}</dd>
			</div>
		{/each}
	</dl>
</UiChrome>
