<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import MountainScene from '$lib/components/site/MountainScene.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import ProblemPager from '$lib/components/site/ProblemPager.svelte';
	import { site } from '$lib/site/content';

	const functions = [
		{
			title: 'One processing record',
			body: 'Each activity holds its systems, vendors, lawful basis and retention in one place. The ROPA, vendor register and DPIA log become views of the same data, not rivals to it.'
		},
		{
			title: 'Change once, reflect everywhere',
			body: 'Update a retention period on the record and every export, register and dashboard picks it up. There is no second copy to forget.'
		},
		{
			title: 'Provenance you can show',
			body: 'Every field carries who set it and when, so a challenged value has an answer rather than a shrug.'
		}
	];
</script>

<svelte:head>
	<title>Conflicting Sources of Truth — {site.brand}</title>
	<meta
		name="description"
		content="Stop reconciling spreadsheets, registers and trackers that disagree. One connected privacy estate gives every processing activity a single, current record."
	/>
</svelte:head>

<PageHero
	eyebrow="Problem"
	title="Five tools, five answers. Which one does the regulator get?"
	body="When the ROPA lives in one spreadsheet, the vendor list in another and the DPIA register on a shared drive, every question about a processing activity has several answers. Connect them into one estate so a record has one owner, one status and one story."
	primary={{ label: 'Book a demo', href: site.demoHref }}
	secondary={{ label: 'See the platform', href: '/platform' }}
	micro={site.pricing.micro}
/>

<blockquote
	class="mt-12 max-w-4xl border-l-2 border-gold pl-5 text-[clamp(1.2rem,2.4vw,1.55rem)] leading-snug font-bold tracking-tight"
>
	“A privacy programme is never more accurate than the least-maintained spreadsheet it depends on.”
</blockquote>

<section class="mt-14 w-full sm:mt-20">
	<div class="w-full">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">In the platform</p>
		<h2 class="text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
			Every register reporting into one screen.
		</h2>
		<p class="mt-4 text-[16px] leading-relaxed font-light text-ink/70">
			This is the screen the morning starts on. Programme at a glance holds each register as a
			tile, operational assessments, third parties, the ROPA, risks, incidents, subject rights and
			tasks, giving the counts a stack of spreadsheets would give you, except they are drawn from
			one estate rather than eight and they agree with each other. The line under the greeting is
			the one that matters on a Monday: how many items are overdue, and how many of those carry a
			statutory deadline. Scope it to your own work, your team's, or everything you can see.
		</p>
	</div>
	<figure class="mt-8 w-full sm:mt-10">
		<picture>
			<source srcset="/Images/screenshots/dashboard-screen.webp" type="image/webp" />
			<img
				src="/Images/screenshots/dashboard-screen.png"
				alt="The platform dashboard, showing overdue and upcoming item counts above a programme at a glance panel with tiles for assessments, third parties, ROPA, risk, incidents, subject rights, tasks and the operations centre."
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
			One record, every angle.
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
		title="One record, one answer. Bring a real example."
		body="Book a 25-minute demo and bring a processing activity that lives in more than one place. We will show you what it looks like as a single connected record."
	/>
</div>

<ProblemPager current="/conflicting-sources" />
