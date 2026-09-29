<!--
	A section added to a page in the CMS, drawn by its template. The shapes are those of
	`$lib/site/added-sections.ts` (and SECTION_TEMPLATES in Sorted). Every prose field is drawn
	through rich() — those paths are the CMS's ADDED_SECTION_HTML, and must stay in step: a field
	rendered here through rich() that the CMS does not allow formatting on is harmless; the other
	way round publishes a literal <strong>.

	Nothing is drawn from a blank value: a section with no image is copy alone, a card with no
	words is skipped, a button with no address is not a button. The CMS sends sections mid-edit.
-->
<script lang="ts">
	import GoldCta from './GoldCta.svelte';
	import { asset } from '$lib/content/assets';
	import type { AddedSection, AddedImage } from '$lib/site/added-sections';
	import { rich } from '$lib/site/rich';

	let { section, class: className = '' }: { section: AddedSection; class?: string } = $props();

	const hasImage = (img: AddedImage) => img.src.trim() !== '';
	const external = (href: string) => /^https?:\/\//i.test(href);
</script>

{#snippet picture(img: AddedImage, cls: string)}
	<picture>
		{#if img.webp}
			<source srcset={asset(img.webp)} type="image/webp" />
		{/if}
		<img
			src={asset(img.src)}
			alt={img.alt}
			width={img.width > 0 ? img.width : undefined}
			height={img.height > 0 ? img.height : undefined}
			class={cls}
			loading="lazy"
			decoding="async"
		/>
	</picture>
{/snippet}

{#snippet heading(eyebrow: string, title: string, body: string, wide = false)}
	{#if eyebrow}
		<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{eyebrow}</p>
	{/if}
	{#if title}
		<h2 class={['text-[clamp(1.5rem,3vw,2.1rem)] leading-tight font-bold tracking-tight', wide ? 'max-w-[22ch]' : '']}>{title}</h2>
	{/if}
	{#if body}
		<p class="rt mt-4 max-w-[62ch] text-[15px] leading-relaxed font-light whitespace-pre-line text-ink/70">{@html rich(body)}</p>
	{/if}
{/snippet}

<section id={section.id} class={['added-section mt-14 w-full scroll-mt-24 sm:mt-20', className]}>
	{#if section.template === 'text'}
		<div class="max-w-[46rem] border-t border-ink/10 pt-6">
			{@render heading('', section.title, section.body)}
		</div>
	{:else if section.template === 'copyImage'}
		{#if hasImage(section.image)}
			<div class={['grid items-center gap-8 lg:grid-cols-2 lg:gap-14', section.imageSide === 'left' ? 'lg:[&>figure]:order-first' : '']}>
				<div class="min-w-0">{@render heading(section.eyebrow, section.title, section.body, true)}</div>
				<figure class="m-0 min-w-0">
					{@render picture(section.image, 'block h-auto w-full rounded-2xl drop-shadow-[0_24px_60px_rgba(11,18,32,0.14)]')}
				</figure>
			</div>
		{:else}
			<div class="max-w-[46rem]">{@render heading(section.eyebrow, section.title, section.body, true)}</div>
		{/if}
	{:else if section.template === 'cards'}
		{@const cards = section.items.filter((c) => c.title.trim() || c.body.trim())}
		{@render heading(section.eyebrow, section.title, section.body, true)}
		{#if cards.length}
			<!-- Keyed by position: two cards may share a title while somebody is still writing them. -->
			<ul class={['mt-8 grid gap-4', cards.length >= 3 ? 'sm:grid-cols-3' : cards.length === 2 ? 'sm:grid-cols-2' : '']}>
				{#each cards as card, i (i)}
					<li class="rounded-2xl border border-lens/50 bg-transparent p-5">
						<p class="font-mono text-[10px] tracking-[0.18em] text-gold tabular-nums">{String(i + 1).padStart(2, '0')}</p>
						{#if card.title}<h3 class="mt-2 text-[1.05rem] leading-snug font-bold tracking-tight">{card.title}</h3>{/if}
						{#if card.body}<p class="rt mt-2 text-[14px] leading-relaxed font-light text-ink/70">{@html rich(card.body)}</p>{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{:else if section.template === 'quote'}
		<div class="max-w-4xl">
			{#if section.title}
				<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{section.title}</p>
			{/if}
			{#if section.quote}
				<blockquote class="border-l-2 border-gold pl-5 text-[clamp(1.2rem,2.4vw,1.55rem)] leading-snug font-bold tracking-tight">
					{@html rich(section.quote)}
				</blockquote>
			{/if}
			{#if section.attribution}
				<p class="mt-4 pl-5 text-[14px] font-light text-ink/60">— {section.attribution}</p>
			{/if}
		</div>
	{:else if section.template === 'cta'}
		<div class="rounded-2xl border border-gold/30 bg-ink/[0.03] p-8 sm:p-10">
			<div class="max-w-[46rem]">{@render heading(section.eyebrow, section.title, section.body, true)}</div>
			{#if section.label.trim() && section.href}
				<div class="mt-8"><GoldCta href={section.href} label={section.label.trim()} external={external(section.href)} /></div>
			{/if}
		</div>
	{:else if section.template === 'image'}
		{#if section.title}
			<h2 class="text-[clamp(1.5rem,3vw,2.1rem)] leading-tight font-bold tracking-tight">{section.title}</h2>
		{/if}
		{#if hasImage(section.image)}
			<figure class={['m-0 w-full', section.title ? 'mt-8' : '']}>
				{@render picture(section.image, 'block h-auto w-full rounded-2xl drop-shadow-[0_24px_60px_rgba(11,18,32,0.14)]')}
				{#if section.caption}
					<figcaption class="rt mt-3 text-[14px] leading-relaxed font-light text-ink/60">{@html rich(section.caption)}</figcaption>
				{/if}
			</figure>
		{/if}
	{/if}
</section>
