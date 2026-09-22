<script lang="ts">
	import { pages, pageTitle, site } from '$lib/content';
	import { platformSpecs } from '$lib/journey/content';

	let { data } = $props();
	const spec = $derived(data.spec);
	const others = $derived(platformSpecs().filter((item) => item.slug !== spec.slug));
	const copy = pages.platformSpec;
</script>

<svelte:head>
	<title>{pageTitle(spec.label, site.meta.title)}</title>
	<meta name="description" content={spec.pain} />
</svelte:head>

<article class="w-full max-w-3xl pt-6 sm:pt-10">
	<p class="mb-6">
		<a
			href={copy.backHref}
			class="text-[13px] tracking-wide text-ink/60 no-underline transition-colors hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
		>
			{copy.backLabel}
		</a>
	</p>

	<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{copy.eyebrow}</p>
	<h1 class="text-[clamp(2.2rem,5.5vw,3.75rem)] leading-[1.04] font-bold tracking-tight">
		{spec.label}
	</h1>
	<p class="mt-6 max-w-[36ch] text-[clamp(1.35rem,3vw,1.85rem)] leading-[1.2] font-bold tracking-tight text-ink/80">
		{spec.pain}
	</p>
	<p
		class="mt-6 max-w-[34ch] border-l-2 border-lens pl-5 text-[clamp(1.2rem,2.6vw,1.6rem)] leading-[1.2] font-bold tracking-tight"
	>
		<span class="text-lens">{copy.whatIf}</span>
		{' '}{spec.whatIfRest}
	</p>

	<div class="mt-10 flex flex-wrap items-center gap-4">
		<a
			href={copy.primary.href}
			class="inline-flex cursor-pointer items-center justify-center rounded-full bg-gold px-7 py-3 text-[14px] font-semibold tracking-wide text-gold-ink no-underline shadow-[0_0_0_1px_rgba(212,175,106,0.35),0_0_28px_rgba(212,175,106,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#e0c07a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
		>
			{copy.primary.label}
		</a>
		<a
			href={copy.secondary.href}
			class="inline-flex cursor-pointer items-center text-[14px] font-medium text-ink/70 no-underline underline-offset-4 transition-colors hover:text-gold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
		>
			{copy.secondary.label}
		</a>
	</div>

	{#if others.length}
		<nav class="mt-16 border-t border-ink/10 pt-8" aria-label={copy.othersAriaLabel}>
			<p class="mb-4 text-[11px] tracking-[0.22em] text-ink/50 uppercase">{copy.othersLabel}</p>
			<ul class="flex flex-wrap gap-x-5 gap-y-2">
				{#each others as item (item.slug)}
					<li>
						<a
							href={item.href}
							class="text-[14px] text-ink/80 no-underline transition-colors hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</article>
