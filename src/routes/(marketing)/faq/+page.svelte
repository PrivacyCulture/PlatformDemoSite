<script lang="ts">
	import SeoHead from '$lib/components/site/SeoHead.svelte';
	import { metaKeywords } from '$lib/site/seo';
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import FaqAccordion from '$lib/components/site/FaqAccordion.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import { faqNode, FAQ_ID } from '$lib/site/aeo';
	import { pages, pageTitle, site } from '$lib/content';
	import { page } from '$app/state';
	import { faqLayout } from '$lib/site/page-layout';
	import AddedSection from '$lib/components/site/AddedSection.svelte';

	const copy = pages.faq;
	// The questions, the call to action and any sections added in the CMS, in the order set there.
	const entries = $derived(faqLayout(copy));

	// Every answer on this page is public, so publish it as a FAQPage graph too — the one page
	// that does; Google's rule is to mark up one instance of a repeated FAQ, and the home drawer
	// shows the same questions.
	const faq = $derived(faqNode(page.url.origin, page.url.pathname));
</script>

<SeoHead
	title={pageTitle(copy.meta.title)}
	description={copy.meta.description}
	keywords={metaKeywords(copy.meta)}
	schema={[faq]}
	mainEntityId={FAQ_ID(page.url.origin, page.url.pathname)}
/>

<PageHero eyebrow={copy.eyebrow} title={copy.title} body={copy.intro} />

{#snippet questionsBlock()}
	<section
		class="mt-14 w-full sm:mt-20 lg:grid lg:grid-cols-[minmax(0,44rem)_minmax(0,1fr)] lg:items-start lg:gap-12"
		aria-labelledby="faq-heading"
	>
		<div class="min-w-0">
			<!-- No rule of its own: the accordion's top border sits directly under this row. -->
		<div class="flex items-baseline justify-between gap-4 pb-3">
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
{/snippet}

{#snippet ctaBlock()}
	<section class="mt-16 w-full sm:mt-24">
		<DemoCtaBlock
			eyebrow={copy.cta?.eyebrow || undefined}
			title={copy.cta?.title || undefined}
			body={copy.cta?.body || undefined}
			micro={copy.cta?.micro || undefined}
		/>
	</section>
{/snippet}

{#each entries as entry (entry.id)}
	{#if entry.kind === 'section'}<AddedSection section={entry.section} />
	{:else if entry.id === 'questions'}{@render questionsBlock()}
	{:else if entry.id === 'cta'}{@render ctaBlock()}
	{/if}
{/each}
