<!--
	A heading that folds open to a list of named items — /pricing's launch modules, and the
	Fold-out list template a CMS section can be made from. One component for both, so a section
	saved in the CMS and placed on another page looks exactly like the one it was saved from.

	A <details> keeps every item in the HTML, open or shut, so search engines and AI assistants
	read the whole list.
-->
<script lang="ts">
	import { rich } from '$lib/site/rich';

	let {
		title,
		intro = '',
		items,
		class: className = ''
	}: {
		title: string;
		intro?: string;
		items: { title: string; body: string }[];
		class?: string;
	} = $props();

	// A blank item is not drawn: the CMS sends a section mid-edit.
	const shown = $derived(items.filter((i) => i.title.trim() || i.body.trim()));
</script>

<details class={['foldout group w-full rounded-2xl border border-ink/10 bg-white/80 backdrop-blur-sm', className]}>
	<summary
		class="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-7 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens sm:px-9"
	>
		<h2 class="text-[1.05rem] font-bold tracking-tight text-heading transition-colors group-hover:text-lens">
			{title}
		</h2>
		<svg
			viewBox="0 0 24 24"
			class="h-5 w-5 shrink-0 text-gold transition-transform duration-200 group-open:rotate-180"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M6 9l6 6 6-6" />
		</svg>
	</summary>
	<div class="border-t border-ink/10 px-7 pt-6 pb-8 sm:px-9">
		{#if intro}
			<p class="rt max-w-[64ch] text-[14.5px] leading-relaxed font-light text-ink/70">{@html rich(intro)}</p>
		{/if}
		{#if shown.length}
			<!-- Keyed by position: two items may share a title while somebody is still writing them. -->
			<ul class={['grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3', intro ? 'mt-6' : '']}>
				{#each shown as item, i (i)}
					<li class="border-l-2 border-lens/40 pl-4">
						{#if item.title}<h3 class="text-[15px] font-semibold tracking-tight text-heading">{item.title}</h3>{/if}
						{#if item.body}
							<p class="rt mt-1.5 text-[14px] leading-relaxed font-light text-ink/70">{@html rich(item.body)}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</details>

<style>
	.foldout summary::-webkit-details-marker {
		display: none;
	}
</style>
