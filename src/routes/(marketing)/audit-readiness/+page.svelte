<script lang="ts">
	import AuditChecklist from '$lib/components/site/AuditChecklist.svelte';
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import { site } from '$lib/site/content';

	const functions = [
		{
			title: 'Time-stamped inventory reviews',
			body: 'Every ROPA attestation is dated, owned, and still visible when the auditor asks who last confirmed it.'
		},
		{
			title: 'Vendor re-attestation on a clock',
			body: 'Stale processing terms surface before the assessment, not during it.'
		},
		{
			title: 'Evidence without the scramble',
			body: 'Pass, fail, and stale states sit on one card so you can see the gaps while there is still time to close them.'
		}
	];
</script>

<svelte:head>
	<title>Audit Readiness — {site.brand}</title>
	<meta
		name="description"
		content="Maintain a continuous, time-stamped audit log of data inventory reviews and vendor re-attestations automatically."
	/>
</svelte:head>

<PageHero
	eyebrow="Problem"
	title="Can you evidence your accountability programme today?"
	body="Scrambling before an audit or insurer assessment creates friction and reveals gaps. Maintain a continuous, time-stamped audit log of data inventory reviews and vendor re-attestations automatically."
	primary={{ label: 'Book a demo', href: site.demoHref }}
	secondary={{ label: 'See the platform', href: '/platform' }}
	micro={site.pricing.micro}
/>

<section class="mt-14 w-full sm:mt-20">
	<AuditChecklist />
</section>

<section class="mt-16 w-full sm:mt-24">
	<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Functionality</p>
	<h2 class="max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
		Accountability that stays current.
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
