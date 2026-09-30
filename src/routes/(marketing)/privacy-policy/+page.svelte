<script lang="ts">
	import SeoHead from '$lib/components/site/SeoHead.svelte';
	import { metaKeywords } from '$lib/site/seo';
	import { pages, pageTitle } from '$lib/content';

	// Same document shape as the cookie notice (intro, numbered sections of paragraphs, terms
	// and links), so the two legal pages read alike and are edited alike in the CMS.
	const copy = pages.privacyPolicy;

	const linkClass =
		'text-lens underline decoration-lens/40 underline-offset-4 transition-colors duration-200 hover:decoration-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens';

	const isExternal = (href: string) => href.startsWith('http');
</script>

<SeoHead
	title={pageTitle(copy.meta.title)}
	description={copy.meta.description}
	keywords={metaKeywords(copy.meta)}
/>

<div class="w-full pt-6 sm:pt-10">
	<header class="pp-doc-header max-w-[46rem]">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{copy.eyebrow}</p>
		<h1 class="text-[clamp(2rem,5vw,3.4rem)] leading-[1.04] font-bold tracking-tight">
			{copy.title}
		</h1>
		<p class="mt-4 text-[13px] font-light text-ink/60">{copy.dateline}</p>
	</header>

	<div class="mt-10 lg:grid lg:grid-cols-[minmax(0,44rem)_minmax(0,1fr)] lg:items-start lg:gap-12">
		<article class="min-w-0">
			{#each copy.intro as paragraph, p (p)}
				<p class="mt-4 max-w-[62ch] text-[16px] leading-relaxed font-light text-ink/70 first:mt-0">
					{paragraph}
				</p>
			{/each}
			<ul class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
				{#each copy.introLinks as link, l (l)}
					<li>
						<a
							href={link.href}
							class={linkClass}
							target={isExternal(link.href) ? '_blank' : undefined}
							rel={isExternal(link.href) ? 'noopener noreferrer' : undefined}
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>

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
						{#each section.paragraphs as paragraph, p (p)}
							<p class="mt-3 max-w-[62ch] text-[15px] leading-relaxed font-light text-ink/70">
								{paragraph}
							</p>
						{/each}

						{#if section.items.length}
							<dl class="mt-4 max-w-[62ch] space-y-3">
								{#each section.items as item, t (t)}
									<div class="border-l-2 border-lens/40 pl-4">
										<dt class="text-[14px] font-semibold text-ink/85">{item.term}</dt>
										<dd class="mt-1 text-[15px] leading-relaxed font-light text-ink/70">{item.body}</dd>
									</div>
								{/each}
							</dl>
						{/if}

						{#if section.links.length}
							<ul class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
								{#each section.links as link, l (l)}
									<li>
										<a
											href={link.href}
											class={linkClass}
											target={isExternal(link.href) ? '_blank' : undefined}
											rel={isExternal(link.href) ? 'noopener noreferrer' : undefined}
										>
											{link.label}
										</a>
									</li>
								{/each}
							</ul>
						{/if}
					</section>
				{/each}
			</div>

			<div class="pp-actions mt-10">
				<button
					type="button"
					onclick={() => window.print()}
					class="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-ink/20 px-7 py-3 text-[14px] font-semibold tracking-wide text-ink/80 transition-colors duration-200 hover:border-lens hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					{copy.printLabel}
				</button>
			</div>
		</article>

		<nav
			class="pp-toc hidden lg:sticky lg:top-24 lg:block lg:border-l lg:border-ink/10 lg:pl-8"
			aria-label={copy.contentsLabel}
		>
			<p class="text-[11px] tracking-[0.18em] text-ink/65 uppercase">{copy.contentsLabel}</p>
			<ul class="mt-3 space-y-1">
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
</div>

<style>
	/* Printing yields a clean policy, not a screenshot of the site. */
	@media print {
		.pp-toc,
		.pp-actions,
		:global(.site-mountain),
		:global(.site-grain),
		:global(.site-shell header:not(.pp-doc-header)),
		:global(.site-shell footer) {
			display: none !important;
		}

		:global(.site-shell) {
			background: #fff;
		}

		:global(.site-shell h1),
		:global(.site-shell h2),
		.pp-doc-header :global(p),
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
