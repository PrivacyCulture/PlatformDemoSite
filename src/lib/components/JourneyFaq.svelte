<script lang="ts">
	import { onMount, tick } from 'svelte';
	import FaqAccordion from '$lib/components/site/FaqAccordion.svelte';
	import { pages } from '$lib/content';
	import { plain } from '$lib/site/rich';
	import type { FaqDrawerCopy } from '$lib/site/faq-drawer';

	/**
	 * The FAQ on the homepage: a round button bottom right, and a sheet that slides up over the
	 * journey. A sheet rather than a panel at the foot of the page, because the journey maps the
	 * whole document's scroll to the video — adding height below it would move every beat.
	 * While open the page does not scroll, so the video holds still behind it.
	 */
	let { labels }: { labels: FaqDrawerCopy } = $props();

	const copy = pages.faq;

	let open = $state(false);
	let heading: HTMLElement | undefined = $state();
	let trigger: HTMLButtonElement | undefined = $state();

	async function show() {
		open = true;
		await tick();
		heading?.focus({ preventScroll: true });
	}

	function hide() {
		open = false;
		trigger?.focus({ preventScroll: true });
	}

	// Hold the journey still while the sheet is open: a wheel over the page would otherwise
	// scrub the video behind it.
	$effect(() => {
		if (!open) return;
		const root = document.documentElement;
		const before = root.style.overflow;
		root.style.overflow = 'hidden';
		return () => {
			root.style.overflow = before;
		};
	});

	onMount(() => {
		if (location.hash === '#faq-sheet') void show();
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && open) hide();
	}}
/>

<!-- The backdrop is a convenience for the pointer; keyboard users have Escape and Close. -->
<div
	class="faq-backdrop fixed inset-0 z-[45] bg-ink/55 print:hidden"
	class:open
	role="presentation"
	onclick={hide}
></div>

<!-- Always in the server-rendered HTML so crawlers and answer engines read every answer;
     `inert` takes the closed sheet out of the tab order and the accessibility tree. -->
<div
	id="faq-sheet"
	class="faq-sheet on-ink fixed inset-x-0 bottom-0 z-[46] mx-auto w-full max-w-3xl px-3 sm:px-5"
	class:open
	role="dialog"
	aria-modal="true"
	aria-labelledby="faq-sheet-heading"
	inert={!open}
>
	<div
		class="relative flex max-h-[min(80dvh,44rem)] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-lens/40 bg-ink/90 shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_-16px_48px_rgba(4,6,10,0.5)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-lens/70 before:to-transparent"
	>
		<div class="flex shrink-0 items-center justify-between gap-4 px-5 pt-5 pb-3 sm:px-7 sm:pt-6">
			<div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
				<h2
					bind:this={heading}
					id="faq-sheet-heading"
					tabindex="-1"
					class="text-[1.05rem] font-bold tracking-tight text-bone focus:outline-none"
				>
					{plain(copy.eyebrow)}
				</h2>
				<p class="font-mono text-[11px] tracking-[0.16em] text-lens tabular-nums uppercase">
					{String(copy.items.length).padStart(2, '0')}
					{copy.countLabel}
				</p>
			</div>
			<button
				type="button"
				class="-mr-2 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-bone/70 transition-colors duration-200 hover:bg-bone/10 hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens"
				aria-label={labels.closeLabel}
				title={labels.closeLabel}
				onclick={hide}
			>
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="faq-sheet-body min-h-0 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-7">
			<FaqAccordion headingLevel="h3" idPrefix="home-faq" tone="dark" />
			<p class="mt-4">
				<a
					href="/faq"
					class="inline-flex min-h-11 items-center text-[14px] font-medium text-lens no-underline underline-offset-4 transition-colors duration-200 hover:text-bone hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					{labels.allLink}
				</a>
			</p>
		</div>
	</div>
</div>

<button
	bind:this={trigger}
	type="button"
	class="faq-trigger fixed right-5 z-[44] inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-lens text-white shadow-[0_0_0_1px_rgba(0,155,204,0.35),0_0_28px_rgba(0,155,204,0.3),0_10px_24px_rgba(0,0,0,0.35)] transition-colors duration-200 hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens print:hidden"
	class:hidden-while-open={open}
	tabindex={open ? -1 : 0}
	aria-expanded={open}
	aria-controls="faq-sheet"
	aria-label={labels.openLabel}
	title={labels.openLabel}
	onclick={() => void show()}
>
	<svg viewBox="6.5 4.5 11 15" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.008" />
	</svg>
</button>

<style>
	.faq-backdrop {
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.24s ease-out;
	}

	.faq-backdrop.open {
		opacity: 1;
		pointer-events: auto;
	}

	/* The sheet slides up from below the fold. Transform and opacity only, so it runs on the
	   compositor over the playing video. */
	.faq-sheet {
		transform: translateY(100%);
		opacity: 0;
		pointer-events: none;
		transition:
			transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
			opacity 0.2s ease-out;
	}

	.faq-sheet.open {
		transform: translateY(0);
		opacity: 1;
		pointer-events: auto;
	}

	.faq-sheet-body {
		overscroll-behavior: contain;
	}

	/* Above the centred legal links, which wrap to three rows on a phone and two on a tablet. */
	.faq-trigger {
		bottom: max(8rem, calc(env(safe-area-inset-bottom) + 7.5rem));
	}

	@media (min-width: 640px) {
		.faq-trigger {
			bottom: max(4.25rem, calc(env(safe-area-inset-bottom) + 3.75rem));
		}
	}

	@media (min-width: 900px) {
		.faq-trigger {
			bottom: max(1.25rem, calc(env(safe-area-inset-bottom) + 1rem));
		}
	}

	.faq-trigger.hidden-while-open {
		opacity: 0;
		pointer-events: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.faq-backdrop,
		.faq-sheet {
			transition: none;
		}
	}
</style>
