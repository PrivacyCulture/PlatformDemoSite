<!--
	One article. The body is article HTML — Sorted cleaned it to a fixed grammar on save, and it is
	cleaned AGAIN here by renderArticleHtml (via withHeadingIds) before it reaches {@html}: the
	site renders nothing it has not checked itself, whoever sent it.

	Its own words come from the post; the labels around it (On this page, Keep reading, …) from
	pages.blog.article, edited in Sorted.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { SIZES, imageSize, responsive, responsiveArticleImages } from '$lib/site/images';
	import SeoHead from '$lib/components/site/SeoHead.svelte';
	import GoldCta from '$lib/components/site/GoldCta.svelte';
	import BlogCard from '$lib/components/site/blog/BlogCard.svelte';
	import ShareButtons from '$lib/components/site/blog/ShareButtons.svelte';
	import { pages, pageTitle, site } from '$lib/content';
	import { problems } from '$lib/site/problems';
	import { rich, plain } from '$lib/site/rich';
	import { headingsOf, withHeadingIds } from '$lib/site/article-html';
	import { decorateArticleHtml, formatPostDate, postEyebrow, readTimeLabel, tagSlug } from '$lib/site/blog';
	import { blogPostingNode, faqPageNode, keyTakeawaysNode, ARTICLE_ID } from '$lib/site/schema';
	// The body's stylesheet is shared byte for byte with Sorted's preview (both suites assert its
	// SHA), so what an editor previews is what this page draws.
	import '$lib/site/article-body.css';

	let { data } = $props();
	const copy = pages.blog;
	const post = $derived(data.post);
	const eyebrow = $derived(postEyebrow(post, problems));
	const body = $derived(responsiveArticleImages(decorateArticleHtml(withHeadingIds(post.body)), SIZES.article, post.imageSizes));
	const headings = $derived(headingsOf(post.body));
	const initials = $derived(
		(post.author.name || site.shortName || 'PC')
			.split(/\s+/)
			.map((w) => w[0] ?? '')
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);
	const url = $derived(`${page.url.origin}/blog/${post.slug}`);
	const description = $derived(post.meta.description || post.excerpt);
	const schema = $derived([
		blogPostingNode({
			origin: page.url.origin,
			pathname: page.url.pathname,
			headline: plain(post.title),
			description: plain(description),
			image: post.image.src || undefined,
			imageWidth: post.image.width,
			imageHeight: post.image.height,
			datePublished: post.publishedAt,
			dateModified: post.updatedAt,
			authorName: post.author.name,
			authorRole: post.author.role,
			keywords: post.tags,
			section: data.challenge?.title,
			wordCount: post.wordCount,
			takeaways: post.takeaways.map(plain),
			hasFaq: post.questions.length > 0
		}),
		// The key takeaways the page draws above the article, as a list about the article.
		keyTakeawaysNode(
			{ origin: page.url.origin, pathname: page.url.pathname, name: plain(copy.article.takeaways) || 'Key takeaways', items: post.takeaways.map(plain) },
			ARTICLE_ID(page.url.origin, page.url.pathname)
		),
		// Only when the article itself draws the questions — every answer here is on the page.
		post.questions.length
			? faqPageNode({
					origin: page.url.origin,
					pathname: page.url.pathname,
					name: plain(post.title),
					description: plain(description),
					items: post.questions.map((q) => ({ question: plain(q.q), answer: plain(q.a) }))
				})
			: null
	]);
</script>

<SeoHead
	title={pageTitle(plain(post.meta.title || post.title))}
	{description}
	keywords={post.meta.keywords || post.tags.join(', ')}
	image={post.image.src || null}
	imageWidth={post.image.width || null}
	imageHeight={post.image.height || null}
	imageAlt={post.image.alt || null}
	parents={[{ name: plain(copy.meta.title) || 'Blog', href: '/blog' }]}
	heading={plain(post.title)}
	mainEntityId={ARTICLE_ID(page.url.origin, page.url.pathname)}
	{schema}
	ogType="article"
	article={{ publishedTime: post.publishedAt, modifiedTime: post.updatedAt, author: post.author.name, section: data.challenge?.title, tags: post.tags }}
