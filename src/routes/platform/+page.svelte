<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import ExplainerVideo from '$lib/components/site/ExplainerVideo.svelte';
	import MountainScene from '$lib/components/site/MountainScene.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import { site } from '$lib/site/content';
	import { problems } from '$lib/site/problems';

	let explainerOpen = $state(false);

	const pillars = [
		{
			title: 'Simple',
			body: 'No twelve-month rollout. Clear workflows, transparent pricing, no enterprise implementation programme.'
		},
		{
			title: 'Visual',
			body: "See your processing as a map, not a spreadsheet. The whole estate at a glance, a record's reach when needed."
		},
		{
			title: 'Federated',
			body: 'Owners in the business confirm their own records are right. You keep the central view.'
		}
	];
</script>

<svelte:head>
	<title>The Platform — {site.brand}</title>
	<meta
		name="description"
		content="The Privacy Culture Platform links the records and workflows that support day-to-day privacy operations. Start with the Visual ROPA View, then dive into operational detail when you need it."
	/>
</svelte:head>

<PageHero
	eyebrow="The Platform"
	title="Total visibility across your privacy estate."
	titleLines={['Total visibility', 'across your privacy estate.']}
	body="The Privacy Culture Platform links the records and workflows that support day-to-day privacy operations. Start with the big picture in the Visual ROPA View, then dive into operational detail when you need it."
	primary={{ label: 'Book a demo', href: site.demoHref }}
	secondary={{
		label: 'Watch the 2-minute overview',
		onSelect: () => (explainerOpen = true)
	}}
>
	<ExplainerVideo bind:open={explainerOpen} compact />
</PageHero>

<section class="mt-10 w-full sm:mt-16">
	<div class="rounded-3xl bg-silver/45 p-6 ring-1 ring-ink/5 sm:p-10">
		<div class="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
			<div class="min-w-0">
				<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">How it fits together</p>
				<h2
					class="max-w-[20ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight"
				>
					One live privacy estate.<br />Not five spreadsheets and a guess.
				</h2>
				<p class="mt-4 max-w-[52ch] text-[15px] leading-relaxed font-light text-ink/70">
					Bring the records and workflows you already keep, scattered across tools and tabs, into one
					place. The privacy team sees the whole estate, hands ownership out to the people who do
					the processing, and everyone works from the same picture.
				</p>
			</div>
			<div class="rounded-2xl bg-white p-4 sm:p-6 lg:p-8">
				<img
					class="aspect-video w-full object-contain"
					src="/Images/FromExcelToTeams.png"
					width="2048"
					height="1152"
					loading="lazy"
					decoding="async"
					alt="Scattered spreadsheets resolving into one connected privacy estate shared across teams"
				/>
			</div>
		</div>

		<ul class="mt-8 grid gap-4 sm:grid-cols-3 sm:mt-10">
			{#each pillars as pillar (pillar.title)}
				<li class="rounded-2xl bg-white/80 p-5 ring-1 ring-ink/5">
					<p class="flex items-center gap-2.5">
						<span class="size-2.5 shrink-0 bg-gold" aria-hidden="true"></span>
						<span class="text-[1.05rem] font-bold tracking-tight text-heading">{pillar.title}</span>
					</p>
					<p class="mt-3 text-[14px] leading-relaxed font-light text-ink/70">{pillar.body}</p>
				</li>
			{/each}
		</ul>
	</div>
</section>

<MountainScene side="left" class="mt-16 sm:mt-24">
	<section class="w-full">
			<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Problems this solves</p>
			<h2
				class="max-w-[22ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight"
			>
				Clarity where the work actually breaks.
			</h2>

			<ul class="mt-10 grid border-t border-ink/10 sm:grid-cols-2 sm:gap-x-10 lg:gap-x-16">
				{#each problems as item, i (item.href)}
					<li class="border-b border-ink/10">
						<a
							href={item.href}
							class="group flex h-full cursor-pointer items-baseline gap-4 py-5 no-underline transition-colors hover:bg-ink/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
						>
							<span
								class="font-mono text-[10px] tracking-[0.18em] text-gold tabular-nums transition-colors group-hover:text-lens"
								aria-hidden="true"
							>
								{String(i + 1).padStart(2, '0')}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block text-[1.05rem] font-bold tracking-tight text-heading transition-colors group-hover:text-lens">
									{item.title}
								</span>
								<span class="mt-1.5 block max-w-[40ch] text-[14px] leading-relaxed font-light text-ink/70">
									{item.body}
								</span>
							</span>
							<span
								class="shrink-0 text-ink/35 transition-transform group-hover:translate-x-1 group-hover:text-lens"
								aria-hidden="true">→</span
							>
						</a>
					</li>
				{/each}
			</ul>
	</section>
</MountainScene>

<MountainScene side="right" class="mt-16 sm:mt-24">
	<PricingStrip />
</MountainScene>

<div class="mt-10 w-full">
	<DemoCtaBlock />
</div>

