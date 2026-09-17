<script lang="ts">
	import UiChrome from './UiChrome.svelte';

	const tools = [
		{ tool: 'Meeting transcription assistant', team: 'Sales', data: 'Call audio, customer names', status: 'Recorded', tone: 'live' },
		{ tool: 'Chat assistant, browser plug-in', team: 'Support', data: 'Ticket text including customer details', status: 'Unrecorded', tone: 'fail' },
		{ tool: 'CV screening model', team: 'People', data: 'Applicant CVs', status: 'Under review', tone: 'stale', note: 'Automated decision flag' },
		{ tool: 'Code copilot', team: 'Engineering', data: 'Source and config, no personal data', status: 'Recorded', tone: 'live' },
		{ tool: 'Campaign copy generator', team: 'Growth', data: 'Segment names, campaign text', status: 'Recorded', tone: 'live' }
	] as const;
</script>

<UiChrome title="AI tools in use" badge="Register">
	<div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
		<p class="text-[13px] font-light text-bone/65">Every tool tied to the activity and data it touches.</p>
		<p class="text-[13px] text-bone/85">
			<span class="font-bold text-gold tabular-nums">5</span>
			<span class="text-bone/50">found ·</span>
			<span class="text-red-300">1 unrecorded</span>
		</p>
	</div>
	<ul class="divide-y divide-bone/10 border-y border-bone/10">
		{#each tools as item (item.tool)}
			<li class="flex items-center justify-between gap-4 py-3">
				<div class="min-w-0">
					<p class="truncate text-[14px] text-bone/85">{item.tool}</p>
					<p class="text-[12px] text-bone/45">
						{item.team} · {item.data}
						{#if 'note' in item}<span class="text-gold/80"> · {item.note}</span>{/if}
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