/>

<article class="w-full pt-6 sm:pt-10" aria-labelledby="article-title">
	<header class="max-w-[50rem]">
		<nav aria-label="Breadcrumb" class="mb-5 text-[13px] text-ink/55">
			<a href="/blog" class="text-horizon underline underline-offset-4 hover:text-lens">{plain(copy.meta.title) || 'Blog'}</a>
			<span aria-hidden="true" class="mx-2">/</span>
			<span aria-current="page">{eyebrow || post.title}</span>
		</nav>
		<!-- The label, the read time and the date on one line above the title, as the design has it.
		     The read time is worked out from the page's words when the content is loaded. -->
		<p class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] tracking-[0.22em] text-ink/60 uppercase">
			{#if eyebrow}
				<span class="flex items-center gap-2 text-[#a8833d]"><span class="size-2 bg-gold" aria-hidden="true"></span>{eyebrow}</span>
			{/if}
			{#if post.readMinutes}
				{#if eyebrow}<span aria-hidden="true">/</span>{/if}
				<span>{readTimeLabel(post.readMinutes)}</span>
			{/if}
			{#if post.publishedAt}
				{#if eyebrow || post.readMinutes}<span aria-hidden="true">/</span>{/if}
				<time datetime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
			{/if}
		</p>
		<h1 id="article-title" class="text-[clamp(2.1rem,5vw,3.4rem)] leading-[1.05] font-bold tracking-tight text-heading">{post.title}</h1>
		{#if post.excerpt}<p class="mt-5 max-w-[60ch] text-[17px] leading-relaxed font-light text-ink/70">{post.excerpt}</p>{/if}
		<div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink/55">
			<span class="flex items-center gap-3">
				<span class="grid size-9 place-items-center rounded-full border border-ink/15 bg-white text-[11px] font-semibold text-heading" aria-hidden="true">{initials}</span>
				<span>
					<span class="block font-semibold text-heading">{post.author.name || site.shortName}</span>
					{#if post.author.role}<span class="block text-[12px] font-light">{post.author.role}</span>{/if}
				</span>
			</span>
		</div>
	</header>

	<div class="mt-10 grid gap-10 lg:grid-cols-[minmax(0,46rem)_minmax(0,1fr)] lg:gap-14">
		<div class="min-w-0">
			{#if post.image.src}
				<img
					src={post.image.src}
					{...responsive(post.image.src, SIZES.article)}
					alt={post.image.alt}
					{...imageSize(post.image)}
					class="aspect-video w-full rounded-2xl object-cover"
					decoding="async"
					fetchpriority="high"
				/>
			{/if}

			{#if post.takeaways.length}
				<aside id="key-takeaways" class="mt-8 rounded-2xl border border-gold/30 bg-[#fbf7ee] p-6" aria-labelledby="takeaways-heading">
					<h2 id="takeaways-heading" class="text-[12px] tracking-[0.2em] text-[#8a6a2c] uppercase">{copy.article.takeaways}</h2>
					<ul class="mt-3 space-y-2">
						{#each post.takeaways as t, i (i)}
							<li class="flex gap-3 text-[15px] leading-relaxed text-ink/80"><span class="mt-2 size-1.5 shrink-0 bg-gold" aria-hidden="true"></span>{t}</li>
						{/each}
					</ul>
				</aside>
			{/if}

			<div class="article-body mt-8">{@html body}</div>

			{#if post.questions.length}
				<section class="mt-12 border-t border-ink/10 pt-8" aria-labelledby="questions-heading">
					<h2 id="questions-heading" class="text-[1.35rem] font-bold tracking-tight text-heading">{copy.article.questions}</h2>
					<dl class="mt-5 space-y-6">
						{#each post.questions as q, i (i)}
							<div>
								<dt class="text-[1.02rem] font-semibold text-heading">{q.q}</dt>
								<dd class="mt-2 text-[15.5px] leading-relaxed font-light whitespace-pre-line text-ink/75">{q.a}</dd>
							</div>
						{/each}
					</dl>
				</section>
			{/if}

			{#if post.tags.length}
				<div class="mt-10 flex flex-wrap items-center gap-2">
					<span class="mr-1 text-[11px] tracking-[0.2em] text-ink/55 uppercase">{copy.article.tags}</span>
					{#each post.tags as t (t)}
						<a href="/blog?tag={encodeURIComponent(tagSlug(t))}" class="rounded-full bg-silver/60 px-3 py-1 text-[12.5px] font-medium text-heading no-underline transition-colors hover:bg-lens/15 hover:text-horizon focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens">{t}</a>
					{/each}
				</div>
			{/if}

			<div class="mt-8 border-t border-ink/10 pt-6">
				<ShareButtons {url} label={copy.article.share} copyLabel={copy.article.copyLink} copiedLabel={copy.article.copied} />
			</div>
		</div>

		<aside class="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
			{#if headings.length > 1}
				<nav class="rounded-2xl border border-ink/10 bg-white p-6" aria-labelledby="toc-heading">
					<h2 id="toc-heading" class="text-[11px] tracking-[0.2em] text-lens uppercase">{copy.article.onThisPage}</h2>
					<ol class="mt-3 divide-y divide-ink/10">
						{#each headings as h (h.id)}
							<li><a href="#{h.id}" class="block py-2.5 text-[14px] text-heading no-underline hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens">{h.text}</a></li>
						{/each}
					</ol>
				</nav>
			{/if}
			{#if data.challenge}
				<div class="rounded-2xl border border-gold/30 bg-[#fbf7ee] p-6">
					<p class="text-[11px] tracking-[0.2em] text-[#8a6a2c] uppercase">{copy.article.relatedChallenge}</p>
					<p class="mt-3 text-[1.05rem] font-bold tracking-tight text-heading">{data.challenge.title}</p>
					<p class="rt mt-2 text-[14px] leading-relaxed font-light text-ink/70">{@html rich(data.challenge.summary)}</p>
					<a href={data.challenge.href} class="mt-3 inline-block text-[13.5px] font-semibold text-horizon no-underline hover:text-lens hover:underline">{copy.article.relatedLink} →</a>
				</div>
			{/if}
			<div class="on-ink relative isolate overflow-hidden rounded-2xl border border-gold/25 bg-ink p-6 text-bone">
				<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_90%_120%,rgba(16,51,137,0.6),transparent_60%)]"></div>
				<p class="flex items-center gap-3 text-[11px] tracking-[0.2em] text-gold uppercase"><span aria-hidden="true" class="h-px w-6 bg-gold/70"></span>{copy.article.sideCtaEyebrow}</p>
				<p class="mt-3 text-[1.15rem] leading-snug font-bold tracking-tight text-bone">{copy.article.sideCtaTitle}</p>
				<p class="mt-2 text-[14px] font-light text-bone/75">{copy.article.sideCtaBody}</p>
				<div class="mt-5"><GoldCta href={site.demoHref} label={copy.article.sideCtaLabel} /></div>
			</div>
		</aside>
	</div>
</article>

{#if data.related.length}
	<section class="mt-16 w-full rounded-3xl bg-silver/45 p-6 ring-1 ring-ink/5 sm:mt-24 sm:p-10" aria-labelledby="keep-reading-heading">
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{copy.article.keepReadingEyebrow}</p>
				<h2 id="keep-reading-heading" class="text-[clamp(1.6rem,3.2vw,2.3rem)] leading-tight font-bold tracking-tight">{copy.article.keepReadingTitle}</h2>
			</div>
			<a href="/blog" class="text-[14px] font-semibold text-horizon no-underline hover:text-lens hover:underline">{copy.article.allArticles} →</a>
		</div>
		<ul class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.related as r (r.slug)}
				<li><BlogCard post={r} eyebrow={postEyebrow(r, problems)} readLabel={copy.article.readMore} variant="compact" /></li>
			{/each}
		</ul>
	</section>
{/if}
