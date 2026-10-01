<script lang="ts">
	import { page } from '$app/state';
	import { site } from '$lib/content';
	import { pageGraph } from '$lib/site/aeo';
	import { jsonLdScript, type Crumb, type JsonLdNode } from '$lib/site/schema';
	import { canonicalUrl, seoTags, seoTitle } from '$lib/site/seo';

	type Props = {
		title: string;
		description?: string | null;
		keywords?: string | null;
		image?: string | null;
		imageWidth?: number | null;
		imageHeight?: number | null;
		imageAlt?: string | null;
		/** Parents between Home and this page, for the breadcrumb. */
		parents?: Crumb[];
		/** The page's short name, when the title's own first part is not it. */
		heading?: string | null;
		/** `@id` of the node in `schema` that the page is about. */
		mainEntityId?: string | null;
		/** Nodes this page adds to its structured data. */
		schema?: (JsonLdNode | null | undefined)[];
		/** False on a page that must not be indexed. It then carries no canonical and no schema. */
		index?: boolean;
	};
	let {
		title,
		description = '',
		keywords = '',
		image = null,
		imageWidth = null,
		imageHeight = null,
		imageAlt = null,
		parents = [],
		heading = null,
		mainEntityId = null,
		schema = [],
		index = true
	}: Props = $props();

	// The draft (preview) site serves unapproved copy under its own hostname and must never be
	// indexed; hooks.server.ts sends the matching X-Robots-Tag header.
	const draft = $derived(page.data?.contentMeta?.channel === 'draft');
	const noindex = $derived(!index || draft);

	const input = $derived({
		title,
		description,
		keywords,
		image,
		imageWidth,
		imageHeight,
		imageAlt,
		siteName: site.brand,
		noindex,
		origin: page.url.origin,
		pathname: page.url.pathname
	});
	const tags = $derived(seoTags(input));
	const canonical = $derived(canonicalUrl(input));
	const graph = $derived(
		index
			? pageGraph({
					origin: page.url.origin,
					pathname: page.url.pathname,
					title,
					description,
					image,
					parents,
					heading,
					mainEntityId,
					extra: schema
				})
			: null
	);
</script>

<svelte:head>
	<title>{seoTitle(input)}</title>
	{#each tags as tag, i (i)}
		{#if tag.property}
			<meta property={tag.property} content={tag.content} />
		{:else}
			<meta name={tag.name} content={tag.content} />
		{/if}
	{/each}
	{#if index}
		<link rel="canonical" href={canonical} />
	{/if}
	{#if graph}
		{@html jsonLdScript(graph)}
	{/if}
</svelte:head>
