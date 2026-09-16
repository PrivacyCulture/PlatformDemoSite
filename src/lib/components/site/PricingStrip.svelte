<script lang="ts">
	import GoldCta from './GoldCta.svelte';
	import LensCta from './LensCta.svelte';
	import { site } from '$lib/site/content';

	let { asPage = false }: { asPage?: boolean } = $props();
</script>

<section id="pricing" class={['w-full scroll-mt-24', asPage && 'pt-6 sm:pt-10']}>
	<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Clear pricing</p>
	<svelte:element
		this={asPage ? 'h1' : 'h2'}
		class={[
			'max-w-[18ch] font-bold tracking-tight',
			asPage
				? 'text-[clamp(2.2rem,5.8vw,4.1rem)] leading-[1.04]'
				: 'text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight'
		]}
	>
		{site.pricing.title}
	</svelte:element>

	<ul class="mt-8 grid gap-4 md:grid-cols-3">
		{#each site.pricing.tiers as tier (tier.band)}
			<li
				class={[
					'flex flex-col rounded-2xl border p-5 sm:p-6',
					tier.featured
						? 'border-gold/50 bg-gold/[0.07] shadow-[0_16px_48px_rgba(212,175,106,0.12)]'
						: 'border-lens/40 bg-transparent'
				]}
			>
				{#if tier.featured}
					<p class="text-[11px] tracking-[0.2em] text-gold uppercase">Most teams start here</p>
				{/if}
				<h3
					class={[
						'text-[15px] font-semibold tracking-tight text-ink',
						tier.featured ? 'mt-2' : 'mt-0'
					]}
				>
					{tier.band}
				</h3>
				<p class="mt-5 flex flex-wrap items-baseline gap-1.5">
					<span class="text-[2.15rem] leading-none font-bold tracking-tight text-heading tabular-nums sm:text-[2.4rem]">
						{tier.rate}
					</span>
					{#if tier.period}
						<span class="text-[14px] font-light text-ink/50">{tier.period}</span>
					{/if}
				</p>
				<div class="mt-auto pt-6 [&_a]:w-full">
					{#if tier.featured}
						<GoldCta href={tier.href} label={tier.cta} />
					{:else}
						<LensCta href={tier.href} label={tier.cta} />
					{/if}
				</div>
			</li>
		{/each}
	</ul>

	<p class="mt-5 max-w-[58ch] text-[13px] leading-relaxed font-light text-ink/55">
		{site.pricing.footnote}
	</p>
</section>
