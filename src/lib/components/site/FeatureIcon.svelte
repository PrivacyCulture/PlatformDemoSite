<script lang="ts">
	import { featureIcon } from '$lib/site/feature-icons';

	// A Features menu entry's icon on its tile. Lens on a pale tile; the tile fills with lens when
	// its entry is hovered (the entry is the `group`) or is the page being read. An unknown or empty
	// id keeps the tile, so the titles still line up.
	let {
		icon,
		current = false,
		tone = 'light',
		size = 'md'
	}: { icon?: string; current?: boolean; tone?: 'light' | 'dark'; size?: 'sm' | 'md' } = $props();

	const markup = $derived(featureIcon(icon));
</script>

<span
	aria-hidden="true"
	class="inline-flex shrink-0 items-center justify-center transition-colors duration-200 {size === 'sm'
		? 'h-8 w-8 rounded-lg'
		: 'h-9 w-9 rounded-xl'} {current
		? 'bg-lens text-white'
		: tone === 'dark'
			? 'bg-lens/15 text-lens group-hover:bg-lens group-hover:text-white'
			: 'bg-lens/10 text-lens group-hover:bg-lens group-hover:text-white'}"
>
	{#if markup}
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
			class={size === 'sm' ? 'h-[1.125rem] w-[1.125rem]' : 'h-5 w-5'}
		>
			{@html markup}
		</svg>
	{/if}
</span>
