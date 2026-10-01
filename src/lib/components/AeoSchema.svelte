<script lang="ts">
	import { site } from '$lib/content';
	import SeoHead from './site/SeoHead.svelte';
	import { metaKeywords } from '$lib/site/seo';
</script>

<!-- The homepage's title is used as typed, not through pageTitle(). Keywords come only from the
     CMS; blank draws no keywords tag. There is deliberately no hidden text block here: content a
     visitor cannot see is treated as spam by search engines, so everything the structured data
     says must also be on a visible page. SeoHead adds the canonical and the JSON-LD graph — the
     organisation, the website, the software and this page. -->
<SeoHead title={site.meta.title} description={site.meta.description} keywords={metaKeywords(site.meta)} />
