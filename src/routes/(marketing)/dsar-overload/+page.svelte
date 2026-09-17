<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import DsarTimeline from '$lib/components/site/DsarTimeline.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import MountainScene from '$lib/components/site/MountainScene.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import ProblemPager from '$lib/components/site/ProblemPager.svelte';
	import { site } from '$lib/site/content';

	const functions = [
		{
			title: 'Connected estate lookup',
			body: 'Subject records resolve against live processing activities, systems, and owners — not a scavenger hunt through inboxes.'
		},
		{
			title: 'Routed collection tasks',
			body: 'Department leads get a precise request for the systems they own, with a timestamped trail back to privacy.'
		},
		{
			title: 'Incident linkage',
			body: 'If a breach or lost device is in play, the same map shows which processing activities and vendors sit in the blast radius.'
		}
	];
</script>

<svelte:head>
	<title>DSAR Overload — {site.brand}</title>
	<meta
		name="description"
		content="Stop manually chasing department leads for data locations. When your estate is connected, locating data subject records takes minutes instead of weeks."
	/>
</svelte:head>

<PageHero
	eyebrow="Problem"
	title="More than five DSARs a month, and you can't keep up?"
	body="Stop manually chasing department leads for data locations. When your estate is connected to operational systems, locating data subject records takes minutes instead of weeks."
	primary={{ label: 'Book a demo', href: site.demoHref }}
	secondary={{ label: 'See the platform', href: '/platform' }}
	micro={site.pricing.micro}
/>

<blockquote
	class="mt-12 max-w-4xl border-l-2 border-gold pl-5 text-[clamp(1.2rem,2.4vw,1.55rem)] leading-snug font-bold tracking-tight"
>
	“Regulators don't measure good intentions; they measure statutory deadlines.”
</blockquote>

<section class="mt-14 w-full sm:mt-20">
	<DsarTimeline />
</section>

<MountainScene side="left" class="mt-16 sm:mt-24">
	<section class="w-full">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Functionality</p>
		<h2 class="max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
			The map does the chasing.
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
</MountainScene>

<MountainScene side="right" class="mt-16 sm:mt-24">
	<PricingStrip />
</MountainScene>

<div class="mt-10 w-full">
	<DemoCtaBlock
		title="See a DSAR resolved against the map."
		body="Book a 25-minute demo and watch a subject request go from inbox to located records in less time than it takes to draft the first chase email."
	/>
</div>

<ProblemPager current="/dsar-overload" />
