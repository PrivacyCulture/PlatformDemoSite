<script lang="ts">
	import UiChrome from './UiChrome.svelte';

	const risks = [
		{ risk: 'Profiling without a clear opt-out', mitigation: 'Preference centre toggle shipped', owner: 'Growth Lead', due: '30 Jun', status: 'Done', tone: 'live' },
		{ risk: 'US sub-processor for event data', mitigation: 'IDTA executed, TIA in review', owner: 'Legal', due: '15 Jul', status: 'In progress', tone: 'stale' },
		{ risk: 'No retention set for raw events', mitigation: 'Apply 13-month purge', owner: 'Data Engineering', due: '1 Jul', status: 'Overdue', tone: 'fail' }
	] as const;
</script>

<UiChrome title="DPIA · customer analytics platform" badge="Linked">
	<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
		<p class="text-[13px] text-bone/85">
			<span class="text-bone/45">Attached to</span> Marketing analytics
		</p>
		<p class="text-[12px] text-bone/45">Approved with conditions · 12 May 2026</p>
	</div>
	<ol class="mt-4 divide-y divide-bone/10 border-y border-bone/10">
		{#each risks as item, i (item.risk)}
			<li class="grid gap-x-4 gap-y-1 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
				<span class="font-mono text-[11px] text-gold">{String(i + 1).padStart(2, '0')}</span>
				<div class="min-w-0">
					<p class="text-[14px] text-bone/85">{item.risk}</p>
					<p class="text-[12px] text-bone/50">
						{item.mitigation} · {item.owner} · due {item.due}
					</p>
				</div>
				<span
					class="w-fit rounded-full px-2.5 py-1 text-[11px] tracking-[0.12em] uppercase
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
	</ol>
	<p class="mt-4 rounded-lg border border-gold/30 bg-gold/[0.08] px-3 py-2 text-[12px] text-gold/90">
		Re-assessment flagged: a new data source was added to this activity on 4 Sep.
	</p>
</UiChrome>
