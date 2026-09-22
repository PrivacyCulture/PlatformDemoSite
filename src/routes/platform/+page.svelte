<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import ExplainerVideo from '$lib/components/site/ExplainerVideo.svelte';
	import MountainScene from '$lib/components/site/MountainScene.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import { pages, pageTitle } from '$lib/content';
	import { problems } from '$lib/site/problems';

	const copy = pages.platform;

	let explainerOpen = $state(false);
</script>

<svelte:head>
	<title>{pageTitle(copy.meta.title)}</title>
	<meta name="description" content={copy.meta.description} />
</svelte:head>

<PageHero
	eyebrow={copy.hero.eyebrow}
	title={copy.hero.title}
	titleLines={copy.hero.titleLines}
	body={copy.hero.body}
	primary={copy.hero.primary}
	secondary={{
		label: copy.hero.secondary.label,
		onSelect: () => (explainerOpen = true)
	}}
>
	<ExplainerVideo bind:open={explainerOpen} compact />
</PageHero>

<section class="mt-10 w-full sm:mt-16">
	<div class="rounded-3xl bg-silver/45 p-6 ring-1 ring-ink/5 sm:p-10">
		<div class="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
			<div class="min-w-0">
				<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{copy.fit.eyebrow}</p>
				<h2
					class="max-w-[20ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight"
				>
					{#each copy.fit.titleLines as line, i (line)}
						{#if i > 0}<br />{/if}{line}
					{/each}
				</h2>
				<p class="mt-4 max-w-[52ch] text-[15px] leading-relaxed font-light text-ink/70">
					{copy.fit.body}
				</p>
			</div>
			<div class="rounded-2xl bg-white p-4 sm:p-6 lg:p-8">
				<img
					class="aspect-video w-full object-contain"
					src={copy.fit.image.src}
					width={copy.fit.image.width}
					height={copy.fit.image.height}
					loading="lazy"
					decoding="async"
					alt={copy.fit.image.alt}
				/>
			</div>
		</div>

		<ul class="mt-8 grid gap-4 sm:grid-cols-3 sm:mt-10">
			{#each copy.fit.pillars as pillar (pillar.title)}
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
			<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">{copy.problems.eyebrow}</p>
			<h2
				class="max-w-[22ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight"
			>
				{copy.problems.title}
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
									{item.summary}
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
