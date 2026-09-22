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
	<nav
		aria-label={ariaLabel}
		class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-8"
	>
		<ul
			class="pointer-events-auto flex flex-wrap items-center justify-center gap-x-1 gap-y-0 text-[12px] tracking-wide text-bone/70"
		>
			{#each links as link, i (link.href)}
				{#if i > 0}
					<li aria-hidden="true" class="px-1.5 text-bone/35">·</li>
				{/if}
				<li>
					<a
						href={link.href}
						target={link.href.startsWith('http') ? '_blank' : undefined}
						rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
						class="inline-flex min-h-9 items-center rounded px-1.5 no-underline transition-colors hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens"
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
