<script lang="ts">
	let {
		onHome
	}: {
		onHome: () => void;
	} = $props();
</script>

<a
	href="https://www.privacyculture.com"
	class="fixed top-6 left-5 z-40 block no-underline transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens sm:left-7 sm:top-7"
	aria-label="PrivacyCulture"
	onclick={(e) => {
		if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
			e.preventDefault();
			onHome();
		}
	}}
>
	<img
		src="/brand/privacyculture-logo.png"
		alt="PrivacyCulture"
		class="h-8 w-auto sm:h-9"
		width="220"
		height="36"
		decoding="async"
	/>
</a>
