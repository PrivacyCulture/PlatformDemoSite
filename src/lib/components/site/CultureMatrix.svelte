<script lang="ts">
	import UiChrome from './UiChrome.svelte';

	const cells = [
		{ x: 'High confidence', y: 'Low operational risk', note: 'Healthy', tone: 'ok' },
		{ x: 'High confidence', y: 'High operational risk', note: 'Blind spot', tone: 'alert' },
		{ x: 'Low confidence', y: 'Low operational risk', note: 'Over-anxious', tone: 'mid' },
		{ x: 'Low confidence', y: 'High operational risk', note: 'Priority', tone: 'warn' }
	];
</script>

<UiChrome title="CultureLens × operational risk" badge="Matrix">
	<p class="mb-4 max-w-[46ch] text-[13px] font-light text-bone/65">
		Employee privacy sentiment against actual risk markers from data activities and incident logs.
	</p>
	<div class="grid gap-3 sm:grid-cols-2">
		{#each cells as cell (cell.note)}
			<div
				class="rounded-xl border p-4
				{cell.tone === 'alert'
					? 'border-gold/45 bg-gold/10'
					: cell.tone === 'warn'
						? 'border-red-400/30 bg-red-400/10'
						: cell.tone === 'ok'
							? 'border-lens/30 bg-lens/10'
							: 'border-bone/15 bg-white/[0.03]'}"
			>
				<p class="text-[11px] tracking-[0.14em] text-bone/50 uppercase">{cell.y}</p>
				<p class="mt-1 text-[13px] text-bone/70">{cell.x}</p>
				<p class="mt-3 text-[16px] font-bold tracking-tight">{cell.note}</p>
			</div>
		{/each}
	</div>
</UiChrome>
