<script lang="ts">
	import { page } from '$app/state';
	import { aeoKeywords, aeoQuestions, homepageJsonLd, jsonLdScript, searchTerms } from '$lib/site/aeo';
	import { content } from '$lib/journey/content';

	const schema = $derived(homepageJsonLd(page.url.origin));
</script>

<svelte:head>
	<meta name="keywords" content={aeoKeywords} />
	<link rel="canonical" href="{page.url.origin}/" />
	{@html jsonLdScript(schema)}
</svelte:head>

<!--
	Crawlable AEO index. Visually clipped so the cinematic journey is unchanged;
	kept in the DOM (not display:none) so answer engines can extract Q&A and terms.
-->
<section class="sr-only" aria-hidden="true" data-aeo>
	<p data-aeo-answer>{content.meta.description}</p>
	<h2>Questions people ask AI when looking for privacy software</h2>
	<dl>
		{#each aeoQuestions as item (item.question)}
			<dt>{item.question}</dt>
			<dd data-aeo-answer>{item.answer}</dd>
		{/each}
	</dl>
	<h2>Search terms</h2>
	<ul>
		{#each searchTerms as term (term)}
			<li>{term}</li>
		{/each}
	</ul>
</section>
