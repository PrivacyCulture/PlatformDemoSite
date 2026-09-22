<script lang="ts">
	import UiChrome from './UiChrome.svelte';
	import { panels } from '$lib/content';

	// Headline measures only: value, the target the board agreed, and the move since last quarter.
	const panel = panels.boardDashboard;
	const measures = panel.measures;

	function fill(m: (typeof measures)[number]) {
		// Share of the way to target, so every bar reads the same direction.
		if (m.higherIsBetter) return Math.min(100, (m.value / m.target) * 100);
		return Math.max(0, 100 - (m.value / Math.max(m.previous, 1)) * 100);
	}

	function trend(m: (typeof measures)[number]) {
		const delta = m.value - m.previous;
		const improving = m.higherIsBetter ? delta > 0 : delta < 0;
		const magnitude = Math.abs(delta);
		return {
			text: `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${magnitude}${m.unit || ''} ${panel.vsLabel}`,
			word: improving ? panel.improving : delta === 0 ? panel.flat : panel.slipping,
			improving
		};
	}

	function gap(m: (typeof measures)[number]) {
		const g = Math.abs(m.target - m.value);
		return g === 0 ? panel.onTarget : `${g}${m.unit || ''} ${panel.toTarget}`;
	}
</script>

<UiChrome title={panel.title} badge={panel.badge}>
	<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
		<p class="text-[13px] font-light text-bone/65">{panel.intro}</p>
		<p class="text-[12px] text-bone/45">{panel.note}</p>
	</div>

	<dl class="mt-4 grid gap-3 sm:grid-cols-3">
		{#each measures as m (m.label)}
			{@const t = trend(m)}
			<div class="rounded-xl border border-bone/10 bg-white/[0.03] p-4">
				<dt class="text-[11px] tracking-[0.14em] text-bone/50 uppercase">{m.label}</dt>
				<dd class="mt-2 flex items-baseline gap-1.5">
					<span class="text-[2rem] leading-none font-bold tracking-tight text-bone tabular-nums">
						{m.value}{m.unit}
					</span>
					<span class="text-[12px] text-bone/45">{panel.targetLabel} {m.target}{m.unit}</span>
				</dd>
				<dd class="mt-3">
					<div
						class="h-1.5 w-full overflow-hidden rounded-full bg-bone/10"
						role="img"
						aria-label="{gap(m)}"
					>
						<div class="h-full rounded-full bg-gold" style:width="{fill(m)}%"></div>
					</div>
					<p class="mt-1.5 text-[12px] text-bone/55">{gap(m)}</p>
				</dd>
				<dd class="mt-3 flex items-center gap-2 text-[12px]">
					<span class={t.improving ? 'text-lens' : 'text-gold'} aria-hidden="true">
						{t.improving ? '↑' : '↓'}
					</span>
					<span class="text-bone/80">{t.word}</span>
					<span class="text-bone/45 tabular-nums">· {t.text}</span>
				</dd>
				<dd class="mt-2 text-[11px] text-bone/40">{m.source}</dd>
			</div>
		{/each}
	</dl>
</UiChrome>
