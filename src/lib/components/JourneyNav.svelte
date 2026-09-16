<script lang="ts">
	import { NAV_JUMPS } from '$lib/journey/beats';
	import type { JourneyContent } from '$lib/journey/content';

	let {
		onHome,
		onJump,
		jumps = NAV_JUMPS,
		copy
	}: {
		onHome: () => void;
		onJump: (progress: number) => void;
		jumps?: { hero: number; platform: number };
		copy: JourneyContent['nav'];
	} = $props();

	let menuOpen = $state(false);

	function handleLink(link: JourneyContent['nav']['links'][number]) {
		if (link.jump === 'platform') onJump(jumps.platform);
		else if (link.jump === 'hero') onHome();
		menuOpen = false;
	}
</script>

<header
	class="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5"
>
	<div class="flex min-w-0 items-center gap-6 sm:gap-10">
		<a
			href="/"
			class="shrink-0 no-underline transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
			aria-label="PrivacyCulture — home"
			onclick={(e) => {
				if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
					e.preventDefault();
					onHome();
					menuOpen = false;
				}
			}}
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
			{#each copy.links as link (link.label)}
				{#if link.href}
					<a
						href={link.href}
						class="rounded text-[14px] tracking-normal text-bone no-underline transition-colors hover:text-bone/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
						target={link.href.startsWith('http') ? '_blank' : undefined}
						rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
					>
						{link.label}
					</a>
				{:else}
					<button
						type="button"
						onclick={() => handleLink(link)}
						class="cursor-pointer rounded text-[14px] tracking-normal text-bone transition-colors hover:text-bone/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
					>
						{link.label}
					</button>
				{/if}
			{/each}
		</nav>
	</div>

	<div class="flex items-center gap-2">
		<a
			href={copy.demo.href}
			onclick={() => (menuOpen = false)}
			class="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-lens px-4 py-2.5 text-[13px] font-semibold tracking-wide text-white no-underline shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens sm:px-5 sm:text-[14px]"
		>
			{copy.demo.label}
			<span aria-hidden="true">→</span>
		</a>

		<button
			type="button"
			class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-bone/15 text-bone transition-colors hover:border-lens/40 hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens md:hidden"
			aria-expanded={menuOpen}
			aria-controls="journey-mobile-nav"
			onclick={() => (menuOpen = !menuOpen)}
		>
			<span class="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
			<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
				{#if menuOpen}
					<path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" />
				{:else}
					<path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" stroke-width="1.6" />
				{/if}
			</svg>
		</button>
	</div>
</header>

{#if menuOpen}
	<nav
		id="journey-mobile-nav"
		aria-label="Mobile"
		class="fixed inset-x-0 top-[4.25rem] z-40 border-b border-bone/10 bg-ink/95 px-5 py-4 backdrop-blur-md md:hidden sm:top-[4.75rem]"
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
		</ul>
	</nav>
{/if}
