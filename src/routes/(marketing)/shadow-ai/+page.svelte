<script lang="ts">
	import AiInventory from '$lib/components/site/AiInventory.svelte';
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import MountainScene from '$lib/components/site/MountainScene.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import ProblemPager from '$lib/components/site/ProblemPager.svelte';
	import { site } from '$lib/site/content';

	const functions = [
		{
			title: 'An AI tool register',
			body: 'A dedicated register of AI tools, models and their vendors, each tied to the activity it serves and the personal data it processes.'
		},
		{
			title: 'Intake that fits how teams work',
			body: 'A short, plain-English intake that owners will actually complete, routed to privacy for review before the tool goes live.'
		},
		{
			title: 'Risk flags that follow the tool',
			body: 'Training on personal data, third-country transfers and automated decisions are flagged on the record, ready for the DPIA.'
		}
	];
</script>

<svelte:head>
	<title>Shadow AI — {site.brand}</title>
	<meta
		name="description"
		content="Find every AI tool in use across the business, tie it to a processing record and govern it before it ships, not after."
	/>
</svelte:head>

<PageHero
	eyebrow="Problem"
	title="How many AI tools is your business using that privacy has never seen?"
	body="Teams adopt assistants, transcription tools and copilots faster than any intake form can catch them. Surface every AI tool in use, record what data it touches and attach it to a processing activity, so it is governed before it ships rather than discovered after."
	primary={{ label: 'Book a demo', href: site.demoHref }}
	secondary={{ label: 'See the platform', href: '/platform' }}
	micro={site.pricing.micro}
/>

<section class="mt-14 w-full sm:mt-20">
	<AiInventory />
</section>

<MountainScene side="left" class="mt-16 sm:mt-24">
	<section class="w-full">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Functionality</p>
		<h2 class="max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
			Governed before it ships.
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
		title="Find the AI tools nobody told privacy about."
		body="Book a demo to see the AI register, the intake teams will actually complete, and the risk flags that carry through to the DPIA."
	/>
</div>

<ProblemPager current="/shadow-ai" />
