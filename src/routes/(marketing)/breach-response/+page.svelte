<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import MountainScene from '$lib/components/site/MountainScene.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import ProblemPager from '$lib/components/site/ProblemPager.svelte';
	import { site } from '$lib/site/content';

	const functions = [
		{
			title: 'Roles set before the incident',
			body: 'Triage lead, DPO, comms and legal are named in advance, each with a fallback, so nobody is deciding who decides at 5pm on a Friday.'
		},
		{
			title: 'The clock starts at detection',
			body: 'Every action is timestamped against the 72-hour deadline, so you always know how much runway is left and can show how you used it.'
		},
		{
			title: 'Blast radius from the map',
			body: 'Link the incident to the systems involved and the estate shows the processing activities, vendors and data subjects affected.'
		}
	];
</script>

<svelte:head>
	<title>Breach Response Readiness — {site.brand}</title>
	<meta
		name="description"
		content="Breach response with roles, a running 72-hour clock and an evidence log built as decisions are made, tied to the systems and activities involved."
	/>
</svelte:head>

<PageHero
	eyebrow="Problem"
	title="It is 5pm on a Friday and someone has lost a laptop. Now what?"
	body="Seventy-two hours is not long when the first six are spent working out who is in charge and which systems were involved. Predefine the roles, start the clock at detection and log every decision as it is made, so the notification is evidenced rather than reconstructed."
	primary={{ label: 'Book a demo', href: site.demoHref }}
	secondary={{ label: 'See the platform', href: '/platform' }}
	micro={site.pricing.micro}
/>

<blockquote
	class="mt-12 max-w-4xl border-l-2 border-gold pl-5 text-[clamp(1.2rem,2.4vw,1.55rem)] leading-snug font-bold tracking-tight"
>
	“The regulator will ask what you knew, when you knew it, and what you did in between.”
</blockquote>

<section class="mt-14 w-full sm:mt-20">
	<div class="w-full">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">In the platform</p>
		<h2 class="text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
			The shape of your incidents, before the next one.
		</h2>
		<p class="mt-4 text-[16px] leading-relaxed font-light text-ink/70">
			This is the breach readiness view. The top row is the current position: incidents open, how
			many are still awaiting triage, how many have been confirmed and how many have crossed the
			threshold for notifying a regulator. Below it, the pipeline shows where cases are stacked up
			and how long each stage is taking in practice, from triage through investigation and
			containment to closure. Severity and root cause sit alongside, so the pattern behind the
			incidents is something you can point at rather than something you suspect.
		</p>
	</div>
	<figure class="mt-8 w-full sm:mt-10">
		<picture>
			<source srcset="/Images/screenshots/breach-readiness-screen.webp" type="image/webp" />
			<img
				src="/Images/screenshots/breach-readiness-screen.png"
				alt="The Breach Readiness dashboard, showing incident counts and notifications required above charts for incidents over time, stage pipeline and duration, severity distribution and root causes."
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
			Rehearsed, not improvised.
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
		title="Rehearse the Friday breach before it happens."
		body="Book a demo to see the roles, the 72-hour clock and the evidence log working together on a live incident walkthrough."
	/>
</div>

<ProblemPager current="/breach-response" />
