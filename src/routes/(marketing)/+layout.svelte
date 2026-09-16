<script lang="ts">
	import SiteShell from '$lib/components/site/SiteShell.svelte';

	let { children } = $props();
</script>

<SiteShell>
	{@render children()}
</SiteShell>
