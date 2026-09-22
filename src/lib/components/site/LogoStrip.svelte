<script lang="ts">
	import { site } from '$lib/site/content';
</script>

<div class="logo-strip w-full border-t border-ink/10 pt-5 pb-1 sm:pt-6">
	<p class="mb-4 text-[11px] tracking-[0.22em] text-ink/45 uppercase sm:mb-5">
		{site.trusted.label}
	</p>
	<ul
		class="flex flex-wrap items-center gap-x-8 gap-y-4 sm:gap-x-10 lg:gap-x-14"
		aria-label={site.trusted.ariaLabel}
	>
		{#each site.trusted.names as name (name)}
			<li
				class="text-[13px] font-semibold tracking-[0.14em] text-ink/40 uppercase sm:text-[14px] sm:tracking-[0.18em]"
			>
				{name}
			</li>
		{/each}
	</ul>
</div>
