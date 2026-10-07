<script lang="ts">
	import { page } from '$app/state';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { site } from '$lib/site/content';
	import { visibleLinks, isArchived } from '$lib/site/archive';
	import FeaturesMenu from './FeaturesMenu.svelte';
	import FeaturesAccordion from './FeaturesAccordion.svelte';
	import { splitAtFeatures, featuresMenuFrom } from '$lib/site/features';

	const nav = site.nav;
	// A link to a page archived in the CMS is hidden while it is archived, and back when it is not.
	// The Features menu is an entry in the main links (see $lib/site/features-position): split
	// around it first, then hide archived links in each half, so archiving one never moves it.
	const split = $derived(splitAtFeatures(nav.links));
	const featuresMenu = $derived(featuresMenuFrom(nav.features, split.entry));
	const linksBefore = $derived(visibleLinks(split.before));
	const linksAfter = $derived(visibleLinks(split.after));
	const mobileOnlyLinks = $derived(visibleLinks(nav.mobileOnlyLinks));
	const showDemo = $derived(!isArchived(nav.demo.href));
	const logo = site.logos.colour;

	let open = $state(false);
	let scrolled = $state(false);
	let headerHeight = $state(0);
	let toggle = $state<HTMLButtonElement>();
	let sheet = $state<HTMLElement>();
	const path = $derived(page.url.pathname);
	const hash = $derived(page.url.hash);
	const reduceMotion =
		typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const motion = reduceMotion ? 0 : 1;

	function isCurrent(href: string) {
		const [pathname, fragment] = href.split('#');
		if (pathname === '/platform') {
			if (fragment) return path === '/platform' && hash === `#${fragment}`;
			return path === '/platform' || path.startsWith('/platform/');
		}
		if (pathname === '/demo') return path === '/demo' || path === '/demo-booked';
		return path === href || path.startsWith(`${href}/`);
	}

	function close(returnFocus = false) {
		open = false;
		if (returnFocus) toggle?.focus();
	}

	$effect(() => {
		void path;
		void hash;
		open = false;
	});

	// While the sheet is open the page behind it holds still (blocking the gestures rather than
	// setting overflow on the root, which knocks the sticky header off screen in WebKit), and
	// focus starts on the first link.
	$effect(() => {
		if (!open) return;
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
			document.removeEventListener('touchmove', hold);
			document.removeEventListener('wheel', hold);
			desktop.removeEventListener('change', onDesktop);
		};
	});
</script>

{#snippet deskLink(link: { label: string; href?: string })}
	{#if link.href}
		<a
			href={link.href}
			aria-current={isCurrent(link.href) ? 'page' : undefined}
			class="-my-3 rounded py-3 text-[14px] tracking-normal no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens {isCurrent(
				link.href
			)
				? 'text-lens'
				: 'text-ink/75 hover:text-ink'}"
		>
			{link.label}
		</a>
	{/if}
{/snippet}

{#snippet mobileRow(link: { label: string; href?: string })}
	{@const current = !!link.href && isCurrent(link.href)}
	<li class="border-ink/[0.06] [&:not(:first-child)]:border-t">
		<a
			href={link.href}
			aria-current={current ? 'page' : undefined}
			onclick={() => close()}
			class="group flex min-h-14 items-center justify-between gap-3 rounded-2xl px-4 text-[17px] font-medium no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lens {current
				? 'text-lens'
				: 'text-ink hover:bg-ink/[0.03] active:bg-ink/[0.05]'}"
		>
			<span class="flex items-center gap-3">
				<span
					class="h-1.5 w-1.5 rounded-full transition-colors {current ? 'bg-lens' : 'bg-ink/15'}"
					aria-hidden="true"
				></span>
				{link.label}
			</span>
			<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="none"
				aria-hidden="true"
				class="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 {current
					? 'text-lens'
					: 'text-ink/35'}"
			>
				<path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</a>
	</li>
{/snippet}


<svelte:window
	onscroll={() => (scrolled = window.scrollY > 8)}
	onkeydown={(e) => {
		if (open && e.key === 'Escape') close(true);
	}}
/>

<!-- Below lg the header sticks to the top, frosting over once the page scrolls under it -->
<header
	bind:clientHeight={headerHeight}
	class="sticky top-0 z-40 flex items-center justify-between gap-4 py-3 sm:py-4 lg:static lg:py-5"
