<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { captureUtmsFromLocation } from '$lib/demo/utm';
	import { content } from '$lib/journey/content';

	let { children } = $props();

	onMount(() => {
		captureUtmsFromLocation();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{content.meta.title}</title>
	<meta name="description" content={content.meta.description} />
</svelte:head>

{@render children()}
