<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import { pages, pageTitle } from '$lib/content';

	const copy = pages.pricing;
</script>

<svelte:head>
	<title>{pageTitle(copy.meta.title)}</title>
	<meta name="description" content={copy.meta.description} />
</svelte:head>

<PricingStrip asPage />

<div class="mt-16 w-full">
	<DemoCtaBlock />
</div>
