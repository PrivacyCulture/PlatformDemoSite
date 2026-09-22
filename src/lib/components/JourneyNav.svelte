<script lang="ts">
	import { NAV_JUMPS } from '$lib/journey/beats';
	import type { SiteContent } from '$lib/content';
	import { site } from '$lib/content';

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

	function handleLink(link: SiteContent['site']['nav']['links'][number]) {
		if (link.jump === 'platform') onJump(jumps.platform);
		else if (link.jump === 'hero') onHome();
		menuOpen = false;
	}
</script>

<header
	class="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5"
>
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
		<!-- translate-y lands the link baselines on the logo wordmark's baseline -->
		<nav aria-label={copy.ariaLabel} class="hidden translate-y-[5px] items-center gap-7 whitespace-nowrap lg:flex">
			{#each copy.links as link (link.label)}
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
			{/each}
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
				class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-bone/15 text-bone transition-colors hover:border-lens/40 hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens lg:hidden"
				aria-expanded={menuOpen}
				aria-controls="journey-mobile-nav"
				onclick={() => (menuOpen = !menuOpen)}
			>
				<span class="sr-only">{menuOpen ? copy.closeMenu : copy.openMenu}</span>
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
					{#if menuOpen}
						<path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" />
					{:else}
						<path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" stroke-width="1.6" />
					{/if}
				</svg>
			</button>
		</div>
	</div>
</header>

{#if menuOpen}
	<nav
		id="journey-mobile-nav"
		aria-label={copy.mobileAriaLabel}
		class="fixed inset-x-0 top-[4.25rem] z-40 border-b border-bone/10 bg-ink/95 px-5 py-4 backdrop-blur-md lg:hidden sm:top-[4.75rem]"
	>
		<ul class="flex flex-col gap-1">
			{#each copy.links as link (link.label)}
				<li>
					{#if link.href}
						<a
							href={link.href}
							class="block rounded-lg px-3 py-3 text-[15px] text-bone no-underline hover:bg-white/[0.03]"
						>
							{link.label}
						</a>
					{:else}
						<button
							type="button"
							onclick={() => handleLink(link)}
							class="block w-full cursor-pointer rounded-lg px-3 py-3 text-left text-[15px] text-bone hover:bg-white/[0.03]"
						>
							{link.label}
						</button>
					{/if}
				</li>
			{/each}
			<li class="mt-2 px-3 sm:hidden">
				<a
					href={copy.demo.href}
					onclick={() => (menuOpen = false)}
					class="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-lens px-5 py-2.5 text-[14px] font-semibold tracking-wide text-white no-underline shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					{copy.demo.label}
					<span aria-hidden="true">{copy.arrow}</span>
				</a>
			</li>
		</ul>
	</nav>
{/if}
