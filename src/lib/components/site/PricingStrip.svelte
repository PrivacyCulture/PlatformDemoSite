<script lang="ts">
	import GoldCta from './GoldCta.svelte';
	import LensCta from './LensCta.svelte';
	import { site } from '$lib/site/content';
	import { rich } from '$lib/site/rich';
	import { featureParts, pricingPlans } from '$lib/site/pricing';

	let {
		asPage = false,
		showFootnote = true
	}: {
		asPage?: boolean;
		/** /pricing carries its own notes panel, which says what the footnote says and more. */
		showFootnote?: boolean;
	} = $props();

	const plans = $derived(pricingPlans(site.pricing));
	// Read loosely: content served before Sorted is synced has no intro.
	const intro = $derived((site.pricing as { intro?: string }).intro ?? '');
</script>

<section id="pricing" class={['w-full scroll-mt-24', asPage && 'pt-6 sm:pt-10']}>
	<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">{site.pricing.eyebrow}</p>
	<svelte:element
		this={asPage ? 'h1' : 'h2'}
		class={[
			'max-w-[20ch] font-bold tracking-tight',
			asPage
				? 'text-[clamp(2.2rem,5.8vw,4.1rem)] leading-[1.04]'
				: 'text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight'
		]}
	>
		{site.pricing.title}
	</svelte:element>
	{#if intro}
		<p class="rt mt-5 max-w-[60ch] text-[16px] leading-relaxed font-light text-ink/70">{@html rich(intro)}</p>
	{/if}

	<ul class="plans mt-9 grid gap-4">
		{#each plans as plan, i (i)}
			{@const featured = plan.style === 'featured'}
			{@const enterprise = plan.style === 'enterprise'}
			<li
				class={[
					'plan relative isolate flex flex-col overflow-hidden rounded-2xl border p-6',
					featured &&
						'on-ink border-gold/40 bg-ink text-bone shadow-[0_24px_60px_rgba(11,18,32,0.32),inset_0_1px_0_rgba(247,250,252,0.06)]',
					enterprise && 'border-heading/20 bg-[#e8edf7]/85 backdrop-blur-sm',
					!featured && !enterprise && 'border-lens/30 bg-white/80 shadow-[0_10px_30px_rgba(11,18,32,0.05)] backdrop-blur-sm'
				]}
			>
				{#if featured}
					<div
						aria-hidden="true"
						class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_90%_115%,rgba(16,51,137,0.6),transparent_60%),radial-gradient(ellipse_at_-10%_-20%,rgba(212,175,106,0.2),transparent_50%)]"
					></div>
				{/if}

				<div class="flex min-h-7 items-center justify-between gap-2">
					<p class={['text-[12.5px] font-medium', featured ? 'text-bone/70' : 'text-ink/60']}>{plan.bandLabel}</p>
					{#if featured && site.pricing.featuredLabel}
						<p class="rounded-full bg-gold px-2.5 py-1 text-[11px] leading-tight font-semibold text-gold-ink">
							{site.pricing.featuredLabel}
						</p>
					{/if}
				</div>
				<h3 class={['mt-1 text-[1.3rem] leading-tight font-bold tracking-tight', featured ? 'text-bone' : 'text-heading']}>
					{plan.band}
				</h3>

				<!-- Always rendered, even empty: on a wide screen each line is a row the cards share. -->
				<p class={['lead mt-5 text-[13px] leading-snug', featured ? 'text-bone/65' : 'text-ink/55']}>{plan.lead}</p>
				<p class="mt-1 flex flex-wrap items-baseline gap-x-1.5">
					<span
						class={[
							'text-[clamp(1.85rem,2.3vw,2.15rem)] leading-none font-bold tracking-tight tabular-nums',
							featured ? 'text-bone' : 'text-heading'
						]}
					>
						{plan.rate}
					</span>
					{#if plan.period}
						<span class={['text-[13px] font-light', featured ? 'text-bone/60' : 'text-ink/50']}>{plan.period}</span>
					{/if}
				</p>
				<p class={['mt-2 text-[12.5px]', featured ? 'text-bone/60' : 'text-ink/55']}>{plan.billed}</p>

				{#if plan.features.length}
					<ul
						class={[
							'mt-5 space-y-2.5 border-t pt-5 text-[14px] leading-snug',
							featured ? 'border-bone/15 text-bone/85' : 'border-ink/10 text-ink/80'
						]}
					>
						{#each plan.features as feature, f (f)}
							{@const parts = featureParts(feature)}
							<li class={['rt', featured ? '[&_strong]:text-bone' : '[&_strong]:text-heading']}>
								{#if parts.figure}<strong>{parts.figure}</strong>{/if}{@html rich(parts.rest)}
							</li>
						{/each}
					</ul>
				{:else}
					<div aria-hidden="true"></div>
				{/if}

				<div class="cta mt-auto pt-7 [&_a]:w-full">
					{#if featured}
						<GoldCta href={plan.href} label={plan.cta} />
					{:else if enterprise}
						<LensCta href={plan.href} label={plan.cta} />
					{:else}
						<a
							href={plan.href}
							class="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-lens/70 bg-white/70 px-6 py-3 text-[14px] font-semibold tracking-wide text-heading no-underline transition-all hover:-translate-y-0.5 hover:border-lens hover:bg-lens hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
						>
							{plan.cta}
						</a>
					{/if}
				</div>
			</li>
		{/each}
	</ul>

	{#if showFootnote && site.pricing.footnote}
		<p class="rt mt-5 max-w-[64ch] text-[13px] leading-relaxed font-light text-ink/55">
			{@html rich(site.pricing.footnote)}
		</p>
	{/if}
</section>

<style>
	/* As many columns as fit at 13rem each: all five side by side on a desktop, wrapping
	   cleanly on a narrower screen, one column on a phone. */
	.plans {
		grid-template-columns: repeat(auto-fit, minmax(min(13rem, 100%), 1fr));
	}

	/* Wide enough for every card on one line: the seven lines of each card (label, band, lead,
	   price, billed, features, button) become rows the cards share, so the prices and the
	   dividers sit level however a line wraps in one card. */
	@media (min-width: 72rem) {
		.plans {
			row-gap: 0;
		}
		.plan {
			display: grid;
			grid-template-rows: subgrid;
			grid-row: span 7;
			row-gap: 0;
			margin-bottom: 1rem;
		}
		.plan > .cta,
		.plan > .lead {
			align-self: end;
		}
	}
</style>
