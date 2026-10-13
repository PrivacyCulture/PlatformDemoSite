<!--
	/blog. With no search: the newest post as the hero, the next three under Recent, the pinned post
	in Featured, then everything else under More, six at a time. With a search or a tag:
	the matches, and a way back. Every post appears once on the page (blogIndex decides where).

	The words come from pages.blog, edited in Sorted (Website → Platform → Pages → Blog); the posts
	from Sorted's Blog.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import SeoHead from '$lib/components/site/SeoHead.svelte';
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import GoldCta from '$lib/components/site/GoldCta.svelte';
	import LensCta from '$lib/components/site/LensCta.svelte';
	import BlogCard from '$lib/components/site/blog/BlogCard.svelte';
	import { pages, pageTitle } from '$lib/content';
	import { problems } from '$lib/site/problems';
	import { metaKeywords } from '$lib/site/seo';
	import { blogNode, BLOG_ID } from '$lib/site/schema';
	import { plain } from '$lib/site/rich';
	import { blogIndex, formatPostDate, postEyebrow, readTimeLabel, tagSlug } from '$lib/site/blog';

	let { data } = $props();
	const copy = pages.blog;

	const index = $derived(blogIndex(data.posts));
	const eyebrowOf = (p: (typeof data.posts)[number]) => postEyebrow(p, problems);
	const searching = $derived(data.results !== null);
	const tagLabel = $derived(data.tag ? (data.posts.flatMap((p) => p.tags).find((t) => tagSlug(t) === tagSlug(data.tag)) ?? data.tag) : '');

	// "Load more": six at a time, client side — every summary is already on the page.
	const STEP = 6;
	let shown = $state(STEP);
	const moreShown = $derived(index.more.slice(0, shown));

	// Typing searches as you go; the form still works without script (a plain GET to /blog).
	let query = $state(untrack(() => data.q));
	let searchInput = $state<HTMLInputElement | null>(null);
	// Follow the address when it changes from elsewhere (a tag, Clear search, Back) — but never
	// while the box has focus, or a slow navigation would overwrite letters still being typed.
	$effect(() => {
		const q = data.q;
		if (document.activeElement !== searchInput) query = q;
	});
	let timer: ReturnType<typeof setTimeout> | undefined;
	function onInput() {
		clearTimeout(timer);
		timer = setTimeout(() => {
			const params = new URLSearchParams();
			if (query.trim()) params.set('q', query.trim());
			if (data.tag) params.set('tag', data.tag);
			const qs = params.toString();
			goto(qs ? `/blog?${qs}` : '/blog', { keepFocus: true, noScroll: true, replaceState: true });
		}, 300);
	}

	const schema = $derived(
		blogNode({
			origin: page.url.origin,
			name: plain(copy.meta.title),
			description: plain(copy.meta.description),
			posts: data.posts.map((p) => ({ url: `/blog/${p.slug}`, headline: p.title, datePublished: p.publishedAt }))
		})
	);
	const heroMeta = (p: (typeof data.posts)[number]) => [formatPostDate(p.publishedAt), readTimeLabel(p.readMinutes)].filter(Boolean);
</script>

<SeoHead
	title={pageTitle(copy.meta.title)}
	description={copy.meta.description}
	keywords={metaKeywords(copy.meta)}
	image={index.hero?.image.src || null}
	imageWidth={index.hero?.image.width || null}
	imageHeight={index.hero?.image.height || null}
	imageAlt={index.hero?.image.alt || null}
	schema={[schema]}
	mainEntityId={BLOG_ID(page.url.origin)}
	index={!searching}
/>

