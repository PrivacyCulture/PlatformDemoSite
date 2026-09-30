<script lang="ts">
	import SeoHead from '$lib/components/site/SeoHead.svelte';
	import { metaKeywords } from '$lib/site/seo';
	import { pages, pageTitle } from '$lib/content';

	const copy = pages.cookieNotice;
	const labels = copy.cookieTableLabels;

	const linkClass =
		'text-lens underline decoration-lens/40 underline-offset-4 transition-colors duration-200 hover:decoration-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens';

	const isExternal = (href: string) => href.startsWith('http');

	/** Reopens the Cookiebot banner so a visitor can change or withdraw consent. */
	function changeConsent() {
		(window as unknown as { Cookiebot?: { renew: () => void } }).Cookiebot?.renew();
	}
</script>

<SeoHead
	title={pageTitle(copy.meta.title)}
	description={copy.meta.description}
	keywords={metaKeywords(copy.meta)}
/>

<div class="w-full pt-6 sm:pt-10">
	<header class="cn-doc-header max-w-[46rem]">
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
					<li><a href={link.href} class={linkClass}>{link.label}</a></li>
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

						{#if section.id === 'change-settings'}
							<div class="cn-actions mt-6">
								<button
									type="button"
									onclick={changeConsent}
									class="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-gold px-7 py-3 text-[14px] font-semibold tracking-wide text-gold-ink shadow-[0_0_0_1px_rgba(212,175,106,0.35),0_10px_24px_rgba(11,18,32,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e0c07a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
								>
									{copy.consentButtonLabel}
								</button>
							</div>
						{/if}

						{#if section.id === copy.cookieTableAfter}
							<div class="mt-6 space-y-8">
								{#each copy.cookieGroups as group (group.id)}
									<div id="cookies-{group.id}" class="scroll-mt-24">
										<h3 class="text-[12px] tracking-[0.16em] text-lens uppercase">{group.title}</h3>
										<ul class="mt-3 space-y-3">
											{#each group.cookies as cookie, c (c)}
												<li class="cn-cookie rounded-2xl border border-ink/10 bg-white/70 p-4 sm:p-5">
													<p class="font-mono text-[13px] font-semibold break-words text-ink/85">
														{cookie.name}
													</p>
													<p class="mt-2 text-[14px] leading-relaxed font-light text-ink/70">
														{cookie.purpose}
													</p>
													<dl class="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-3">
														<div>
															<dt class="text-[10px] tracking-[0.16em] text-ink/65 uppercase">{labels.provider}</dt>
															<dd class="mt-0.5 text-ink/80">{cookie.provider}</dd>
														</div>
														<div>
															<dt class="text-[10px] tracking-[0.16em] text-ink/65 uppercase">{labels.type}</dt>
															<dd class="mt-0.5 text-ink/80">{cookie.type}</dd>
														</div>
														<div>
															<dt class="text-[10px] tracking-[0.16em] text-ink/65 uppercase">{labels.duration}</dt>
															<dd class="mt-0.5 text-ink/80">{cookie.duration}</dd>
														</div>
													</dl>
													<p class="mt-3 text-[13px]">
														<a href={cookie.infoHref} class={linkClass} target="_blank" rel="noopener noreferrer">
															{labels.moreInfo}
														</a>
													</p>
												</li>
											{/each}
										</ul>
									</div>
								{/each}
							</div>
						{/if}
					</section>
				{/each}
			</div>

			<div class="cn-actions mt-10">
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
			class="cn-toc hidden lg:sticky lg:top-24 lg:block lg:border-l lg:border-ink/10 lg:pl-8"
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
	/* Printing yields a clean notice, not a screenshot of the site. */
	@media print {
		.cn-toc,
		.cn-actions,
		:global(.site-mountain),
		:global(.site-grain),
		:global(.site-shell header:not(.cn-doc-header)),
		:global(.site-shell footer) {
			display: none !important;
		}

		:global(.site-shell) {
			background: #fff;
		}

		:global(.site-shell h1),
		:global(.site-shell h2),
		:global(.site-shell h3),
		.cn-doc-header :global(p),
		article :global(p),
		article :global(dd),
		article :global(dt) {
			color: #000 !important;
		}

		.cn-cookie {
			break-inside: avoid;
		}
	}
</style>
