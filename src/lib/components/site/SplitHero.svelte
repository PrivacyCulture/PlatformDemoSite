<!--
	The split hero (see $lib/site/split-hero): two panels side by side on one shared background,
	the band running the full width of the window. The pitch panel is the hero's own words with its
	first button drawn as the gold card; the services panel is a list of icon + label links. Each
	panel lays its own colour over the background at its own opacity, and `swap` puts the services
	on the left. On a phone the panels stack, the one on the left on a wide screen first.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import LogoStrip from './LogoStrip.svelte';
	import { featureIcon } from '$lib/site/feature-icons';
	import { imageSize, responsive, SIZES } from '$lib/site/images';
	import { rich } from '$lib/site/rich';
	import type { HeroSplit, SplitPanelLook } from '$lib/site/split-hero';

	let {
		split,
		eyebrow,
		title,
		titleLines,
		body,
		primary,
		logos = true,
		under
	}: {
		split: HeroSplit;
		eyebrow?: string;
		title: string;
		titleLines?: string[];
		body: string;
		primary?: { label: string; href: string; external?: boolean };
		logos?: boolean;
		/** Drawn under the band, inside the page column (the problem pager). */
		under?: import('svelte').Snippet;
	} = $props();

	const lines = $derived(titleLines?.length ? titleLines : [title]);
	// The gold card: the hero block's first button, else the page's own primary.
	const card: { label: string; href: string; external?: boolean } | undefined = $derived(
		split.cta.label.trim() && split.cta.href.trim() ? split.cta : primary
	);
	const pitch = $derived(split.pitch);
	const services = $derived(split.services);
	const hasServices = $derived(
		!!(services.eyebrow.trim() || services.heading.trim() || services.body.trim() || services.links.length || services.button.label.trim())
	);
	const ARROW = 'M5 12h14M13 6l6 6-6 6';

	// The background video mounts after the page has loaded, never under reduced motion or Save-Data,
	// as the shell's own loop does; the navy gradient (or the picture) stands until then.
	let videoMounted = $state(false);
	let videoPlaying = $state(false);
	onMount(() => {
		if (!split.video) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
		const mount = () => (videoMounted = true);
		if (document.readyState === 'complete') mount();
		else window.addEventListener('load', mount, { once: true });
		return () => window.removeEventListener('load', mount);
	});

	const overlayStyle = (l: SplitPanelLook) => (l.overlay ? `background:${l.overlay};opacity:${l.opacity / 100}` : 'display:none');
</script>

