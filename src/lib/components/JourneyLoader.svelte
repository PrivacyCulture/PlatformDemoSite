<script lang="ts">
	import { journey } from '$lib/content';

	let {
		progress = 0,
		visible = true,
		variant = 'cover'
	}: {
		progress?: number;
		visible?: boolean;
		/**
		 * `cover` hides the page until the first clip is ready. `bar` is a thin line along the top,
		 * used when the hero's still is on screen and there is nothing to hide.
		 */
		variant?: 'cover' | 'bar';
	} = $props();

	const copy = journey.ui.loader;
	const pct = $derived(Math.min(100, Math.max(0, Math.round(progress * 100))));
</script>

{#if visible && variant === 'bar'}
	<div
		id="journey-loader-bar"
		class="fixed inset-x-0 top-0 z-[60] h-0.5 bg-bone/10"
		role="progressbar"
		aria-label={copy.message}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={pct}
	>
		<!-- Never drawn at 0%: a bar with nothing in it does not read as loading. -->
		<div
			class="h-full bg-lens shadow-[0_0_8px_rgba(0,155,204,0.7)] transition-[width] duration-200 ease-out"
			style="width: {Math.max(pct, 8)}%"
		></div>
	</div>
{:else if visible}
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
				<div class="text-xs tracking-[0.28em] text-lens uppercase">{copy.brand}</div>
				<p class="mt-3 text-sm font-light tracking-wide text-bone-dim">{copy.message}</p>
			</div>
		</div>

		<div class="h-0.5 w-full max-w-[220px] overflow-hidden rounded-full bg-bone/15" aria-hidden="true">
			<div class="h-full rounded-full bg-lens transition-[width] duration-200 ease-out" style="width: {pct}%"
			></div>
		</div>
		<div class="mt-3 font-mono text-[11px] tracking-[0.18em] text-bone-dim tabular-nums">{pct}%</div>
	</div>
{/if}
