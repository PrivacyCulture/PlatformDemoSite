<script lang="ts">
	import { page } from '$app/state';
	import { seoTags, seoTitle } from '$lib/site/seo';

	type Props = {
		title: string;
		description?: string | null;
		keywords?: string | null;
		image?: string | null;
	};
	let { title, description = '', keywords = '', image = null }: Props = $props();

	const input = $derived({
		title,
		description,
		keywords,
		image,
		origin: page.url.origin,
		pathname: page.url.pathname
	});
	const tags = $derived(seoTags(input));
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
</svelte:head>
