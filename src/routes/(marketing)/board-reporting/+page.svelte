<script lang="ts">
	import BoardDashboard from '$lib/components/site/BoardDashboard.svelte';
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import MountainScene from '$lib/components/site/MountainScene.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import ProblemPager from '$lib/components/site/ProblemPager.svelte';
	import { site } from '$lib/site/content';

	const functions = [
		{
			title: 'Live posture, not a quarterly build',
			body: 'ROPA confirmation, vendor currency, open risks and overdue tasks are read from the estate, so the report is as current as the records behind it.'
		},
		{
			title: 'Target and gap on every measure',
			body: 'Set the target the board agreed and show the distance to it, with the trend since last quarter alongside.'
		},
		{
			title: 'Drill from the number to the record',
			body: 'Every figure links back to the activities, vendors or tasks behind it, so a challenge in the room has an answer.'
		}
	];
</script>

<svelte:head>
	<title>Show the Board — {site.brand}</title>
	<meta
		name="description"
		content="Board-ready privacy reporting drawn from the live estate: the trend, the target and the gap on one screen, with every number traceable to a record."
	/>
</svelte:head>

<PageHero
	eyebrow="Problem"
	title="Can you show the board where privacy stands, on one screen?"
	body="Boards do not want a walkthrough of a spreadsheet. They want the trend, the target and the gap. Pull those from the live estate rather than assembling them by hand each quarter, so the story is current and every number can be traced."
	primary={{ label: 'Book a demo', href: site.demoHref }}
	secondary={{ label: 'See the platform', href: '/platform' }}
	micro={site.pricing.micro}
/>

<section class="mt-14 w-full sm:mt-20">
	<BoardDashboard />
</section>

<MountainScene side="left" class="mt-16 sm:mt-24">
	<section class="w-full">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Functionality</p>
		<h2 class="max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
			Numbers with a trail.
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
		title="Show your board the trend, the target and the gap."
		body="Book a demo to see the board view built from live records, and how every number drills to the activity, vendor or task behind it."
	/>
</div>

<ProblemPager current="/board-reporting" />
