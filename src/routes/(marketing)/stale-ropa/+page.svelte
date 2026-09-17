<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import MountainScene from '$lib/components/site/MountainScene.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import ProblemPager from '$lib/components/site/ProblemPager.svelte';
	import { site } from '$lib/site/content';

	const functions = [
		{
			title: 'Owner attestation on a cadence',
			body: 'Each activity has a named owner who confirms it on a schedule you set. Quarterly for high-risk processing, annually for the rest.'
		},
		{
			title: 'Change-triggered review',
			body: 'A new system, vendor or purpose flags the record for re-confirmation instead of waiting for the next cycle to come round.'
		},
		{
			title: 'Freshness at a glance',
			body: 'See which records are current, due and overdue across the estate, and chase by exception rather than by spreadsheet.'
		}
	];
</script>

<svelte:head>
	<title>The Stale ROPA — {site.brand}</title>
	<meta
		name="description"
		content="Keep the record of processing current between audits. Owners in the business re-confirm their activities as they change, so the ROPA never needs rebuilding."
	/>
</svelte:head>

<PageHero
	eyebrow="Problem"
	title="When did the business last confirm your Article 30 record was true?"
	body="A ROPA rebuilt in the fortnight before an audit is a snapshot of a rush, not a record of processing. Put confirmation in the hands of the people who own each activity, on a schedule, so the register stays current between audits rather than being reconstructed for them."
	primary={{ label: 'Book a demo', href: site.demoHref }}
	secondary={{ label: 'See the platform', href: '/platform' }}
	micro={site.pricing.micro}
/>

<section class="mt-14 w-full sm:mt-20">
	<div class="w-full">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">In the platform</p>
		<h2 class="text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
			See at a glance which records are still true.
		</h2>
		<p class="mt-4 text-[16px] leading-relaxed font-light text-ink/70">
			This is the Visual ROPA View in review status mode. Every processing activity is a node,
			coloured by where its owner's confirmation stands: green when it is complete, purple while
			it is under review, red when it has not started. Filter by vendor, asset, risk or legal
			basis, and the register shows you where to chase next instead of leaving you to hunt
			through a spreadsheet.
		</p>
	</div>
	<figure class="mt-8 w-full sm:mt-10">
		<picture>
			<source srcset="/Images/screenshots/ropa-freshness-screen.webp" type="image/webp" />
			<img
				src="/Images/screenshots/ropa-freshness-screen.png"
				alt="The Visual ROPA View in review status mode, showing every processing activity as a node with complete, in progress and not started records picked out by colour."
				width="1920"
				height="1024"
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
			A register that keeps itself honest.
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
		title="See a ROPA that confirms itself."
		body="Book a demo to see owner attestation in action: the schedule, the reminders and the freshness view that shows what is current, due and overdue."
	/>
</div>

<ProblemPager current="/stale-ropa" />
