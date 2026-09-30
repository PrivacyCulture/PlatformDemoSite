<script lang="ts">
	import { onMount, tick } from 'svelte';
	import FaqAccordion from '$lib/components/site/FaqAccordion.svelte';
	import SiteFooter from '$lib/components/site/SiteFooter.svelte';
	import { pages } from '$lib/content';
	import { plain } from '$lib/site/rich';
	import type { FaqDrawerCopy } from '$lib/site/faq-drawer';

	/**
	 * The FAQ on the homepage: a round button bottom right, and a full-width panel that rises from
	 * the bottom while the journey's fixed layers lift by the same height, so the video moves up
	 * and the questions appear beneath it. It is not real height at the foot of the page, because
	 * the journey maps the whole document's scroll to the video — extra height would move every
	 * beat. While open the page does not scroll, so the video holds still.
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
		root.classList.add('faq-open');
		return () => {
			root.style.overflow = before;
			root.classList.remove('faq-open');
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

<!-- A click on the lifted video closes the panel; keyboard users have Escape and Close. -->
<div
	class="faq-backdrop fixed inset-x-0 top-0 z-[45] print:hidden"
	class:open
	role="presentation"
	onclick={hide}
></div>

<!-- Always in the server-rendered HTML so crawlers and answer engines read every answer;
     `inert` takes the closed sheet out of the tab order and the accessibility tree. -->
<div
	id="faq-sheet"
	class="faq-sheet fixed inset-x-0 bottom-0 z-[46] w-full"
	class:open
	role="dialog"
	aria-modal="true"
	aria-labelledby="faq-sheet-heading"
	inert={!open}
>
	<div
		class="relative flex h-[var(--faq-sheet-h)] flex-col overflow-hidden bg-white text-ink shadow-[0_-16px_48px_rgba(4,6,10,0.35)]"
	>
		<div class="flex shrink-0 items-center justify-between gap-4 px-page pt-5 pb-3 sm:pt-6">
			<div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
				<h2
					bind:this={heading}
					id="faq-sheet-heading"
					tabindex="-1"
					class="text-[1.05rem] font-bold tracking-tight text-heading focus:outline-none"
				>
					{plain(copy.eyebrow)}
				</h2>
				<p class="font-mono text-[11px] tracking-[0.16em] text-ink/65 tabular-nums uppercase">
					{String(copy.items.length).padStart(2, '0')}
					{copy.countLabel}
				</p>
			</div>
			<button
				type="button"
				class="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-lens text-white shadow-[0_0_0_1px_rgba(0,155,204,0.35),0_6px_16px_rgba(0,155,204,0.25)] transition-colors duration-200 hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens"
				aria-label={labels.closeLabel}
				title={labels.closeLabel}
				onclick={hide}
			>
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- The questions, then the same footer the inner pages end on, scrolling together. -->
		<div class="faq-sheet-body min-h-0 flex-1 overflow-y-auto">
			<div class="px-page pb-10">
				<FaqAccordion headingLevel="h3" idPrefix="home-faq" />
				<p class="mt-4">
				<a
					href="/platform"
					class="inline-flex min-h-11 items-center text-[14px] font-medium text-horizon no-underline underline-offset-4 transition-colors duration-200 hover:text-lens hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					{labels.allLink}
					</a>
				</p>
			</div>
			<SiteFooter />
		</div>
	</div>
</div>

<button
	bind:this={trigger}
	type="button"
	class="faq-trigger group fixed right-5 z-[44] inline-flex h-[50px] w-14 cursor-pointer items-start justify-center rounded-2xl text-white transition-opacity duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens print:hidden"
	class:hidden-while-open={open}
	tabindex={open ? -1 : 0}
	aria-expanded={open}
	aria-controls="faq-sheet"
	aria-label={labels.openLabel}
	title={labels.openLabel}
	onclick={() => void show()}
>
	<!-- A speech bubble with its tail at the bottom right, pointing at the corner it sits in. -->
	<svg viewBox="0 0 56 50" class="faq-bubble absolute inset-0 h-full w-full" aria-hidden="true">
		<path
			d="M10.5 1H45.5A9.5 9.5 0 0 1 55 10.5V29.5A9.5 9.5 0 0 1 45.5 39H44L47 48L35 39H10.5A9.5 9.5 0 0 1 1 29.5V10.5A9.5 9.5 0 0 1 10.5 1Z"
			class="fill-lens transition-colors duration-200 group-hover:fill-[#2eb8e0]"
		/>
	</svg>
	<!-- Centred in the bubble's body (y 1–39 of 50), not in the button, which includes the tail. -->
	<span class="absolute inset-x-0 top-px flex h-[38px] items-center justify-center pt-px text-[13px] leading-none font-bold tracking-[0.06em]" aria-hidden="true">FAQ</span>
</button>

<style>
	.faq-backdrop {
		bottom: var(--faq-sheet-h);
		pointer-events: none;
	}

	.faq-backdrop.open {
		pointer-events: auto;
	}

	/* Rises from below the fold with the same duration and easing as .journey-lift, so the panel
	   and the video move as one surface. Transform only, on the compositor. */
	.faq-sheet {
		transform: translateY(100%);
		transition: transform 0.44s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.faq-sheet.open {
		transform: translateY(0);
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

	.faq-bubble {
		filter: drop-shadow(0 0 14px rgba(0, 155, 204, 0.35)) drop-shadow(0 8px 14px rgba(0, 0, 0, 0.35));
		overflow: visible;
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
