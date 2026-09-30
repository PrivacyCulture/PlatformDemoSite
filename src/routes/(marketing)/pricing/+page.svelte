<script lang="ts">
	import SeoHead from '$lib/components/site/SeoHead.svelte';
	import { metaKeywords } from '$lib/site/seo';
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import { pages, pageTitle } from '$lib/content';

	const copy = pages.pricing;
</script>

<SeoHead
	title={pageTitle(copy.meta.title)}
	description={copy.meta.description}
	keywords={metaKeywords(copy.meta)}
/>

<PricingStrip asPage />

<div class="mt-16 w-full">
	<DemoCtaBlock />
</div>
