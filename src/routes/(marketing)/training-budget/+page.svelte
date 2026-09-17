<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import MountainScene from '$lib/components/site/MountainScene.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import ProblemPager from '$lib/components/site/ProblemPager.svelte';
	import { site } from '$lib/site/content';

	const functions = [
		{
			title: 'CultureLens sentiment',
			body: 'See where people believe they are strong, and where confidence is running ahead of the evidence.'
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
	<div class="w-full">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">In the platform</p>
		<h2 class="text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
			The teams that need more than a module.
		</h2>
		<p class="mt-4 text-[16px] leading-relaxed font-light text-ink/70">
			This is the culture hot spots grid. Every business function sits against every location, and
			each cell carries two numbers: the culture score in bold and the participation rate beneath
			it. Colour runs from green where the score holds up to red where it does not, so a team that
			looks fine on the company average stops looking fine here. Overlay any two metrics, including
			incidents and training hours, and the confidence slider drops cells with too few responses to
			trust. Empty rows and columns hide themselves, so you are reading signal rather than grid.
		</p>
	</div>
	<figure class="mt-8 w-full sm:mt-10">
		<picture>
			<source srcset="/Images/screenshots/culture-screen.webp" type="image/webp" />
			<img
				src="/Images/screenshots/culture-screen.png"
				alt="A colour-coded grid of culture scores and participation rates by business function and location, with metric tabs, a two-metric overlay and a confidence slider."
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
</MountainScene>

<MountainScene side="right" class="mt-16 sm:mt-24">
	<PricingStrip />
</MountainScene>

<div class="mt-10 w-full">
	<DemoCtaBlock
		title="Point the training budget where the risk actually is."
		body="Book a demo to see CultureLens sentiment set against operational risk markers, and where the blind spots sit in your business."
	/>
</div>

<ProblemPager current="/training-budget" />
