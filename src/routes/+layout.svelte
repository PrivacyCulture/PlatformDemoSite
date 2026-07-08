<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap"
		rel="stylesheet"
	/>
	<title>CultureLens — From clutter to clarity</title>
	<meta
		name="description"
		content="You can't fix what you can't see. Move forward and watch the noise your business lives in resolve into a clear picture."
	/>
</svelte:head>

{@render children()}