{#snippet searchForm(id: string)}
	<form method="GET" action="/blog" role="search" class="w-full max-w-[22rem]" onsubmit={(e) => { e.preventDefault(); clearTimeout(timer); onInput(); }}>
		<label for={id} class="mb-1.5 block text-[12px] font-semibold text-heading">{copy.search.label}</label>
		<div class="relative">
			<input
				{id}
				name="q"
				type="search"
				bind:value={query}
				bind:this={searchInput}
				oninput={onInput}
				placeholder={copy.search.placeholder}
				class="min-h-11 w-full rounded-full border border-ink/15 bg-white px-5 pr-24 text-[14px] text-ink placeholder:text-ink/45 focus:border-lens focus:outline-none focus-visible:ring-2 focus-visible:ring-lens/40"
			/>
			{#if data.tag}<input type="hidden" name="tag" value={data.tag} />{/if}
			<button type="submit" class="absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded-full bg-lens px-4 py-1.5 text-[12.5px] font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens">{copy.search.button}</button>
		</div>
	</form>
{/snippet}

{#if searching}
	<section class="w-full pt-6 sm:pt-10" aria-labelledby="results-heading">
		<div class="flex flex-wrap items-end justify-between gap-6">
			<div>
				<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase"><a href="/blog" class="text-lens no-underline hover:underline">{copy.recent.eyebrow}</a></p>
				<h1 id="results-heading" class="text-[clamp(2rem,4.5vw,3rem)] leading-[1.05] font-bold tracking-tight text-heading">{copy.search.resultsTitle}</h1>
				<p class="mt-3 text-[15px] font-light text-ink/70">
					{data.results?.length ?? 0} {(data.results?.length ?? 0) === 1 ? 'article' : 'articles'}
					{#if data.q} for “{data.q}”{/if}{#if tagLabel} tagged “{tagLabel}”{/if}
					· <a href="/blog" class="font-semibold text-horizon underline-offset-4 hover:text-lens hover:underline">{copy.search.clear}</a>
				</p>
			</div>
			{@render searchForm('blog-search')}
		</div>
		{#if data.results?.length}
			<ul class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.results as post (post.slug)}
					<li><BlogCard {post} eyebrow={eyebrowOf(post)} readLabel={copy.article.readMore} /></li>
				{/each}
			</ul>
		{:else}
			<div class="mt-10 rounded-2xl border border-dashed border-ink/15 bg-white/70 p-8 text-[15px] font-light text-ink/70">
				<p>{copy.search.noResults}{data.posts.length ? ` There ${data.posts.length === 1 ? 'is 1 article' : `are ${data.posts.length} articles`} on the blog.` : ''}</p>
				<p class="mt-3"><a href="/blog" class="font-semibold text-horizon underline-offset-4 hover:text-lens hover:underline">{copy.search.clear}</a></p>
			</div>
		{/if}
	</section>
{:else if !index.hero}
	<section class="w-full max-w-[46rem] pt-6 sm:pt-10">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{copy.recent.eyebrow}</p>
		<h1 class="text-[clamp(2rem,5vw,3.4rem)] leading-[1.04] font-bold tracking-tight text-heading">{copy.empty.title}</h1>
		<p class="mt-5 text-[17px] leading-relaxed font-light text-ink/70">{copy.empty.body}</p>
	</section>
{:else}
	{@const hero = index.hero}
	<header class="grid w-full items-center gap-10 pt-6 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_min(40rem,46%)] lg:gap-12">
		<div class="min-w-0">
			<p class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] tracking-[0.22em] uppercase">
				<span class="text-lens">{copy.hero.eyebrow}</span>
				{#if eyebrowOf(hero)}
					<span class="flex items-center gap-2 text-[#a8833d]"><span class="size-2 bg-gold" aria-hidden="true"></span>{eyebrowOf(hero)}</span>
				{/if}
			</p>
			<h1 class="text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.04] font-bold tracking-tight text-heading">{hero.title}</h1>
			{#if hero.excerpt}<p class="mt-5 max-w-[50ch] text-[16px] leading-relaxed font-light text-ink/70">{hero.excerpt}</p>{/if}
			<p class="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink/55">
				{#if hero.author.name}<span><span class="font-semibold text-heading">{hero.author.name}</span>{#if hero.author.role}<span class="font-light">, {hero.author.role}</span>{/if}</span>{/if}
				{#each heroMeta(hero) as m (m)}<span class="font-light">{m}</span>{/each}
			</p>
			<div class="mt-7 flex flex-wrap items-center gap-4">
				<GoldCta href="/blog/{hero.slug}" label={copy.hero.readLabel} />
				<LensCta href="#recent" label={copy.hero.browseLabel} />
			</div>
		</div>
		{#if hero.image.src}
			<a href="/blog/{hero.slug}" class="block rounded-3xl bg-white/80 p-3 shadow-[0_24px_60px_rgba(11,18,32,0.12)] ring-1 ring-ink/5" tabindex="-1" aria-hidden="true">
				<img src={hero.image.src} alt="" width={hero.image.width || undefined} height={hero.image.height || undefined} class="aspect-video w-full rounded-2xl object-cover" decoding="async" />
			</a>
		{/if}
	</header>

	<section id="recent" class="mt-16 w-full scroll-mt-24 sm:mt-24" aria-labelledby={index.recent.length ? 'recent-heading' : undefined} aria-label={index.recent.length ? undefined : copy.search.label}>
		<!-- With only the hero to show there is nothing to call recent: the search stays, the heading goes. -->
		<div class={['flex flex-wrap items-end gap-6', index.recent.length ? 'justify-between' : 'justify-end']}>
			{#if index.recent.length}
				<div>
					<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{copy.recent.eyebrow}</p>
					<h2 id="recent-heading" class="text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">{copy.recent.title}</h2>
				</div>
			{/if}
			{@render searchForm('blog-search')}
		</div>
		{#if index.recent.length}
			<ul class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each index.recent as post (post.slug)}
					<li><BlogCard {post} eyebrow={eyebrowOf(post)} readLabel={copy.article.readMore} /></li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if index.featured}
		{@const f = index.featured}
		<section class="mt-16 w-full sm:mt-24" aria-labelledby="featured-heading">
			<div class="grid items-center gap-8 rounded-3xl bg-silver/45 p-6 ring-1 ring-ink/5 sm:p-10 lg:grid-cols-2 lg:gap-12">
				<div class="min-w-0">
					<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{copy.featured.eyebrow}</p>
					<h2 id="featured-heading" class="text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">{f.title}</h2>
					{#if f.excerpt}<p class="mt-4 max-w-[52ch] text-[15px] leading-relaxed font-light text-ink/70">{f.excerpt}</p>{/if}
					<p class="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink/55">
						{#if f.author.name}<span>{f.author.name}{#if f.author.role}<span class="font-light">, {f.author.role}</span>{/if}</span>{/if}
						{#each heroMeta(f) as m (m)}<span class="font-light">{m}</span>{/each}
					</p>
					<div class="mt-7"><GoldCta href="/blog/{f.slug}" label={copy.featured.cta} /></div>
				</div>
				{#if f.image.src}
					<div class="rounded-2xl bg-white p-4 sm:p-6">
						<img src={f.image.src} alt={f.image.alt} width={f.image.width || undefined} height={f.image.height || undefined} loading="lazy" decoding="async" class="w-full rounded-xl object-contain" />
					</div>
				{/if}
			</div>
		</section>
	{/if}

	{#if index.more.length}
		<section class="mt-16 w-full sm:mt-24" aria-labelledby="more-heading">
			<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{copy.archive.eyebrow}</p>
			<h2 id="more-heading" class="text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">{copy.archive.title}</h2>
			<ul class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each moreShown as post (post.slug)}
					<li><BlogCard {post} eyebrow={eyebrowOf(post)} readLabel={copy.article.readMore} /></li>
				{/each}
			</ul>
			{#if shown < index.more.length}
				<div class="mt-8 flex justify-center">
					<LensCta label={copy.archive.loadMore} onclick={() => (shown += STEP)} />
				</div>
			{/if}
		</section>
	{/if}
{/if}

<section class="mt-16 w-full sm:mt-24">
	<DemoCtaBlock />
</section>
