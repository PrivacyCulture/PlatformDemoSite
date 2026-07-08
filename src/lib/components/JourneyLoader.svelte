<script lang="ts">
	let {
		progress = 0,
		visible = true
	}: {
		progress?: number;
		visible?: boolean;
	} = $props();

	const pct = $derived(Math.min(100, Math.max(0, Math.round(progress * 100))));
</script>

{#if visible}
	<div
		id="journey-loader"
		class="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink px-6 text-center"
		aria-busy="true"
		aria-live="polite"
		role="status"
	>
		<div class="mb-8 flex flex-col items-center gap-5">
			<span
				class="loader-ring relative block h-12 w-12 rounded-full border-2 border-bone/15 border-t-lens"
				aria-hidden="true"
			></span>
			<div>
				<div class="text-xs tracking-[0.28em] text-lens uppercase">Privacy Platform</div>
				<p class="mt-3 text-sm font-light tracking-wide text-bone-dim">Preparing your journey…</p>
			</div>
		</div>

		<div class="h-0.5 w-full max-w-[220px] overflow-hidden rounded-full bg-bone/15" aria-hidden="true">
			<div class="h-full rounded-full bg-lens transition-[width] duration-200 ease-out" style="width: {pct}%"
			></div>
		</div>
		<div class="mt-3 font-mono text-[11px] tracking-[0.18em] text-bone-dim tabular-nums">{pct}%</div>
	</div>
{/if}
