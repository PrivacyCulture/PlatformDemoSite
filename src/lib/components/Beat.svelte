<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BeatId } from '$lib/journey/beats';

	let {
		id,
		active,
		label,
		class: className = 'w-full max-w-2xl px-6 text-center',
		style,
		children
	}: {
		id: BeatId;
		active: boolean;
		label: string;
		class?: string;
		style?: string;
		children: Snippet;
	} = $props();
</script>

<section class={['beat', className, active && 'on']} {id} aria-label={label} {style}>
	{@render children()}
</section>
