<script lang="ts">
	import { page } from '$app/state';
	import { homepageJsonLd, jsonLdScript } from '$lib/site/aeo';
	import { site } from '$lib/content';
	import SeoHead from './site/SeoHead.svelte';
	import { metaKeywords } from '$lib/site/seo';

	const schema = $derived(homepageJsonLd(page.url.origin));
</script>

<!-- The homepage's title is used as typed, not through pageTitle(). Keywords come only from the
     CMS; blank draws no keywords tag. There is deliberately no hidden text block here: content a
     visitor cannot see is treated as spam by search engines, so everything the structured data
     says must also be on a visible page. -->
<SeoHead title={site.meta.title} description={site.meta.description} keywords={metaKeywords(site.meta)} />

<svelte:head>
	<link rel="canonical" href="{page.url.origin}/" />
	{@html jsonLdScript(schema)}
</svelte:head>
