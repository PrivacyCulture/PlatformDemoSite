<script lang="ts">
	import UiChrome from './UiChrome.svelte';
	import { panels } from '$lib/content';

	const panel = panels.architecture;
	const modules = panel.modules;
</script>

<UiChrome title={panel.title} badge={panel.badge}>
	<div class="space-y-4">
		<div
			class="rounded-xl border border-gold/35 bg-gradient-to-r from-gold/15 to-lens/10 px-4 py-4 text-center"
		>
			<p class="text-[11px] tracking-[0.22em] text-gold uppercase">{panel.top.eyebrow}</p>
			<p class="mt-1 text-[13px] font-light text-bone/70">
				{panel.top.body}
			</p>
		</div>

		<div class="flex justify-center" aria-hidden="true">
			<div class="h-6 w-px bg-gradient-to-b from-gold/50 to-bone/20"></div>
		</div>

		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each modules as item (item.title)}
				<a
					href={item.href}
					class="rounded-xl border border-bone/10 bg-white/[0.03] px-3 py-4 text-center no-underline transition-colors hover:border-lens/40 hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					<p class="text-[13px] leading-snug font-semibold text-bone">{item.title}</p>
				</a>
			{/each}
		</div>

		<div class="flex justify-center" aria-hidden="true">
			<div class="h-6 w-px bg-gradient-to-b from-bone/20 to-lens/40"></div>
		</div>

		<div class="rounded-xl border border-lens/30 bg-lens/10 px-4 py-4 text-center">
			<p class="text-[11px] tracking-[0.22em] text-lens uppercase">{panel.bottom.eyebrow}</p>
			<p class="mt-1 text-[13px] font-light text-bone/70">{panel.bottom.body}</p>
		</div>
	</div>
</UiChrome>
