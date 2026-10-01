<script lang="ts">
	import SeoHead from '$lib/components/site/SeoHead.svelte';
	import { metaKeywords } from '$lib/site/seo';
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import { page } from '$app/state';
	import { SOFTWARE_ID } from '$lib/site/aeo';
	import { pages, pageTitle } from '$lib/content';

	const copy = pages.pricing;
</script>

<!-- The software node carries the offers, so this page is about it. -->
<SeoHead
	title={pageTitle(copy.meta.title)}
	description={copy.meta.description}
	keywords={metaKeywords(copy.meta)}
	mainEntityId={SOFTWARE_ID(page.url.origin)}
/>

<PricingStrip asPage />

<div class="mt-16 w-full">
	<DemoCtaBlock />
</div>
