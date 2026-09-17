<script lang="ts">
	import { problemNeighbours } from '$lib/site/problems';

	let { current }: { current: string } = $props();

	const { previous, next } = $derived(problemNeighbours(current));

	const linkClass =
		'group flex min-w-0 flex-col gap-1 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens';
	const eyebrowClass = 'text-[11px] tracking-[0.2em] text-gold uppercase';
	const titleClass =
		'text-[15px] font-bold tracking-tight text-heading transition-colors group-hover:text-lens sm:text-[1.05rem]';
</script>

<nav class="mt-8 flex items-start justify-between gap-6" aria-label="Other problems this solves">
	<a href={previous.href} class={linkClass} rel="prev">
		<span class={eyebrowClass}>← Previous</span>
		<span class={titleClass}>{previous.title}</span>
	</a>
	<a href={next.href} class="{linkClass} items-end text-right" rel="next">
		<span class={eyebrowClass}>Next →</span>
		<span class={titleClass}>{next.title}</span>
	</a>
</nav>
