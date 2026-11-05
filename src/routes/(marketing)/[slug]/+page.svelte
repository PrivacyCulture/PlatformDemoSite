<!--
	A page created in the CMS (Sorted → Website → Platform → New page). Its shape is fixed:
	a heading, an introduction, numbered sections and the house demo call to action. A section is
	made from a template; a text section keeps the numbered form below, every other template is
	drawn by AddedSection exactly as it is on any other page.

	THE RULE, shared with Sorted's registry (`CUSTOM_PAGE_HTML` in platform-documents.ts): only
	the fields rendered here through rich() may carry inline markup — intro, each section's body,
	and the CTA's body and micro line. Every other string is plain text.
-->
<script lang="ts">
	import SeoHead from '$lib/components/site/SeoHead.svelte';
	import AddedSection from '$lib/components/site/AddedSection.svelte';
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import { pageTitle } from '$lib/content';
	import { rich, plain } from '$lib/site/rich';
	import ExplainerVideo from '$lib/components/site/ExplainerVideo.svelte';
	import HeroDemoForm from '$lib/components/site/HeroDemoForm.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import { explainerFor } from '$lib/site/explainer';
	import { explainerVideoNode } from '$lib/site/aeo';
	import { page as route } from '$app/state';

	import ProblemPage from '$lib/components/site/ProblemPage.svelte';
	import PlatformPage from '$lib/components/site/pages/PlatformPage.svelte';
	import FaqPage from '$lib/components/site/pages/FaqPage.svelte';
	import PricingPage from '$lib/components/site/pages/PricingPage.svelte';
	import TrustPage from '$lib/components/site/pages/TrustPage.svelte';
	import DpaPage from '$lib/components/site/pages/DpaPage.svelte';
	import CookieNoticePage from '$lib/components/site/pages/CookieNoticePage.svelte';
	import PrivacyPolicyPage from '$lib/components/site/pages/PrivacyPolicyPage.svelte';
	import { pages } from '$lib/content';
	import { withDefaults } from '$lib/site/page-copies';

	let { data } = $props();
	// A problem page created in the page builder is drawn by the same component as the ten built in.
	const page = $derived(data.page!);
	// The page's own main image — the first section carrying one — is its link-preview picture.
	const firstImage = $derived(
		page.sections
			.map((s) => ('image' in s ? (s.image as { src?: string; width?: number; height?: number; alt?: string } | undefined) : undefined))
			.find((img) => !!img?.src) ?? null
	);
	const sections = $derived(page.sections.filter((s) => s.template !== 'text' || s.title.trim() || s.body.trim()));
	// Only the page's OWN film (or thumbnail): a page made in the CMS never shows the default video.
	const showExplainer = $derived(!!(page.explainer?.src?.trim() || page.explainer?.poster?.trim()));
	const explainer = $derived(explainerFor(page));
	// The Book a demo form beside the copy, switched on in Sorted: the hero splits, text left and
	// form right. The page's own explainer, if it has one, stays under the hero as before.
	const demoFormBeside = $derived(page.sharedElement === 'demo-form');
	const videoNode = $derived(
		showExplainer && !explainer.image ? explainerVideoNode(route.url.origin, route.url.pathname, explainer, route.data?.videoTranscript) : null
	);
</script>

{#if data.problemHref}
	<ProblemPage href={data.problemHref} />
{:else if page.pageKind === 'platform'}
	<!-- A copy of a one-of-a-kind page, drawn by that page's own component from its own content. -->
	<PlatformPage copy={withDefaults(pages.platform, page.content)} />
{:else if page.pageKind === 'faq'}
	<FaqPage copy={withDefaults(pages.faq, page.content)} />
{:else if page.pageKind === 'pricing'}
	<PricingPage copy={withDefaults(pages.pricing, page.content)} />
{:else if page.pageKind === 'trust'}
	<TrustPage copy={withDefaults(pages.trust, page.content)} />
{:else if page.pageKind === 'dpa'}
	<DpaPage copy={withDefaults(pages.dpa, page.content)} />
{:else if page.pageKind === 'cookie-notice'}
	<CookieNoticePage copy={withDefaults(pages.cookieNotice, page.content)} />
{:else if page.pageKind === 'privacy-policy'}
	<PrivacyPolicyPage copy={withDefaults(pages.privacyPolicy, page.content)} />
{:else}

<SeoHead
	title={pageTitle(plain(page.meta.title || page.title))}
	description={page.meta.description}
	keywords={page.meta.keywords}
	image={firstImage?.src}
	imageWidth={firstImage?.width}
	imageHeight={firstImage?.height}
	imageAlt={firstImage?.alt}
	heading={plain(page.title)}
	schema={videoNode ? [videoNode] : undefined}
/>

<div class={['w-full', !demoFormBeside && 'pt-6 sm:pt-10']}>
	{#if demoFormBeside}
		<div data-block-id="hero" style="display: contents">
			<PageHero eyebrow={page.eyebrow || undefined} title={page.title} body={page.intro} logos={false}>
				<HeroDemoForm />
			</PageHero>
		</div>
	{:else}
	<header class="max-w-[46rem]" data-block-id="hero">
		{#if page.eyebrow}
			<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{page.eyebrow}</p>
		{/if}
		<h1 class="text-[clamp(2rem,5vw,3.4rem)] leading-[1.04] font-bold tracking-tight">{page.title}</h1>
		{#if page.intro}
			<p class="mt-6 max-w-[62ch] text-[17px] leading-relaxed font-light text-ink/70">{@html rich(page.intro)}</p>
		{/if}
	</header>
	{/if}

	{#if showExplainer}
		<section class="mt-10 max-w-[52rem]" data-block-id="explainer">
			<ExplainerVideo compact {...explainer} />
		</section>
	{/if}

	{#if sections.length}
		<div class="mt-12 max-w-[44rem] space-y-10">
			<!-- Keyed by position, not id: the committed fallback file is never validated, and a
			     repeated key would throw during hydration and take the site's router down. -->
			{#each sections as section, i (i)}
				{#if section.template !== 'text'}
					<AddedSection {section} class="!mt-0" />
				{:else}
				<section id={section.id} data-block-id={section.id} class="scroll-mt-24 border-t border-ink/10 pt-6">
					<p class="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-ink/65 tabular-nums">
						<span aria-hidden="true" class="h-px w-5 bg-gold"></span>
						{String(i + 1).padStart(2, '0')}
					</p>
					{#if section.title}
						<h2 class="mt-2 text-[1.25rem] leading-snug font-bold tracking-tight">{section.title}</h2>
					{/if}
					{#if section.body}
						<p class="mt-3 max-w-[62ch] text-[15px] leading-relaxed font-light whitespace-pre-line text-ink/70">
							{@html rich(section.body)}
						</p>
					{/if}
				</section>
				{/if}
			{/each}
		</div>
	{/if}

	{#if page.showCta !== false}
		<section class="mt-16 sm:mt-24" data-block-id="cta">
			<DemoCtaBlock
				eyebrow={page.cta.eyebrow || undefined}
				title={page.cta.title || undefined}
				body={page.cta.body || undefined}
				micro={page.cta.micro || undefined}
			/>
		</section>
	{/if}
</div>
{/if}
