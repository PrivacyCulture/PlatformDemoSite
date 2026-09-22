<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import { captureUtmsFromLocation } from '$lib/demo/utm';
	import { site } from '$lib/content';

	let { children } = $props();

	onMount(() => {
		captureUtmsFromLocation();
	});
</script>

<svelte:head>
	<title>{site.meta.title}</title>
	<meta name="description" content={site.meta.description} />
</svelte:head>

{@render children()}
