<script lang="ts">
	let {
		href,
		label,
		external = false,
		onclick
	}: {
		href?: string;
		label: string;
		external?: boolean;
		onclick?: () => void;
	} = $props();

	const className =
		'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-lens px-7 py-3 text-[14px] font-semibold tracking-wide text-white no-underline shadow-[0_0_0_1px_rgba(0,155,204,0.35),0_0_28px_rgba(0,155,204,0.28),0_10px_24px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens';
</script>

{#if href}
	<a
		{href}
		class={className}
		target={external ? '_blank' : undefined}
		rel={external ? 'noopener noreferrer' : undefined}
	>
		{label}
	</a>
{:else}
	<button type="button" class={className} {onclick}>
		{label}
	</button>
{/if}
