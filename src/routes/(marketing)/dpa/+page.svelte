<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import { pages, pageTitle } from '$lib/content';

	const copy = pages.dpa;
	const glanceId = 'at-a-glance';
</script>

<svelte:head>
	<title>{pageTitle(copy.meta.title)}</title>
	<meta name="description" content={copy.meta.description} />
</svelte:head>

<div class="w-full pt-6 sm:pt-10">
	<p class="dpa-back mb-6">
		<a
			href={copy.backHref}
			class="inline-flex min-h-11 items-center text-[13px] tracking-wide text-ink/60 no-underline transition-colors duration-200 hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
		>
			{copy.backLabel}
		</a>
	</p>

	<header class="dpa-doc-header max-w-[46rem]">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{copy.eyebrow}</p>
		<h1 class="text-[clamp(2rem,5vw,3.4rem)] leading-[1.04] font-bold tracking-tight">
			{copy.title}
		</h1>
		<p class="mt-4 text-[13px] font-light text-ink/60">{copy.dateline}</p>
	</header>

	<div class="mt-10 lg:grid lg:grid-cols-[minmax(0,44rem)_minmax(0,1fr)] lg:items-start lg:gap-12">
		<article class="min-w-0">
			<!-- The four facts a reviewer is actually looking for, before the prose. -->
			<section
				id={glanceId}
				class="scroll-mt-24 rounded-2xl border border-lens/40 bg-white/70 p-5 sm:p-6"
				aria-labelledby="{glanceId}-title"
			>
				<h2
					id="{glanceId}-title"
					class="text-[12px] tracking-[0.16em] text-lens uppercase"
				>
					{copy.keyFactsTitle}
				</h2>
				<dl class="mt-4 divide-y divide-ink/10">
					{#each copy.keyFacts as fact (fact.label)}
						<div class="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
							<dt class="text-[11px] tracking-[0.16em] text-ink/65 uppercase">{fact.label}</dt>
							<dd class="text-[14px] leading-relaxed font-medium text-ink/80">{fact.value}</dd>
						</div>
					{/each}
				</dl>
			</section>

			<p class="mt-8 max-w-[62ch] text-[16px] leading-relaxed font-light text-ink/70">
				{copy.intro}
			</p>

			<div class="mt-10 space-y-10">
				{#each copy.sections as section, i (section.id)}
					<section id={section.id} class="scroll-mt-24 border-t border-ink/10 pt-6">
						<p class="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-ink/65 tabular-nums">
							<span aria-hidden="true" class="h-px w-5 bg-gold"></span>
							{String(i + 1).padStart(2, '0')}
						</p>
						<h2 class="mt-2 text-[1.25rem] leading-snug font-bold tracking-tight">
							{section.title}
						</h2>
						<p class="mt-3 max-w-[62ch] text-[15px] leading-relaxed font-light text-ink/70">
							{section.body}
						</p>
					</section>
				{/each}
			</div>

			<div class="dpa-actions mt-10">
				<button
					type="button"
					onclick={() => window.print()}
					class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-[14px] font-semibold tracking-wide text-gold-ink shadow-[0_0_0_1px_rgba(212,175,106,0.35),0_10px_24px_rgba(11,18,32,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e0c07a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
				>
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
						<path d="M6 14h12v8H6z" />
					</svg>
					{copy.printLabel}
				</button>
			</div>
		</article>

		<nav
			class="dpa-toc hidden lg:sticky lg:top-24 lg:block lg:border-l lg:border-ink/10 lg:pl-8"
			aria-label={copy.contentsLabel}
		>
			<p class="text-[11px] tracking-[0.18em] text-ink/65 uppercase">{copy.contentsLabel}</p>
			<ul class="mt-3 space-y-1">
				<li>
					<a
						href="#{glanceId}"
						class="block py-2 text-[14px] text-ink/70 no-underline transition-colors duration-200 hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
					>
						{copy.keyFactsTitle}
					</a>
				</li>
				{#each copy.sections as section (section.id)}
					<li>
						<a
							href="#{section.id}"
							class="block py-2 text-[14px] text-ink/70 no-underline transition-colors duration-200 hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
						>
							{section.title}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</div>

	<section class="dpa-cta mt-16 sm:mt-24">
		<DemoCtaBlock
			eyebrow={copy.cta?.eyebrow || undefined}
			title={copy.cta?.title || undefined}
			body={copy.cta?.body || undefined}
			micro={copy.cta?.micro || undefined}
		/>
	</section>
</div>

<style>
	/* "Print or save as PDF" has to yield a clean terms document, not a screenshot
	   of the site: the mountain, chrome and calls to action all drop out. */
	@media print {
		.dpa-back,
		.dpa-toc,
		.dpa-actions,
		.dpa-cta,
		:global(.site-mountain),
		:global(.site-grain),
		:global(.site-shell header:not(.dpa-doc-header)),
		:global(.site-shell footer) {
			display: none !important;
		}

		:global(.site-shell) {
			background: #fff;
		}

		:global(.site-shell h1),
		:global(.site-shell h2) {
			color: #000 !important;
		}

		.dpa-doc-header {
			margin-bottom: 1.5rem;
		}

		.dpa-doc-header :global(p) {
			color: #000 !important;
		}

		article :global(p),
		article :global(dd),
		article :global(dt) {
			color: #000 !important;
		}

		section {
			break-inside: avoid;
		}
	}
</style>
