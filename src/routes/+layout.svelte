<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import { asset } from '$lib/content/assets';
	import { captureUtmsFromLocation } from '$lib/demo/utm';
	import { site } from '$lib/content';

	const favicon = asset(site.favicon);

	let { children } = $props();

	onMount(() => {
		captureUtmsFromLocation();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{site.meta.title}</title>
	<meta name="description" content={site.meta.description} />
</svelte:head>

{@render children()}
