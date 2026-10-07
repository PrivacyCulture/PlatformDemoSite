<script lang="ts">
	import { NAV_JUMPS } from '$lib/journey/beats';
	import type { SiteContent } from '$lib/content';
	import { site } from '$lib/content';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import FeaturesMenu from '$lib/components/site/FeaturesMenu.svelte';
	import FeaturesAccordion from '$lib/components/site/FeaturesAccordion.svelte';
	import { splitAtFeatures, featuresMenuFrom } from '$lib/site/features';

	const logo = site.logos.colourWhite;

	let {
		onHome,
		onJump,
		jumps = NAV_JUMPS,
		copy
	}: {
		onHome: () => void;
		onJump: (progress: number) => void;
		jumps?: { hero: number; platform: number };
		copy: SiteContent['site']['nav'];
	} = $props();

	let menuOpen = $state(false);
	let featuresOpen = $state(false);
	let headerHeight = $state(0);
	let toggle = $state<HTMLButtonElement>();
	let sheet = $state<HTMLElement>();
	const reduceMotion =
		typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const motion = reduceMotion ? 0 : 1;

	function close(returnFocus = false) {
		menuOpen = false;
		if (returnFocus) toggle?.focus();
	}

	// While the sheet is open the journey behind it holds still, and focus starts on the first link.
	// journey-menu-open lifts the journey's layers above the FAQ trigger so the scrim covers it too.
	$effect(() => {
		if (!menuOpen) return;
		const root = document.documentElement;
		root.classList.add('journey-menu-open');
		const hold = (e: Event) => {
			if (!sheet?.contains(e.target as Node)) e.preventDefault();
		};
		const options = { passive: false } as const;
		document.addEventListener('touchmove', hold, options);
		document.addEventListener('wheel', hold, options);
		sheet?.querySelector<HTMLElement>('a, button')?.focus({ preventScroll: true });
		const desktop = matchMedia('(min-width: 64rem)');
		const onDesktop = () => desktop.matches && close();
		desktop.addEventListener('change', onDesktop);
		return () => {
			root.classList.remove('journey-menu-open');
			document.removeEventListener('touchmove', hold);
			document.removeEventListener('wheel', hold);
			desktop.removeEventListener('change', onDesktop);
		};
	});

	function handleLink(link: SiteContent['site']['nav']['links'][number]) {
		if (link.jump === 'platform') onJump(jumps.platform);
		else if (link.jump === 'hero') onHome();
		menuOpen = false;
	}

	type NavLink = SiteContent['site']['nav']['links'][number];
	// The Features menu is an entry in the main links, placed in Sorted (see $lib/site/features-position).
	const split = $derived(splitAtFeatures(copy.links));
	const featuresMenu = $derived(featuresMenuFrom(copy.features, split.entry));
</script>

