<script lang="ts">
	/**
	 * One of the ten problem pages. Every string and image on the page is read
	 * from the site content (`$lib/content`) under `problems`; the route file only
	 * names which entry to render.
	 */
	import AuditChecklist from './AuditChecklist.svelte';
	import DemoCtaBlock from './DemoCtaBlock.svelte';
	import PageHero from './PageHero.svelte';
	import MountainScene from './MountainScene.svelte';
	import PricingStrip from './PricingStrip.svelte';
	import ProblemPager from './ProblemPager.svelte';
	import { pageTitle } from '$lib/content';
	import { site } from '$lib/site/content';
	import { problemByHref, problemCommon } from '$lib/site/problems';

	let { href }: { href: string } = $props();

	const page = $derived(problemByHref(href));
	const common = problemCommon;
</script>

<svelte:head>
	<title>{pageTitle(page.meta.title)}</title>
	<meta name="description" content={page.meta.description} />
</svelte:head>

<PageHero
	eyebrow={common.eyebrow}
	title={page.hero.title}
	body={page.hero.body}
	primary={common.primary}
	secondary={common.secondary}
	micro={site.pricing.micro}
/>

{#if page.quote}
	<blockquote
		class="mt-12 max-w-4xl border-l-2 border-gold pl-5 text-[clamp(1.2rem,2.4vw,1.55rem)] leading-snug font-bold tracking-tight"
	>
		{page.quote}
	</blockquote>
{/if}

{#if page.inPlatform}
	<section class="mt-14 w-full sm:mt-20">
		<div class="w-full">
			<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{common.inPlatformEyebrow}</p>
			<h2 class="text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
				{page.inPlatform.title}
			</h2>
			<p class="mt-4 text-[16px] leading-relaxed font-light text-ink/70">
				{page.inPlatform.body}
			</p>
		</div>
		<figure class="mt-8 w-full sm:mt-10">
			<picture>
				{#if page.inPlatform.image.webp}
					<source srcset={page.inPlatform.image.webp} type="image/webp" />
				{/if}
				<img
					src={page.inPlatform.image.src}
					alt={page.inPlatform.image.alt}
					width={page.inPlatform.image.width}
					height={page.inPlatform.image.height}
					class="block h-auto w-full drop-shadow-[0_24px_60px_rgba(11,18,32,0.14)]"
					loading="lazy"
					decoding="async"
				/>
			</picture>
		</figure>
	</section>
{:else if page.panel === 'auditChecklist'}
	<section class="mt-14 w-full sm:mt-20">
		<AuditChecklist />
	</section>
{/if}

<MountainScene side="left" class="mt-16 sm:mt-24">
	<section class="w-full">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">{common.functionalityEyebrow}</p>
		<h2 class="max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
			{page.functionality.title}
		</h2>
		<ul class="mt-8 grid gap-4 sm:grid-cols-3">
			{#each page.functionality.items as item, i (item.title)}
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
	<DemoCtaBlock title={page.cta.title} body={page.cta.body} />
</div>

<ProblemPager current={page.href} />
