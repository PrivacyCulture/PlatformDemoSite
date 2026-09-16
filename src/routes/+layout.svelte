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
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
	<title>{content.meta.title}</title>
	<meta name="description" content={content.meta.description} />
</svelte:head>

{@render children()}
