<script lang="ts">
	import UiChrome from './UiChrome.svelte';

	const rows = [
		{ activity: 'Recruitment and onboarding', owner: 'Head of People', confirmed: '2 Sep 2026', status: 'Current', tone: 'live' },
		{ activity: 'Customer support tickets', owner: 'Support Lead', confirmed: '14 Jun 2026', status: 'Due', tone: 'stale' },
		{ activity: 'Marketing analytics', owner: 'Growth Lead', confirmed: '11 Nov 2025', status: 'Overdue', tone: 'fail', note: 'New vendor added since' },
		{ activity: 'Payroll', owner: 'Finance Director', confirmed: '28 Aug 2026', status: 'Current', tone: 'live' },
		{ activity: 'CCTV, head office', owner: 'Facilities Manager', confirmed: '3 Mar 2026', status: 'Due', tone: 'stale' }
	] as const;
</script>

<UiChrome title="Record of processing · freshness" badge="Live register">
	<div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
		<p class="text-[13px] font-light text-bone/65">Owners confirm their own activities on a schedule.</p>
		<p class="text-[13px] text-bone/85">
			<span class="font-bold text-gold tabular-nums">34</span>
			<span class="text-bone/50">of 41 current</span>
		</p>
	</div>
	<ul class="divide-y divide-bone/10 border-y border-bone/10">
		{#each rows as row (row.activity)}
			<li class="flex items-center justify-between gap-4 py-3">
				<div class="min-w-0">
					<p class="truncate text-[14px] text-bone/85">{row.activity}</p>
					<p class="text-[12px] text-bone/45">
						{row.owner} · confirmed {row.confirmed}
						{#if 'note' in row}<span class="text-gold/80"> · {row.note}</span>{/if}
					</p>
				</div>
				<span
					class="shrink-0 rounded-full px-2.5 py-1 text-[11px] tracking-[0.12em] uppercase
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