>
	<div
		class="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 border-b backdrop-blur-lg transition-[opacity,border-color,background-color] duration-200 lg:hidden {open
			? 'border-ink/10 bg-white opacity-100'
			: scrolled
				? 'border-ink/10 bg-white/85 opacity-100'
				: 'border-transparent bg-white/85 opacity-0'}"
		aria-hidden="true"
	></div>

	<a
		href="/"
		class="min-w-0 shrink no-underline transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
		aria-label={nav.homeAriaLabel}
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
		     transform: a transform would trap the Features panel under the page that follows. -->
		<nav aria-label={nav.ariaLabel} class="relative top-[5px] hidden items-baseline gap-7 whitespace-nowrap lg:flex">
			{#each linksBefore as link, i (i)}{@render deskLink(link)}{/each}
			<FeaturesMenu menu={featuresMenu} arrow={nav.arrow} />
			{#each linksAfter as link, i (i)}{@render deskLink(link)}{/each}
		</nav>

		<div class="flex items-center gap-2">
			{#if showDemo}
			<a
				href={nav.demo.href}
				aria-current={isCurrent(nav.demo.href) ? 'page' : undefined}
				class="hidden min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-lens px-4 py-2.5 text-[13px] font-semibold tracking-wide whitespace-nowrap text-white no-underline shadow-[0_8px_28px_rgba(0,155,204,0.25)] sm:inline-flex transition-colors hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens sm:px-5 sm:text-[14px]"
			>
				{nav.demo.label}
				<span aria-hidden="true">{nav.arrow}</span>
			</a>
			{/if}

			<button
				type="button"
				bind:this={toggle}
				class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border text-ink transition-colors hover:border-lens/40 hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens lg:hidden {open
					? 'border-ink/10 bg-ink/[0.04]'
					: 'border-ink/15 bg-white/60'}"
				aria-expanded={open}
				aria-controls="mobile-nav"
				onclick={() => (open = !open)}
			>
				<span class="sr-only">{open ? nav.closeMenu : nav.openMenu}</span>
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" class="menu-icon" class:open>
					<path class="bar top" d="M3 5h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
					<path class="bar mid" d="M3 9h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
					<path class="bar bot" d="M3 13h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
				</svg>
			</button>
		</div>
	</div>
</header>

{#if open}
	<!-- Tapping the dimmed page closes the menu -->
	<button
		type="button"
		tabindex="-1"
		aria-hidden="true"
		class="fixed inset-0 z-30 cursor-default bg-ink/25 backdrop-blur-[2px] lg:hidden"
		onclick={() => close()}
		transition:fade={{ duration: 180 * motion }}
	></button>

	<nav
		bind:this={sheet}
		id="mobile-nav"
		aria-label={nav.mobileAriaLabel}
		class="fixed inset-x-3 z-40 flex max-h-[calc(100dvh-var(--nav-top)-0.75rem)] flex-col overflow-y-auto overscroll-contain rounded-3xl border border-ink/[0.06] bg-white p-2 shadow-[0_24px_60px_-12px_rgba(11,18,32,0.28)] sm:inset-x-auto sm:right-[var(--spacing-page)] sm:w-[22rem] lg:hidden"
		style:top="var(--nav-top)"
		style:--nav-top="{headerHeight + 8}px"
		transition:fly={{ y: -8 * motion, duration: 200 * motion, easing: cubicOut }}
	>
		<ul class="flex flex-col">
			{#each linksBefore.filter((l) => l.href) as link, i (i)}{@render mobileRow(link)}{/each}
			<FeaturesAccordion menu={featuresMenu} arrow={nav.arrow} onnavigate={() => close()} />
			{#each [...linksAfter.filter((l) => l.href), ...mobileOnlyLinks] as link, i (i)}{@render mobileRow(link)}{/each}
		</ul>

		{#if showDemo}
			<div class="mt-2 p-2 sm:hidden">
				<a
					href={nav.demo.href}
					aria-current={isCurrent(nav.demo.href) ? 'page' : undefined}
					onclick={() => close()}
					class="flex min-h-13 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-lens px-5 py-3 text-[15px] font-semibold tracking-wide text-white no-underline shadow-[0_8px_28px_rgba(0,155,204,0.25)] transition-colors hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					{nav.demo.label}
					<span aria-hidden="true">{nav.arrow}</span>
				</a>
			</div>
		{/if}
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
