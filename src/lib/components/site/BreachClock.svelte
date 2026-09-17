<script lang="ts">
	import UiChrome from './UiChrome.svelte';

	const roles = [
		{ role: 'Triage lead', who: 'Named, fallback set' },
		{ role: 'DPO', who: 'Named, fallback set' },
		{ role: 'Comms', who: 'Named' },
		{ role: 'Legal', who: 'External counsel on call' }
	];

	const steps = [
		{ at: 'Fri 17:04', elapsed: 'T+0h', who: 'Reporter', label: 'Laptop reported lost. Incident opened, clock started.' },
		{ at: 'Fri 17:20', elapsed: 'T+16m', who: 'Triage lead', label: 'Lead assigned from the roster, first call held.' },
		{ at: 'Fri 18:05', elapsed: 'T+1h', who: 'IT', label: 'Device linked to systems: two processing activities and one processor in scope.' },
		{ at: 'Fri 21:30', elapsed: 'T+4h', who: 'DPO', label: 'Risk assessed. Disk encrypted, remote wipe confirmed at 19:40.' },
		{ at: 'Sat 10:00', elapsed: 'T+17h', who: 'DPO', label: 'Decision recorded with rationale: no notification required.' },
		{ at: 'Mon 09:00', elapsed: 'T+64h', who: 'Privacy', label: 'Closed. Evidence pack exported to the incident register.' }
	];

	// Hours elapsed at closure against the 72-hour notification window.
	const elapsedHours = 64;
	const windowHours = 72;
</script>

<UiChrome title="Incident 0231 · lost device" badge="72-hour clock">
	<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
		<p class="text-[13px] text-bone/85">
			<span class="text-bone/45">Closed at</span>
			<span class="font-bold text-gold tabular-nums">T+{elapsedHours}h</span>
			<span class="text-bone/45">of {windowHours}h</span>
		</p>
		<p class="text-[12px] text-bone/45">Every entry timestamped against detection</p>
	</div>
	<div
		class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bone/10"
		role="img"
		aria-label="{elapsedHours} of {windowHours} hours used"
	>
		<div class="h-full rounded-full bg-gold" style:width="{(elapsedHours / windowHours) * 100}%"></div>
	</div>

	<div class="mt-5 grid gap-5 md:grid-cols-[1fr_1.7fr]">
		<div>
			<p class="text-[11px] tracking-[0.18em] text-bone/50 uppercase">Roles, set in advance</p>
			<ul class="mt-3 space-y-2.5">
				{#each roles as item (item.role)}
					<li>
						<p class="text-[13px] text-bone/85">{item.role}</p>
						<p class="text-[12px] text-bone/45">{item.who}</p>
					</li>
				{/each}
			</ul>
		</div>
		<div>
			<p class="text-[11px] tracking-[0.18em] text-lens uppercase">Evidence log</p>
			<ol class="mt-3 space-y-3">
				{#each steps as step (step.at)}
					<li class="flex gap-3">
						<span class="mt-0.5 w-12 shrink-0 font-mono text-[11px] text-gold tabular-nums">{step.elapsed}</span>
						<div class="min-w-0">
							<p class="text-[12px] tracking-wide text-bone/45">{step.at} · {step.who}</p>
							<p class="text-[13px] leading-snug text-bone/80">{step.label}</p>
						</div>
					</li>
				{/each}
			</ol>
		</div>
	</div>
</UiChrome>
