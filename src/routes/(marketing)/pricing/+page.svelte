<script lang="ts">
	import SeoHead from '$lib/components/site/SeoHead.svelte';
	import { metaKeywords } from '$lib/site/seo';
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import FoldoutList from '$lib/components/site/FoldoutList.svelte';
	import AddedSection from '$lib/components/site/AddedSection.svelte';
	import { page } from '$app/state';
	import { SOFTWARE_ID } from '$lib/site/aeo';
	import { pages, pageTitle } from '$lib/content';
	import { pricingModules } from '$lib/site/pricing';
	import { pricingLayout } from '$lib/site/page-layout';

	const copy = pages.pricing;
	// Read loosely: content served before Sorted is synced has none.
	const modules = $derived(pricingModules((copy as { modules?: unknown }).modules));
	// The launch modules, the call to action and any sections added in the CMS, in the order set
	// there. The plans are not in it: they carry the page's heading, so they always come first.
	const entries = $derived(pricingLayout(copy));
</script>

<!-- The software node carries the offers, so this page is about it. -->
<SeoHead
	title={pageTitle(copy.meta.title)}
	description={copy.meta.description}
	keywords={metaKeywords(copy.meta)}
	mainEntityId={SOFTWARE_ID(page.url.origin)}
/>

<PricingStrip asPage />

{#each entries as entry (entry.id)}
	{#if entry.kind === 'section'}
		<AddedSection section={entry.section} />
	{:else if entry.id === 'modules'}
		{#if modules}<FoldoutList class="mt-6" title={modules.title} intro={modules.intro} items={modules.items} />{/if}
	{:else if entry.id === 'cta'}
		<div class="mt-16 w-full"><DemoCtaBlock /></div>
	{/if}
{/each}
