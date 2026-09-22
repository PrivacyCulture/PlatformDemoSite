<script lang="ts">
	import UiChrome from './UiChrome.svelte';
	import { panels } from '$lib/content';

	const panel = panels.breachClock;
	const roles = panel.roles;
	const steps = panel.steps;

	// Hours elapsed at closure against the 72-hour notification window.
	const elapsedHours = panel.elapsedHours;
	const windowHours = panel.windowHours;
</script>

<UiChrome title={panel.title} badge={panel.badge}>
	<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
		<p class="text-[13px] text-bone/85">
			<span class="text-bone/45">{panel.closedAt}</span>
			<span class="font-bold text-gold tabular-nums">T+{elapsedHours}h</span>
			<span class="text-bone/45">{panel.of} {windowHours}h</span>
		</p>
		<p class="text-[12px] text-bone/45">{panel.note}</p>
	</div>
	<div
		class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bone/10"
		role="img"
		aria-label="{elapsedHours} {panel.of} {windowHours} {panel.hoursUsed}"
	>
		<div class="h-full rounded-full bg-gold" style:width="{(elapsedHours / windowHours) * 100}%"></div>
	</div>

	<div class="mt-5 grid gap-5 md:grid-cols-[1fr_1.7fr]">
		<div>
			<p class="text-[11px] tracking-[0.18em] text-bone/50 uppercase">{panel.rolesLabel}</p>
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
			<p class="text-[11px] tracking-[0.18em] text-lens uppercase">{panel.logLabel}</p>
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
