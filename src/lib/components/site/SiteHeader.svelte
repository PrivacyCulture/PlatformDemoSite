<script lang="ts">
	import { page } from '$app/state';
	import { site } from '$lib/site/content';

	const nav = site.nav;
	const logo = site.logos.colour;

	let open = $state(false);
	const path = $derived(page.url.pathname);
	const hash = $derived(page.url.hash);

	function isCurrent(href: string) {
		const [pathname, fragment] = href.split('#');
		if (pathname === '/platform') {
			if (fragment) return path === '/platform' && hash === `#${fragment}`;
			return path === '/platform' || path.startsWith('/platform/');
		}
		if (pathname === '/demo') return path === '/demo';
		return path === href || path.startsWith(`${href}/`);
	}

	$effect(() => {
		void path;
		open = false;
	});
</script>

<header
	class="relative z-40 flex items-center justify-between gap-4 py-4 sm:py-5"
>
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
		<!-- translate-y lands the link baselines on the logo wordmark's baseline -->
		<nav aria-label={nav.ariaLabel} class="hidden translate-y-[5px] items-baseline gap-7 whitespace-nowrap lg:flex">
			{#each nav.links as link, i (i)}
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
			{/each}
		</nav>

		<div class="flex items-center gap-2">
			<a
				href={nav.demo.href}
				aria-current={isCurrent(nav.demo.href) ? 'page' : undefined}
				class="hidden min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-lens px-4 py-2.5 text-[13px] font-semibold tracking-wide whitespace-nowrap text-white no-underline shadow-[0_8px_28px_rgba(0,155,204,0.25)] sm:inline-flex transition-colors hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens sm:px-5 sm:text-[14px]"
			>
				{nav.demo.label}
				<span aria-hidden="true">{nav.arrow}</span>
			</a>

			<button
				type="button"
				class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-lens/40 hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens lg:hidden"
				aria-expanded={open}
				aria-controls="mobile-nav"
				onclick={() => (open = !open)}
			>
				<span class="sr-only">{open ? nav.closeMenu : nav.openMenu}</span>
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
					{#if open}
						<path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" />
					{:else}
						<path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" stroke-width="1.6" />
					{/if}
				</svg>
			</button>
		</div>
	</div>
</header>

{#if open}
	<nav
		id="mobile-nav"
		aria-label={nav.mobileAriaLabel}
		class="border-b border-ink/10 bg-white/95 py-4 backdrop-blur-md lg:hidden"
	>
		<ul class="flex flex-col gap-1">
			{#each nav.links as link, i (i)}
				{#if link.href}
					<li>
						<a
							href={link.href}
							aria-current={isCurrent(link.href) ? 'page' : undefined}
							class="block rounded-lg px-3 py-3 text-[15px] no-underline transition-colors {isCurrent(
								link.href
							)
								? 'bg-ink/[0.04] text-lens'
								: 'text-ink hover:bg-ink/[0.03]'}"
						>
							{link.label}
						</a>
					</li>
				{/if}
			{/each}
			{#each nav.mobileOnlyLinks as link, i (i)}
				<li>
					<a
						href={link.href}
						class="block rounded-lg px-3 py-3 text-[15px] text-ink no-underline hover:bg-ink/[0.03]"
					>
						{link.label}
					</a>
				</li>
			{/each}
			<li class="mt-2 px-3 sm:hidden">
				<a
					href={nav.demo.href}
					class="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-lens px-5 py-2.5 text-[14px] font-semibold tracking-wide text-white no-underline shadow-[0_8px_28px_rgba(0,155,204,0.25)] transition-colors hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					{nav.demo.label}
					<span aria-hidden="true">{nav.arrow}</span>
				</a>
			</li>
		</ul>
	</nav>
{/if}
