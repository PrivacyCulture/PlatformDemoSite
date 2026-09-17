<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import DpiaLinkage from '$lib/components/site/DpiaLinkage.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import MountainScene from '$lib/components/site/MountainScene.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import ProblemPager from '$lib/components/site/ProblemPager.svelte';
	import { site } from '$lib/site/content';

	const functions = [
		{
			title: 'Risks become tasks',
			body: 'Each identified risk turns into a mitigation with an owner and a date, routed to the person who can actually close it.'
		},
		{
			title: 'Attached to the record',
			body: 'The DPIA sits on the processing activity it assessed. Open the record and the assessment, its risks and their status are right there.'
		},
		{
			title: 'Re-assessment triggers',
			body: 'When the activity changes materially, the platform flags the DPIA for review rather than leaving it to memory.'
		}
	];
</script>

<svelte:head>
	<title>Assessments That Land — {site.brand}</title>
	<meta
		name="description"
		content="Connect every DPIA to the live risk it identified. Mitigations get owners and deadlines, and the assessment stays attached to the processing it covers."
	/>
</svelte:head>

<PageHero
	eyebrow="Problem"
	title="Your DPIA found the risk. Did anything happen next?"
	body="Too many assessments end as a signed PDF in a folder. Tie each DPIA to the processing activity it assessed and the risks it raised, so mitigations have owners, deadlines and a live status that someone is accountable for."
	primary={{ label: 'Book a demo', href: site.demoHref }}
	secondary={{ label: 'See the platform', href: '/platform' }}
	micro={site.pricing.micro}
/>

<section class="mt-14 w-full sm:mt-20">
	<DpiaLinkage />
</section>

<MountainScene side="left" class="mt-16 sm:mt-24">
	<section class="w-full">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Functionality</p>
		<h2 class="max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
			From finding to fix.
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
		title="Turn your last DPIA into tasks with owners."
		body="Book a demo and bring an assessment you have already signed off. We will show how its risks become tracked mitigations attached to the live record."
	/>
</div>

<ProblemPager current="/dpia-follow-through" />
