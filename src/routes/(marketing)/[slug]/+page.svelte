<!--
	A page created in the CMS (Sorted → Website → Platform → New page). Its shape is fixed:
	a heading, an introduction, numbered sections and the house demo call to action.

	THE RULE, shared with Sorted's registry (`CUSTOM_PAGE_HTML` in platform-documents.ts): only
	the fields rendered here through rich() may carry inline markup — intro, each section's body,
	and the CTA's body and micro line. Every other string is plain text.
-->
<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import { pageTitle } from '$lib/content';
	import { rich, plain } from '$lib/site/rich';

	let { data } = $props();
	const page = $derived(data.page);
	const sections = $derived(page.sections.filter((s) => s.title.trim() || s.body.trim()));
</script>

<svelte:head>
	<title>{pageTitle(plain(page.meta.title || page.title))}</title>
	{#if page.meta.description}<meta name="description" content={plain(page.meta.description)} />{/if}
</svelte:head>

<div class="w-full pt-6 sm:pt-10">
	<header class="max-w-[46rem]">
		{#if page.eyebrow}
			<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{page.eyebrow}</p>
		{/if}
		<h1 class="text-[clamp(2rem,5vw,3.4rem)] leading-[1.04] font-bold tracking-tight">{page.title}</h1>
		{#if page.intro}
			<p class="mt-6 max-w-[62ch] text-[17px] leading-relaxed font-light text-ink/70">{@html rich(page.intro)}</p>
		{/if}
	</header>

	{#if sections.length}
		<div class="mt-12 max-w-[44rem] space-y-10">
			<!-- Keyed by position, not id: the committed fallback file is never validated, and a
			     repeated key would throw during hydration and take the site's router down. -->
			{#each sections as section, i (i)}
				<section id={section.id} class="scroll-mt-24 border-t border-ink/10 pt-6">
					<p class="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-ink/65 tabular-nums">
						<span aria-hidden="true" class="h-px w-5 bg-gold"></span>
						{String(i + 1).padStart(2, '0')}
					</p>
					{#if section.title}
						<h2 class="mt-2 text-[1.25rem] leading-snug font-bold tracking-tight">{section.title}</h2>
					{/if}
					{#if section.body}
						<p class="mt-3 max-w-[62ch] text-[15px] leading-relaxed font-light whitespace-pre-line text-ink/70">
							{@html rich(section.body)}
						</p>
					{/if}
				</section>
			{/each}
		</div>
	{/if}

	<section class="mt-16 sm:mt-24">
		<DemoCtaBlock
			eyebrow={page.cta.eyebrow || undefined}
			title={page.cta.title || undefined}
			body={page.cta.body || undefined}
			micro={page.cta.micro || undefined}
		/>
	</section>
</div>
