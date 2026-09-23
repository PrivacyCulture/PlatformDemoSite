<script lang="ts">
	import GoldCta from '$lib/components/site/GoldCta.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import TrustSnapshot from '$lib/components/site/TrustSnapshot.svelte';
	import { pages, pageTitle } from '$lib/content';

	const copy = pages.trust;
	const pillars = copy.pillars;
</script>

<svelte:head>
	<title>{pageTitle(copy.meta.title)}</title>
	<meta name="description" content={copy.meta.description} />
</svelte:head>

<PageHero
	eyebrow={copy.hero.eyebrow}
	title={copy.hero.title}
	body={copy.hero.body}
	primary={copy.hero.primary}
	secondary={copy.hero.secondary}
/>

<section class="mt-14 w-full sm:mt-20">
	<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">{copy.pillarsEyebrow}</p>
	<ul class="grid gap-4 sm:grid-cols-2">
		{#each pillars as item, i (item.id)}
			<li
				id={item.id}
				class="scroll-mt-24 rounded-2xl border border-lens/50 bg-transparent p-5"
			>
				<p class="font-mono text-[10px] tracking-[0.18em] text-gold tabular-nums">
					{String(i + 1).padStart(2, '0')}
				</p>
				<h2 class="mt-2 text-[1.15rem] leading-snug font-bold tracking-tight">{item.title}</h2>
				<p class="mt-2 text-[14px] leading-relaxed font-light text-ink/70">{item.body}</p>
			</li>
		{/each}
	</ul>
</section>

<section class="mt-16 w-full sm:mt-24">
	<TrustSnapshot />
	<div class="mt-6 flex flex-wrap gap-3">
		<GoldCta href={copy.ctas.dpa.href} label={copy.ctas.dpa.label} />
	</div>
</section>
