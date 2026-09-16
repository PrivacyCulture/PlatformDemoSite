<script lang="ts">
	import UiChrome from './UiChrome.svelte';

	const manual = [
		{ day: 'Day 1', label: 'Request lands in a shared inbox' },
		{ day: 'Day 4', label: 'Chase HR, IT, and Marketing by email' },
		{ day: 'Day 11', label: 'Partial exports, missing systems' },
		{ day: 'Day 21+', label: 'Still reconciling locations' }
	];

	const assisted = [
		{ day: 'Hour 1', label: 'Subject matched to processing map' },
		{ day: 'Hour 6', label: 'Owners notified with exact systems' },
		{ day: 'Hour 24', label: 'Exports attached to the request' },
		{ day: 'Under 48h', label: 'Response packed, audit trail complete' }
	];
</script>

<UiChrome title="DSAR fulfillment" badge="Comparison">
	<div class="grid gap-5 md:grid-cols-2">
		<div>
			<p class="text-[11px] tracking-[0.18em] text-bone/50 uppercase">Manual chase</p>
			<p class="mt-1 text-[18px] font-bold tracking-tight text-bone/80">21+ days</p>
			<ol class="mt-4 space-y-3">
				{#each manual as step, i (step.day)}
					<li class="flex gap-3">
						<span class="mt-0.5 font-mono text-[11px] text-bone/40">{String(i + 1).padStart(2, '0')}</span>
						<div>
							<p class="text-[12px] tracking-wide text-bone/45">{step.day}</p>
							<p class="text-[13px] leading-snug text-bone/70">{step.label}</p>
						</div>
					</li>
				{/each}
			</ol>
		</div>
		<div class="rounded-xl border border-lens/30 bg-lens/[0.07] p-4 sm:p-5">
			<p class="text-[11px] tracking-[0.18em] text-lens uppercase">Platform-assisted</p>
			<p class="mt-1 text-[18px] font-bold tracking-tight text-gold">Under 48 hours</p>
			<ol class="mt-4 space-y-3">
				{#each assisted as step, i (step.day)}
					<li class="flex gap-3">
						<span class="mt-0.5 font-mono text-[11px] text-gold">{String(i + 1).padStart(2, '0')}</span>
						<div>
							<p class="text-[12px] tracking-wide text-gold/80">{step.day}</p>
							<p class="text-[13px] leading-snug text-bone/85">{step.label}</p>
						</div>
					</li>
				{/each}
			</ol>
		</div>
	</div>
</UiChrome>
