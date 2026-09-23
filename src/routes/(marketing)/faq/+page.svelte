<script lang="ts">
	import { page } from '$app/state';
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import FaqAccordion from '$lib/components/site/FaqAccordion.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import { jsonLdScript } from '$lib/site/aeo';
	import { pages, pageTitle, site } from '$lib/content';
	import { plain } from '$lib/site/rich';

	const copy = pages.faq;

	// Every answer on this page is public, so publish it as a FAQPage graph too.
	const schema = $derived({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		'@id': `${page.url.origin}/faq#faq`,
		url: `${page.url.origin}/faq`,
		name: copy.meta.title,
		description: copy.meta.description,
		inLanguage: 'en-GB',
		mainEntity: copy.items.map((item) => ({
			'@type': 'Question',
			name: plain(item.q),
			acceptedAnswer: { '@type': 'Answer', text: plain(item.a) }
		}))
	});
</script>

<svelte:head>
	<title>{pageTitle(copy.meta.title)}</title>
	<meta name="description" content={copy.meta.description} />
	<link rel="canonical" href="{page.url.origin}/faq" />
	{@html jsonLdScript(schema)}
</svelte:head>

<PageHero eyebrow={copy.eyebrow} title={copy.title} body={copy.intro} />

<section
	class="mt-14 w-full sm:mt-20 lg:grid lg:grid-cols-[minmax(0,44rem)_minmax(0,1fr)] lg:items-start lg:gap-12"
	aria-labelledby="faq-heading"
>
	<div class="min-w-0">
		<div class="mb-4 flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3">
			<h2 id="faq-heading" class="text-[1.05rem] font-bold tracking-tight">
				{copy.eyebrow}
			</h2>
			<p class="font-mono text-[11px] tracking-[0.16em] text-ink/65 tabular-nums uppercase">
				{String(copy.items.length).padStart(2, '0')}
				{copy.countLabel}
			</p>
		</div>

		<FaqAccordion headingLevel="h3" />
	</div>

	<!-- The escalation path, parked beside the questions instead of trailing under them. -->
	<aside class="mt-10 rounded-2xl border border-lens/40 bg-white/70 p-5 lg:sticky lg:top-24 lg:mt-0">
		<h2 class="text-[12px] tracking-[0.16em] text-heading uppercase">{copy.securityPack.lead}</h2>
		<ul class="mt-4 space-y-2">
			<li>
				<a
					href={copy.securityPack.trustHref}
					class="inline-flex min-h-11 items-center text-[14px] font-medium text-horizon no-underline underline-offset-4 transition-colors duration-200 hover:text-lens hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					{copy.securityPack.trustLabel}
				</a>
			</li>
			<li>
				<a
					href={copy.securityPack.demoHref}
					class="inline-flex min-h-11 items-center text-[14px] font-medium text-horizon no-underline underline-offset-4 transition-colors duration-200 hover:text-lens hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					{site.nav.demo.label}
				</a>
			</li>
		</ul>
	</aside>
</section>

<section class="mt-16 w-full sm:mt-24">
	<DemoCtaBlock
		eyebrow={copy.cta.eyebrow}
		title={copy.cta.title}
		body={copy.cta.body}
		micro={copy.cta.micro}
	/>
</section>
