<script lang="ts">
	import CultureMatrix from '$lib/components/site/CultureMatrix.svelte';
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import { site } from '$lib/site/content';

	const functions = [
		{
			title: 'CultureLens sentiment',
			body: 'See where people believe they are strong — and where confidence is running ahead of the evidence.'
		},
		{
			title: 'Operational risk markers',
			body: 'Incident logs, stale processing, and high-risk activities mark the teams that need more than an annual course.'
		},
		{
			title: 'Education that follows the gap',
			body: 'Point budget at the cells where high confidence meets high operational risk, not at another generic module.'
		}
	];
</script>

<svelte:head>
	<title>Culture & Training Alignment — {site.brand}</title>
	<meta
		name="description"
		content="Align educational initiatives with actual operational risk markers derived from data activities and incident logs."
	/>
</svelte:head>

<PageHero
	eyebrow="Problem"
	title="Stop guessing where your risk actually sits."
	body="Generic annual privacy training tick-boxes don't prevent data breaches. Align your educational initiatives with actual operational risk markers derived from data activities and incident logs."
	primary={{ label: 'Book a demo', href: site.demoHref }}
	secondary={{ label: 'See the platform', href: '/platform' }}
	micro={site.pricing.micro}
/>

<section class="mt-14 w-full sm:mt-20">
	<CultureMatrix />
</section>

<section class="mt-16 w-full sm:mt-24">
	<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Functionality</p>
	<h2 class="max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
		Train the gap, not the average.
	</h2>
	<ul class="mt-8 grid gap-4 sm:grid-cols-3">
		{#each functions as item, i (item.title)}
			<li class="rounded-2xl border border-lens/50 bg-transparent p-5">
				<p class="font-mono text-[10px] tracking-[0.18em] text-gold tabular-nums">
					{String(i + 1).padStart(2, '0')}
				</p>
				<h3 class="mt-2 text-[1.05rem] leading-snug font-bold tracking-tight">{item.title}</h3>
				<p class="mt-2 text-[14px] leading-relaxed font-light text-ink/70">{item.body}</p>
			</li>
		{/each}
	</ul>
</section>

<div class="mt-16 w-full sm:mt-24">
	<PricingStrip />
</div>

<div class="mt-10 w-full">
	<DemoCtaBlock />
</div>
