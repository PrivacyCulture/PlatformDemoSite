<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import './layout.css';
	import { captureUtmsFromLocation } from '$lib/demo/utm';
	import { tagDemoLinks } from '$lib/demo/demo-link-utm';
	import { site } from '$lib/content';
	import { recordPageView } from '$lib/site/page-view-client';
	import { startLinkedInTag } from '$lib/site/linkedin-tag';

	let { children } = $props();

	// One anonymous page view per page shown — see page-view.ts for exactly what is sent.
	afterNavigate(() => recordPageView({ pathname: page.url.pathname, status: page.status }));

	onMount(() => {
		captureUtmsFromLocation();
		// The LinkedIn tag, only with Marketing consent and only on the live site; see linkedin-tag.ts.
		const stopTag = startLinkedInTag(page.data.tracking ?? null);
		// Every Book a demo button says which page it was clicked on; see demo-link-utm.ts.
		const stopTagging = tagDemoLinks();
		return () => {
			stopTag();
			stopTagging();
		};
	});
</script>

<svelte:head>
	<!-- A last-resort title only. Every page draws its own tags through SeoHead; a description
	     here would be a second one on every page that sets its own. -->
	<title>{site.meta.title}</title>
</svelte:head>

{@render children()}
