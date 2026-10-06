<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import { captureUtmsFromLocation } from '$lib/demo/utm';
	import { tagDemoLinks } from '$lib/demo/demo-link-utm';
	import { site } from '$lib/content';

	let { children } = $props();

	onMount(() => {
		captureUtmsFromLocation();
		// Every Book a demo button says which page it was clicked on; see demo-link-utm.ts.
		return tagDemoLinks();
	});
</script>

<svelte:head>
	<!-- A last-resort title only. Every page draws its own tags through SeoHead; a description
	     here would be a second one on every page that sets its own. -->
	<title>{site.meta.title}</title>
</svelte:head>

{@render children()}
