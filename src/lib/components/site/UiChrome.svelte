<script lang="ts">
	let {
		title,
		badge,
		pad = 'default',
		children
	}: {
		title: string;
		badge?: string;
		pad?: 'default' | 'tight';
		children: import('svelte').Snippet;
	} = $props();
</script>

<figure
	class="overflow-hidden rounded-2xl border border-gold/20 bg-[#0e1628] shadow-[0_24px_80px_rgba(4,6,10,0.45)]"
>
	<div class="flex items-center gap-3 border-b border-bone/10 px-4 py-2.5">
		<div class="flex gap-1.5" aria-hidden="true">
			<span class="h-2 w-2 rounded-full bg-bone/20"></span>
			<span class="h-2 w-2 rounded-full bg-bone/15"></span>
			<span class="h-2 w-2 rounded-full bg-bone/10"></span>
		</div>
		<p class="min-w-0 flex-1 truncate text-[11px] tracking-[0.16em] text-gold uppercase">
			{title}
		</p>
		{#if badge}
			<span
				class="shrink-0 rounded-full border border-lens/35 bg-lens/10 px-2 py-0.5 text-[10px] tracking-[0.14em] text-lens uppercase"
			>
				{badge}
			</span>
		{/if}
	</div>
	<div class={pad === 'tight' ? 'p-3 sm:p-4' : 'p-4 sm:p-6'}>
		{@render children()}
	</div>
</figure>
