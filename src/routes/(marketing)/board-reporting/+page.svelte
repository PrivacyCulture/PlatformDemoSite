<script lang="ts">
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
	<div class="w-full">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">In the platform</p>
		<h2 class="text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
			The whole operation on one screen.
		</h2>
		<p class="mt-4 text-[16px] leading-relaxed font-light text-ink/70">
			This is the Privacy Operations Centre. The row across the top is the state of play: tasks
			open, how many are past their target date, how many are still waiting on an owner, the
			average days to close and the share closed within SLA this year. Underneath, created against
			resolved over twelve months answers the question a board actually asks, whether the team is
			keeping up or falling behind, and the category breakdown shows where the work lands, from
			vendor assessments to subject rights requests. Every tile exports, and every number traces
			back to the tasks behind it.
		</p>
	</div>
	<figure class="mt-8 w-full sm:mt-10">
		<picture>
			<source srcset="/Images/screenshots/poc-screen.webp" type="image/webp" />
			<img
				src="/Images/screenshots/poc-screen.png"
				alt="The Privacy Operations Centre dashboard, showing open, overdue and unassigned task counts above charts for status, monthly created against resolved volume, tasks by category and priority."
				width="2048"
				height="1152"
				class="block h-auto w-full drop-shadow-[0_24px_60px_rgba(11,18,32,0.14)]"
				loading="lazy"
				decoding="async"
			/>
		</picture>
	</figure>
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
