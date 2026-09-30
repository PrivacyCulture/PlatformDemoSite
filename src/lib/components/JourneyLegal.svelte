<script lang="ts">
	import type { LinkRef } from '$lib/content';

	let {
		links,
		ariaLabel,
		visible = true
	}: {
		links: LinkRef[];
		ariaLabel: string;
		visible?: boolean;
	} = $props();
</script>

{#if visible}
	<div
		class="journey-legal-fade pointer-events-none fixed inset-x-0 bottom-0 z-40 h-[150px] bg-gradient-to-t from-ink via-ink/70 to-transparent"
		aria-hidden="true"
	></div>
	<!-- Below 900px the links wrap, so they keep out of both bottom corners: the FAQ bubble on the
	     right (JourneyFaq) and Cookiebot's settings button on the left. Spaced by gaps there, as
	     the dots only read on one line and would cost the width that keeps this to three rows. -->
	<nav
		aria-label={ariaLabel}
		class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-[5rem] max-[359px]:pl-4 min-[900px]:px-4 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-8 min-[900px]:pb-[max(0.85rem,env(safe-area-inset-bottom))]"
	>
		<ul
			class="pointer-events-auto flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0 min-[900px]:gap-x-1 text-[11px] leading-none tracking-wide min-[900px]:text-[12px] text-bone/70"
		>
			{#each links as link, i (i)}
				{#if i > 0}
					<li aria-hidden="true" class="hidden px-1.5 text-bone/35 min-[900px]:block">·</li>
				{/if}
				<li>
					<a
						href={link.href}
						target={link.href.startsWith('http') ? '_blank' : undefined}
						rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
						class="inline-flex min-h-[26px] items-center rounded px-1.5 min-[900px]:min-h-9 no-underline transition-colors hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens"
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
