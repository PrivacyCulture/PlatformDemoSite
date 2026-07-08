<script lang="ts">
	let {
		label,
		onclick,
		class: className = ''
	}: {
		label: string;
		onclick: () => void;
		class?: string;
	} = $props();
</script>

<button
	type="button"
	{onclick}
	aria-label={label}
	class={[
		'mx-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-bone/25 text-bone-dim transition-all hover:-translate-y-0.5 hover:border-bone/60 hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens',
		className
	]}
>
	<svg
		width="15"
		height="15"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d="M6 9l6 6 6-6" />
	</svg>
</button>
