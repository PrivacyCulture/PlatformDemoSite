<script lang="ts">
	import { pages } from '$lib/content';
	import { rich } from '$lib/site/rich';

	const faq = pages.faq;

	let {
		items = faq.items,
		headingLevel = 'h3',
		idPrefix = 'faq'
	}: {
		items?: { q: string; a: string }[];
		/** h2 on the standalone /faq page, h3 when nested under a section heading. */
		headingLevel?: 'h2' | 'h3';
		/** Keeps panel ids unique when two accordions share a page. */
		idPrefix?: string;
	} = $props();

	let open = $state(0);
</script>

<div class="divide-y divide-ink/10 border-y border-ink/10">
	{#each items as item, i (item.q)}
		{@const expanded = open === i}
		<div>
			<svelte:element this={headingLevel} class="m-0">
				<button
					type="button"
					id="{idPrefix}-trigger-{i}"
					class="group flex w-full cursor-pointer items-start justify-between gap-4 py-5 text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
					aria-expanded={expanded}
					aria-controls="{idPrefix}-panel-{i}"
					onclick={() => (open = expanded ? -1 : i)}
				>
					<span
						class="text-[1.05rem] leading-snug font-bold tracking-tight text-heading transition-colors duration-200 group-hover:text-lens"
					>
						{item.q}
					</span>
					<svg
						viewBox="0 0 24 24"
						class="mt-1.5 h-4 w-4 shrink-0 text-gold transition-transform duration-200 {expanded
							? 'rotate-180'
							: ''}"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M6 9l6 6 6-6" />
					</svg>
				</button>
			</svelte:element>

			<!-- Kept in the DOM so answer engines can read every answer; `inert` takes the
			     collapsed copy out of the tab order and the accessibility tree. -->
			<div class="faq-panel" class:open={expanded}>
				<div
					class="faq-panel-inner"
					id="{idPrefix}-panel-{i}"
					role="region"
					aria-labelledby="{idPrefix}-trigger-{i}"
					inert={!expanded}
				>
					<p class="rt pb-5 text-[15px] leading-relaxed font-light text-ink/70">{@html rich(item.a)}</p>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	/* Height animates via grid rows, so the answer can stay in the DOM and the
	   transition runs on the compositor rather than reflowing on every frame. */
	.faq-panel {
		display: grid;
		grid-template-rows: 0fr;
		opacity: 0;
		transition:
			grid-template-rows 0.28s ease,
			opacity 0.2s ease;
	}

	.faq-panel.open {
		grid-template-rows: 1fr;
		opacity: 1;
	}

	.faq-panel-inner {
		min-height: 0;
		overflow: hidden;
	}

	@media (prefers-reduced-motion: reduce) {
		.faq-panel {
			transition: none;
		}
	}

	@media print {
		.faq-panel {
			grid-template-rows: 1fr;
			opacity: 1;
		}
	}
</style>
