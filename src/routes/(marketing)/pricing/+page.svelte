<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import { site } from '$lib/site/content';
</script>

<svelte:head>
	<title>Pricing — {site.brand}</title>
	<meta
		name="description"
		content="Transparent rates scaled to organisation size. 12-month agreement. All launch modules included. Assisted onboarding included."
	/>
</svelte:head>

<PricingStrip asPage />

<div class="mt-16 w-full">
	<DemoCtaBlock />
</div>
