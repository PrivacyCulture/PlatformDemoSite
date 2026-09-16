<script lang="ts">
	import type { JourneyContent } from '$lib/journey/content';

	let {
		links,
		visible = true
	}: {
		links: JourneyContent['legal']['links'];
		visible?: boolean;
	} = $props();
</script>

{#if visible}
	<div
		class="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-[150px] bg-gradient-to-t from-ink via-ink/70 to-transparent"
		aria-hidden="true"
	></div>
	<nav
		aria-label="Legal"
		class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-8"
	>
		<ul
			class="pointer-events-auto flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-[11px] tracking-wide text-bone/70"
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
						class="rounded px-1 py-1 no-underline transition-colors hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens"
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
