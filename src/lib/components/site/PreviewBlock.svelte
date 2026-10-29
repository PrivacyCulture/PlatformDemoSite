<!--
	Marks one part of a page with the id Sorted's page builder knows it by, so the builder's preview
	can outline it and a click on it can select it there (see $lib/site/sorted-preview.ts).
	`display: contents` gives the marker no box of its own: the page lays out exactly as without it.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	let { id, children }: { id: string; children: Snippet } = $props();
</script>

<div data-block-id={id} style="display: contents">{@render children()}</div>
