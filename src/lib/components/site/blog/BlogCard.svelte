<!--
	One post as a card. `image` shows the post's picture on top (the blog page); `compact` is the
	text-only card (the Latest articles block on /platform, and Keep reading). The whole card is one
	link — a stretched link on the title, so the card reads as one target and the title is still
	what a screen reader announces.
-->
<script lang="ts">
	import { formatPostDate, readTimeLabel, type BlogSummary } from '$lib/site/blog';
	import { SIZES, imageSize, responsive } from '$lib/site/images';

	let {
		post,
		eyebrow = '',
		readLabel = 'Read',
		variant = 'image',
		headingLevel = 'h3'
	}: {
		post: BlogSummary;
		eyebrow?: string;
		readLabel?: string;
		variant?: 'image' | 'compact';
		headingLevel?: 'h2' | 'h3';
	} = $props();

	const href = $derived(`/blog/${post.slug}`);
	const meta = $derived([formatPostDate(post.publishedAt), readTimeLabel(post.readMinutes)].filter(Boolean).join(' · '));
</script>

<article class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_1px_2px_rgba(11,18,32,0.04)] transition-shadow duration-200 hover:shadow-[0_14px_36px_rgba(11,18,32,0.10)]">
	{#if variant === 'image'}
		<div class="aspect-[16/9] w-full overflow-hidden border-b border-ink/10 bg-silver/45">
			{#if post.image.src}
				<img
					src={post.image.src}
					{...responsive(post.image.src, SIZES.card)}
					alt=""
					{...imageSize(post.image)}
					loading="lazy"
					decoding="async"
					class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
				/>
			{/if}
		</div>
	{/if}
	<div class="flex flex-1 flex-col p-5 sm:p-6">
		{#if eyebrow}
			<p class="mb-2.5 flex items-center gap-2 text-[12px] font-semibold text-heading">
				<span class="size-2 shrink-0 bg-gold" aria-hidden="true"></span>
				{eyebrow}
			</p>
		{/if}
		<svelte:element this={headingLevel} class="text-[1.05rem] leading-snug font-bold tracking-tight text-heading">
			<a {href} class="no-underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-focus-within:underline">
				{post.title}
			</a>
		</svelte:element>
		{#if post.excerpt}
			<p class="mt-2.5 line-clamp-4 text-[14px] leading-relaxed font-light text-ink/70">{post.excerpt}</p>
		{/if}
		<!-- Pinned to the foot, so the rules line up across a row of cards of different lengths. -->
		<div class="mt-auto pt-5">
			<div class="flex items-center justify-between gap-3 border-t border-ink/10 pt-3.5">
				<span class="text-[12px] font-light text-ink/55">{meta}</span>
				<span class="text-[12.5px] font-semibold text-horizon transition-colors group-hover:text-lens" aria-hidden="true">{readLabel} →</span>
			</div>
		</div>
	</div>
</article>

<style>
	/* The stretched link carries the focus ring for the whole card. */
	article:has(a:focus-visible) {
		outline: 2px solid var(--color-lens);
		outline-offset: 3px;
	}
</style>
