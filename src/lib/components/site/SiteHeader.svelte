<script lang="ts">
	import { page } from '$app/state';
	import { site } from '$lib/site/content';

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
	class="relative z-40 flex items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5"
>
	<div class="flex min-w-0 items-center gap-6 sm:gap-10">
		<a
			href="/"
			class="shrink-0 no-underline transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
			aria-label="PrivacyCulture — home"
		>
			<img
				src="/brand/privacyculture-logo.png"
				alt="PrivacyCulture"
				class="h-7 w-auto sm:h-8"
				width="220"
				height="36"
				decoding="async"
			/>
		</a>

		<nav aria-label="Main" class="hidden items-center gap-7 md:flex">
			{#each site.nav.links as link (link.href)}
				<a
					href={link.href}
					aria-current={isCurrent(link.href) ? 'page' : undefined}
					class="rounded text-[14px] tracking-normal no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens {isCurrent(
						link.href
					)
						? 'text-lens'
						: 'text-ink/75 hover:text-ink'}"
				>
					{link.label}
				</a>
			{/each}
		</nav>
	</div>

	<div class="flex items-center gap-2">
		<a
			href={site.nav.demo.href}
			aria-current={isCurrent(site.nav.demo.href) ? 'page' : undefined}
			class="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-lens px-4 py-2.5 text-[13px] font-semibold tracking-wide text-white no-underline shadow-[0_8px_28px_rgba(0,155,204,0.25)] transition-colors hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens sm:px-5 sm:text-[14px]"
		>
			{site.nav.demo.label}
			<span aria-hidden="true">→</span>
		</a>

		<button
			type="button"
			class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-lens/40 hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens md:hidden"
			aria-expanded={open}
			aria-controls="mobile-nav"
			onclick={() => (open = !open)}
		>
			<span class="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
			<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
				{#if open}
					<path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" />
				{:else}
					<path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" stroke-width="1.6" />
				{/if}
			</svg>
		</button>
	</div>
</header>

{#if open}
	<nav
		id="mobile-nav"
		aria-label="Mobile"
		class="border-b border-ink/10 bg-white/95 px-5 py-4 backdrop-blur-md md:hidden"
	>
		<ul class="flex flex-col gap-1">
			{#each site.nav.links as link (link.href)}
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
			{/each}
			<li>
				<a
					href="/platform#faq"
					class="block rounded-lg px-3 py-3 text-[15px] text-ink no-underline hover:bg-ink/[0.03]"
				>
					FAQ
				</a>
			</li>
		</ul>
	</nav>
{/if}
