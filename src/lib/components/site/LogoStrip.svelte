<script lang="ts">
	import { site } from '$lib/site/content';
	import { trustedEntries, isExternal } from '$lib/site/trusted';

	const entries = $derived(trustedEntries(site.trusted.names));
</script>

<div class="logo-strip w-full border-t border-ink/10 pt-5 pb-1 sm:pt-6">
	<p class="mb-4 text-[11px] tracking-[0.22em] text-ink/45 uppercase sm:mb-5">
		{site.trusted.label}
	</p>
	<ul
		class="flex flex-wrap items-center gap-x-[1.2rem] gap-y-[0.6rem] sm:gap-x-6 lg:gap-x-[2.1rem]"
		aria-label={site.trusted.ariaLabel}
	>
		<!-- Keyed by position: the CMS can copy an entry, and a duplicate key would throw during
		     hydration and take the client router down with it. -->
		{#each entries as entry, i (i)}
			<li
				class="text-[13px] font-semibold tracking-[0.14em] text-ink/40 uppercase sm:text-[14px] sm:tracking-[0.18em]"
			>
				{#if entry.href}
					<a
						href={entry.href}
						class="logo-link inline-flex items-center transition-colors hover:text-ink/70"
						target={isExternal(entry.href) ? '_blank' : undefined}
						rel={isExternal(entry.href) ? 'noopener noreferrer' : undefined}
					>
						{@render mark(entry)}
					</a>
				{:else}
					{@render mark(entry)}
				{/if}
			</li>
		{/each}
	</ul>
</div>

{#snippet mark(entry: { name: string; src: string })}
	{#if entry.src}
		<img
			src={entry.src}
			alt={entry.name}
			loading="lazy"
			decoding="async"
			class="logo-img h-7 w-auto max-w-[9rem] object-contain opacity-60 grayscale transition sm:h-8"
		/>
	{:else}
		{entry.name}
	{/if}
{/snippet}

<style>
	.logo-link:hover .logo-img,
	.logo-link:focus-visible .logo-img {
		opacity: 1;
		filter: none;
	}
</style>
