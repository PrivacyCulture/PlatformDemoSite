<script lang="ts">
	import SeoHead from '$lib/components/site/SeoHead.svelte';
	import { metaKeywords } from '$lib/site/seo';
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import { page } from '$app/state';
	import { SOFTWARE_ID } from '$lib/site/aeo';
	import { pages, pageTitle } from '$lib/content';
	import { rich } from '$lib/site/rich';
	import { pricingModules, pricingNotes } from '$lib/site/pricing';

	const copy = pages.pricing;
	// Read loosely: content served before Sorted is synced has neither.
	const notes = $derived(pricingNotes((copy as { notes?: unknown }).notes));
	const modules = $derived(pricingModules((copy as { modules?: unknown }).modules));
</script>

<!-- The software node carries the offers, so this page is about it. -->
<SeoHead
	title={pageTitle(copy.meta.title)}
	description={copy.meta.description}
	keywords={metaKeywords(copy.meta)}
	mainEntityId={SOFTWARE_ID(page.url.origin)}
/>

<PricingStrip asPage showFootnote={notes.length === 0} />

{#if notes.length}
	<section
		aria-label="What the price covers"
		class="mt-10 grid w-full gap-8 rounded-2xl border border-ink/10 bg-white/80 p-7 backdrop-blur-sm sm:p-9 md:grid-cols-3"
	>
		{#each notes as note, i (i)}
			<div>
				{#if note.title}
					<h2 class="text-[1.05rem] font-bold tracking-tight text-heading">{note.title}</h2>
				{/if}
				{#if note.body}
					<p class="rt mt-2.5 text-[14.5px] leading-relaxed font-light text-ink/70">{@html rich(note.body)}</p>
				{/if}
			</div>
		{/each}
	</section>
{/if}

{#if modules}
	<!-- A <details> keeps every module in the HTML, open or shut, so search engines and AI
	     assistants read the whole list. -->
	<details class="modules group mt-6 w-full rounded-2xl border border-ink/10 bg-white/80 backdrop-blur-sm">
		<summary
			class="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-7 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens sm:px-9"
		>
			<h2 class="text-[1.05rem] font-bold tracking-tight text-heading transition-colors group-hover:text-lens">
				{modules.title}
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
			{#if modules.intro}
				<p class="rt max-w-[64ch] text-[14.5px] leading-relaxed font-light text-ink/70">{@html rich(modules.intro)}</p>
			{/if}
			<ul class="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each modules.items as mod, i (i)}
					<li class="border-l-2 border-lens/40 pl-4">
						<h3 class="text-[15px] font-semibold tracking-tight text-heading">{mod.title}</h3>
						{#if mod.body}
							<p class="rt mt-1.5 text-[14px] leading-relaxed font-light text-ink/70">{@html rich(mod.body)}</p>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	</details>
{/if}

<div class="mt-16 w-full">
	<DemoCtaBlock />
</div>

<style>
	.modules summary::-webkit-details-marker {
		display: none;
	}
</style>