<!-- `side`: where the panel sits on a wide screen; 'full' when it is the only one. Its words line up
     with the page column: the left panel's run to the column's left edge, the right's from its middle. -->
{#snippet panel(look: SplitPanelLook, side: 'left' | 'right' | 'full', content: import('svelte').Snippet)}
	<div
		class={[
			'relative flex',
			side === 'right' ? 'order-2' : 'order-1',
			side === 'left' ? 'lg:justify-end' : side === 'right' ? 'lg:justify-start' : 'lg:justify-center',
			look.tone === 'light' ? 'on-ink text-bone' : 'text-ink'
		]}
	>
		<div class="pointer-events-none absolute inset-0" style={overlayStyle(look)} aria-hidden="true"></div>
		<div
			class={[
				'relative flex w-full flex-col justify-center px-page py-14 sm:py-20',
				side === 'full' ? 'lg:max-w-[calc(72rem+2*var(--spacing-page))]' : 'lg:max-w-[calc(36rem+var(--spacing-page))]',
				side === 'left' && 'lg:pr-12',
				side === 'right' && 'lg:pl-12'
			]}
		>
			{@render content()}
		</div>
	</div>
{/snippet}

{#snippet pitchContent()}
	{#if eyebrow}
		<p class={['mb-4 text-[13px] font-medium', pitch.tone === 'light' ? 'text-gold' : 'text-lens']}>{eyebrow}</p>
	{/if}
	<h1 class="text-[clamp(2.25rem,4.4vw,3.4rem)] leading-[1.04] font-bold tracking-tight">
		{#each lines as line, i (i)}
			{#if i > 0}<br />{/if}{line}
		{/each}
	</h1>
	{#if body}
		<p class={['rt mt-6 max-w-[44ch] text-[15px] leading-relaxed font-light', pitch.tone === 'light' ? 'text-bone/85' : 'text-ink/70']}>
			{@html rich(body)}
		</p>
	{/if}
	{#if pitch.stats.length}
		<ul class="mt-8 flex flex-wrap gap-x-10 gap-y-4">
			{#each pitch.stats as stat, i (i)}
				<li>
					<p class="text-[14px] font-semibold">{@html rich(stat.title)}</p>
					{#if stat.body}
						<p class={['rt mt-0.5 text-[12px] font-light', pitch.tone === 'light' ? 'text-bone/75' : 'text-ink/60']}>{@html rich(stat.body)}</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
	{#if card?.label && card.href}
		<a
			href={card.href}
			target={card.external ? '_blank' : undefined}
			rel={card.external ? 'noopener noreferrer' : undefined}
			class="group mt-10 flex max-w-[30rem] items-center justify-between gap-6 rounded-2xl bg-gold px-7 py-6 text-gold-ink no-underline shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
		>
			<span class="min-w-0">
				<span class="block text-[clamp(1.2rem,2vw,1.45rem)] leading-tight font-bold tracking-tight">{card.label}</span>
				{#if pitch.ctaNote}<span class="mt-1.5 block text-[13px] font-light text-gold-ink/80">{pitch.ctaNote}</span>{/if}
			</span>
			<span class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-gold transition-transform group-hover:translate-x-0.5" aria-hidden="true">
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d={ARROW} /></svg>
			</span>
		</a>
	{/if}
{/snippet}

{#snippet servicesContent()}
	{#if services.eyebrow}
		<p class={['mb-4 text-[13px] font-medium', services.tone === 'light' ? 'text-gold' : 'text-heading']}>{services.eyebrow}</p>
	{/if}
	{#if services.heading}
		<h2 class="text-[clamp(2rem,4vw,3.1rem)] leading-[1.04] font-bold tracking-tight">{@html rich(services.heading)}</h2>
	{/if}
	{#if services.body}
		<p class={['rt mt-6 max-w-[48ch] text-[15px] leading-relaxed font-light', services.tone === 'light' ? 'text-bone/85' : 'text-ink/70']}>
			{@html rich(services.body)}
		</p>
	{/if}
	{#if services.links.length}
		<ul class={['mt-8 grid border-t sm:grid-cols-2', services.tone === 'light' ? 'border-white/15' : 'border-ink/10']}>
			{#each services.links as link, i (i)}
				{@const markup = featureIcon(link.icon)}
				<li class={['border-b', services.tone === 'light' ? 'border-white/15' : 'border-ink/10', i % 2 === 0 ? 'sm:border-r sm:pr-4' : 'sm:pl-4']}>
					<svelte:element
						this={link.href ? 'a' : 'span'}
						href={link.href || undefined}
						class={['flex items-center gap-3 py-4 text-[14px] font-semibold no-underline', link.href && 'transition-colors hover:text-lens focus-visible:text-lens']}
					>
						{#if markup}
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
								stroke-linecap="round"
								stroke-linejoin="round"
								class={['h-5 w-5 shrink-0', services.tone === 'light' ? 'text-gold' : 'text-heading']}
								aria-hidden="true">{@html markup}</svg
							>
						{/if}
						<span class="min-w-0">{link.label}</span>
					</svelte:element>
				</li>
			{/each}
		</ul>
	{/if}
	{#if services.button.label.trim() && services.button.href}
		<a
			href={services.button.href}
			class={[
				'mt-8 inline-flex min-h-11 items-center self-start rounded-lg border px-5 py-2.5 text-[14px] font-semibold no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4',
				services.tone === 'light' ? 'border-bone/70 text-bone hover:bg-bone hover:text-ink' : 'border-heading text-heading hover:bg-heading hover:text-white'
			]}
		>
			{services.button.label}
		</a>
	{/if}
{/snippet}

<header class="split-hero relative mt-4 ml-[calc(50%-50vw)] w-screen overflow-hidden bg-ink">
	<div class="split-bg pointer-events-none absolute inset-0" aria-hidden="true">
		{#if split.background}
			<img
				src={split.background.src}
				{...responsive(split.background.src, SIZES.full)}
				{...imageSize(split.background)}
				alt=""
				fetchpriority="high"
			/>
		{/if}
		{#if videoMounted}
			<video class={['split-video', videoPlaying && 'playing']} src={split.video} muted loop autoplay playsinline preload="auto" onplaying={() => (videoPlaying = true)}></video>
		{/if}
	</div>
	<div class={['relative grid min-h-[min(78vh,46rem)]', hasServices && 'lg:grid-cols-2']}>
		{#if hasServices}
			{@render panel(pitch, split.swap ? 'right' : 'left', pitchContent)}
			{@render panel(services, split.swap ? 'left' : 'right', servicesContent)}
		{:else}
			{@render panel(pitch, 'full', pitchContent)}
		{/if}
	</div>
</header>

{#if under}
	<div class="w-full">{@render under()}</div>
{/if}
{#if logos}
	<div class="mt-8 lg:mt-10">
		<LogoStrip />
	</div>
{/if}

<style>
	.split-bg {
		background:
			radial-gradient(120% 90% at 15% 10%, rgba(16, 51, 137, 0.75), transparent 60%),
			radial-gradient(80% 70% at 85% 90%, rgba(212, 175, 106, 0.18), transparent 60%),
			var(--color-ink);
	}

	.split-bg img,
	.split-video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.split-video {
		opacity: 0;
		transition: opacity 0.8s ease;
	}

	.split-video.playing {
		opacity: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.split-video {
			display: none;
		}
	}

	/* The site's headings are the heading blue; on a light-toned panel they are bone, as on any ink box. */
	.split-hero :global(.on-ink h1),
	.split-hero :global(.on-ink h2) {
		color: var(--color-bone);
	}
</style>