{#snippet deskLink(link: NavLink)}
	{#if link.href}
		<a
			href={link.href}
			class="-my-3 rounded py-3 text-[14px] tracking-normal text-bone no-underline transition-colors hover:text-bone/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
			target={link.href.startsWith('http') ? '_blank' : undefined}
			rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
		>
			{link.label}
		</a>
	{:else}
		<button
			type="button"
			onclick={() => handleLink(link)}
			class="-my-3 cursor-pointer rounded py-3 text-[14px] tracking-normal text-bone transition-colors hover:text-bone/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
		>
			{link.label}
		</button>
	{/if}
{/snippet}

{#snippet mobileRow(link: NavLink)}
	<li class="border-bone/[0.08] [&:not(:first-child)]:border-t">
		{#if link.href}
			<a
				href={link.href}
				onclick={() => close()}
				target={link.href.startsWith('http') ? '_blank' : undefined}
				rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
				class="group flex min-h-14 items-center justify-between gap-3 rounded-2xl px-4 text-[17px] font-medium text-bone no-underline transition-colors hover:bg-white/[0.04] active:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lens"
			>
				{@render row(link.label)}
			</a>
		{:else}
			<button
				type="button"
				onclick={() => handleLink(link)}
				class="group flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 text-left text-[17px] font-medium text-bone transition-colors hover:bg-white/[0.04] active:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lens"
			>
				{@render row(link.label)}
			</button>
		{/if}
	</li>
{/snippet}


<svelte:window
	onkeydown={(e) => {
		if (menuOpen && e.key === 'Escape') close(true);
	}}
/>

<header
	bind:clientHeight={headerHeight}
	class="fixed inset-x-0 top-0 flex items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5 {menuOpen || featuresOpen ? 'z-[48]' : 'z-40'}"
>
	<div
		class="pointer-events-none absolute inset-0 -z-10 border-b border-bone/10 bg-ink/90 backdrop-blur-lg transition-opacity duration-200 lg:hidden {menuOpen
			? 'opacity-100'
			: 'opacity-0'}"
		aria-hidden="true"
	></div>
	<a
		href="/"
		class="min-w-0 shrink no-underline transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
		aria-label={copy.homeAriaLabel}
		onclick={(e) => {
			if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
				e.preventDefault();
				onHome();
				menuOpen = false;
			}
		}}
	>
		<img
			src={logo.src}
			alt={logo.alt}
			class="h-6 w-auto max-w-full object-contain object-left sm:h-8"
			width={logo.width}
			height={logo.height}
			decoding="async"
		/>
	</a>

	<div class="flex shrink-0 items-center gap-6 lg:gap-8">
		<!-- top-[5px] lands the link baselines on the logo wordmark's baseline. An offset, not a
		     transform, as in the site header, where a transform would trap the Features panel. -->
		<nav aria-label={copy.ariaLabel} class="relative top-[5px] hidden items-center gap-7 whitespace-nowrap lg:flex">
			{#each split.before as link (link.label)}{@render deskLink(link)}{/each}
			<FeaturesMenu menu={featuresMenu} arrow={copy.arrow} tone="dark" bind:open={featuresOpen} />
			{#each split.after as link (link.label)}{@render deskLink(link)}{/each}
		</nav>

		<div class="flex items-center gap-2">
			<a
				href={copy.demo.href}
				onclick={() => (menuOpen = false)}
				class="hidden min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-lens px-4 py-2.5 text-[13px] font-semibold tracking-wide whitespace-nowrap text-white no-underline shadow-[0_8px_28px_rgba(0,0,0,0.45)] sm:inline-flex transition-colors hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens sm:px-5 sm:text-[14px]"
			>
				{copy.demo.label}
				<span aria-hidden="true">{copy.arrow}</span>
			</a>

			<button
				type="button"
				bind:this={toggle}
				class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border text-bone transition-colors hover:border-lens/40 hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens lg:hidden {menuOpen
					? 'border-bone/20 bg-white/10'
					: 'border-bone/15 bg-ink/20 backdrop-blur-sm'}"
				aria-expanded={menuOpen}
				aria-controls="journey-mobile-nav"
				onclick={() => (menuOpen = !menuOpen)}
			>
				<span class="sr-only">{menuOpen ? copy.closeMenu : copy.openMenu}</span>
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" class="menu-icon" class:open={menuOpen}>
					<path class="bar top" d="M3 5h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
					<path class="bar mid" d="M3 9h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
					<path class="bar bot" d="M3 13h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
				</svg>
			</button>
		</div>
	</div>
</header>

{#snippet row(label: string)}
	<span class="flex items-center gap-3">
		<span class="h-1.5 w-1.5 rounded-full bg-bone/25" aria-hidden="true"></span>
		{label}
	</span>
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		aria-hidden="true"
		class="shrink-0 text-bone/40 transition-transform duration-200 group-hover:translate-x-0.5"
	>
		<path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{/snippet}

{#if menuOpen}
	<!-- Tapping the dimmed journey closes the menu. The menu sits above the FAQ drawer (z 44-46). -->
	<button
		type="button"
		tabindex="-1"
		aria-hidden="true"
		class="fixed inset-0 z-[47] cursor-default bg-black/40 backdrop-blur-[2px] lg:hidden"
		onclick={() => close()}
		transition:fade={{ duration: 180 * motion }}
	></button>

	<nav
		bind:this={sheet}
		id="journey-mobile-nav"
		aria-label={copy.mobileAriaLabel}
		class="fixed inset-x-3 z-[48] flex max-h-[calc(100dvh-var(--nav-top)-0.75rem)] flex-col overflow-y-auto overscroll-contain rounded-3xl border border-bone/10 bg-ink p-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:inset-x-auto sm:right-8 sm:w-[22rem] lg:hidden"
		style:top="var(--nav-top)"
		style:--nav-top="{headerHeight + 8}px"
		transition:fly={{ y: -8 * motion, duration: 200 * motion, easing: cubicOut }}
	>
		<ul class="flex flex-col">
			{#each split.before as link (link.label)}{@render mobileRow(link)}{/each}
			<FeaturesAccordion menu={featuresMenu} arrow={copy.arrow} tone="dark" onnavigate={() => close()} />
			{#each split.after as link (link.label)}{@render mobileRow(link)}{/each}
		</ul>

		<div class="mt-2 p-2 sm:hidden">
			<a
				href={copy.demo.href}
				onclick={() => close()}
				class="flex min-h-13 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-lens px-5 py-3 text-[15px] font-semibold tracking-wide text-white no-underline shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
			>
				{copy.demo.label}
				<span aria-hidden="true">{copy.arrow}</span>
			</a>
		</div>
	</nav>
{/if}

<style>
	.menu-icon .bar {
		transform-box: fill-box;
		transform-origin: center;
		transition:
			transform 200ms ease,
			opacity 150ms ease;
	}

	.menu-icon.open .top {
		transform: translateY(4px) rotate(45deg);
	}

	.menu-icon.open .mid {
		opacity: 0;
	}

	.menu-icon.open .bot {
		transform: translateY(-4px) rotate(-45deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.menu-icon .bar {
			transition: none;
		}
	}
</style>
