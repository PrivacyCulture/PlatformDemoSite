<script lang="ts">
	import type { BeatId } from '$lib/journey/beats';
	import type { JourneyShowMe } from '$lib/journey/content';
	import Beat from '$lib/components/Beat.svelte';
	import ShowMeFlash from '$lib/components/ShowMeFlash.svelte';

	/** Matches design: what-if block fades in after the pain holds. */
	const WHAT_IF_DELAY_MS = 1500;
	/** Circle pops in after the what-if lands. */
	const SHOW_ME_DELAY_MS = 2200;

	let {
		id,
		active,
		label,
		pain,
		whatIfRest,
		showMe,
		onAdvance,
		onRetreat,
		class: className = 'scene-copy',
		style
	}: {
		id: BeatId;
		active: boolean;
		label: string;
		pain: string;
		/** Text after "What if " (e.g. "it all told one story?") */
		whatIfRest: string;
		showMe?: JourneyShowMe;
		onAdvance: () => void;
		onRetreat: () => void;
		class?: string;
		style?: string;
	} = $props();

	let showWhatIf = $state(false);
	let showShowMe = $state(false);
	let previewOpen = $state(false);
	let headingEl = $state<HTMLParagraphElement | null>(null);
	let previewTop = $state<number | null>(null);
	const fromRight = $derived(className.includes('from-right'));
	/** Circle sits on the opposite side of the copy. */
	const orbOpposite = $derived(!fromRight);
	/** Screenshot enters from the side opposite the copy. */
	const previewFromRight = $derived(!fromRight);

	/** Below 900px the panel is centred, so anchor it under the header rather than the heading. */
	const MOBILE_PREVIEW_TOP = 80;

	function syncPreviewTop() {
		if (!headingEl) return;
		if (window.matchMedia('(max-width: 900px)').matches) {
			previewTop = MOBILE_PREVIEW_TOP;
			return;
		}
		previewTop = Math.round(headingEl.getBoundingClientRect().top);
	}

	$effect(() => {
		if (!active || !headingEl) {
			previewTop = null;
			return;
		}

		syncPreviewTop();
		const onResize = () => syncPreviewTop();
		window.addEventListener('resize', onResize);
		const observer = new ResizeObserver(syncPreviewTop);
		observer.observe(headingEl);
		const fontsReady = document.fonts?.ready.then(syncPreviewTop);
		const settle = window.setTimeout(syncPreviewTop, 520);

		return () => {
			window.removeEventListener('resize', onResize);
			observer.disconnect();
			window.clearTimeout(settle);
			fontsReady?.catch(() => {});
		};
	});

	$effect(() => {
		if (!active) {
			showWhatIf = false;
			showShowMe = false;
			previewOpen = false;
			return;
		}
		showWhatIf = false;
		showShowMe = false;
		previewOpen = false;
		const whatIfTimer = window.setTimeout(() => {
			showWhatIf = true;
		}, WHAT_IF_DELAY_MS);
		const showMeTimer = window.setTimeout(() => {
			showShowMe = true;
		}, SHOW_ME_DELAY_MS);
		return () => {
			window.clearTimeout(whatIfTimer);
			window.clearTimeout(showMeTimer);
		};
	});

	function togglePreview() {
		syncPreviewTop();
		previewOpen = !previewOpen;
	}
</script>

<Beat {id} {active} {label} class={className} {style}>
	<p
		bind:this={headingEl}
		class={[
			'max-w-[18ch] text-[clamp(1.85rem,4.2vw,3.1rem)] leading-[1.08] font-bold tracking-tight text-bone',
			fromRight && 'ml-auto'
		]}
	>
		{pain}
	</p>

	<div
		class={[
			'mt-8 border-lens pl-5 transition-opacity duration-700',
			fromRight ? 'border-r-2 border-l-0 pr-5 pl-0 text-right' : 'border-l-2',
			showWhatIf ? 'opacity-100' : 'opacity-0'
		]}
	>
		<p
			class={[
				'max-w-[18ch] text-[clamp(1.55rem,3.6vw,2.55rem)] leading-[1.1] font-bold tracking-tight text-bone',
				fromRight && 'ml-auto'
			]}
		>
			<span class="text-lens">What if</span>
			{' '}{whatIfRest}
		</p>
	</div>

	{#if showMe}
		<div
			class={[
				'mt-8 flex w-full items-center',
				orbOpposite ? 'justify-end' : 'justify-start'
			]}
		>
			<ShowMeFlash
				label={showMe.label}
				open={showShowMe}
				reverse={!orbOpposite}
				preview={previewOpen}
				ariaLabel="{showMe.label}: {label}"
				ariaExpanded={previewOpen}
				ariaControls="preview-{id}"
				onclick={togglePreview}
			/>
		</div>
	{/if}

	<div
		class={[
			'mt-8 flex items-center gap-3 transition-opacity duration-500',
			fromRight && 'justify-end',
			showWhatIf ? 'opacity-100' : 'pointer-events-none opacity-0'
		]}
	>
		<button
			type="button"
			onclick={onRetreat}
			aria-label="Previous scene"
			class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-bone/35 bg-ink/50 text-bone shadow-[0_6px_22px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:border-bone/55 hover:bg-ink/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
		>
			<svg
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
		<button
			type="button"
			onclick={onAdvance}
			aria-label="Next scene"
			class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-lens text-white shadow-[0_6px_22px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-0.5 hover:bg-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
		>
			<svg
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M9 18l6-6-6-6" />
			</svg>
		</button>
	</div>
</Beat>

{#if showMe && active}
	<div
		id="preview-{id}"
		class={[
			'feature-preview fixed z-[35] w-[min(42vw,30rem)] max-w-[calc(50vw-2.5rem)]',
			previewFromRight ? 'preview-side-right' : 'preview-side-left',
			previewOpen ? 'is-visible pointer-events-auto' : 'pointer-events-none'
		]}
		style={previewTop != null ? `top: ${previewTop}px; --preview-top: ${previewTop}px` : undefined}
		aria-hidden={!previewOpen}
	>
		<div
			class={[
				'feature-preview-panel flex max-h-[calc(100dvh-var(--preview-top,5rem)-6.5rem)] flex-col overflow-hidden rounded-2xl border border-bone/15 bg-ink/90 shadow-[0_28px_70px_rgba(0,0,0,0.55)] backdrop-blur-md',
				previewFromRight ? 'from-right' : 'from-left'
			]}
		>
			<div class="flex shrink-0 items-center justify-between gap-3 border-b border-bone/10 px-4 py-3">
				<p class="text-[12px] tracking-[0.18em] text-lens uppercase">{label}</p>
				<button
					type="button"
					onclick={() => (previewOpen = false)}
					class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-bone/20 text-bone/70 transition-colors hover:border-bone/40 hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens"
					aria-label="Close preview"
				>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
					</svg>
				</button>
			</div>

			<div class="min-h-0 flex-1 overflow-y-auto">
			{#if showMe.image}
				<div class="bg-white p-[10px]">
					<picture>
						{#if showMe.image.webp}
							<source srcset={showMe.image.webp} type="image/webp" />
						{/if}
						<img
							src={showMe.image.src}
							alt={showMe.image.alt}
							width={showMe.image.width}
							height={showMe.image.height}
							class="block h-auto w-full"
							loading="lazy"
							decoding="async"
						/>
					</picture>
				</div>
				{#if showMe.caption}
					<p class="px-4 pt-3 pb-4 text-[13px] leading-relaxed font-light text-bone/80">
						{showMe.caption}
					</p>
				{/if}
			{:else}
				<!-- Placeholder product UI — swap for real screenshots later -->
				<svg
					class="block h-auto w-full"
					viewBox="0 0 640 400"
					role="img"
					aria-label="Preview of {label}"
				>
					<rect width="640" height="400" fill="#0b1220" />
					<rect x="0" y="0" width="640" height="44" fill="#103389" opacity="0.55" />
					<circle cx="24" cy="22" r="5" fill="#009bcc" />
					<rect x="40" y="17" width="96" height="10" rx="2" fill="#f7fafc" opacity="0.35" />
					<rect x="160" y="17" width="56" height="10" rx="2" fill="#f7fafc" opacity="0.2" />
					<rect x="228" y="17" width="64" height="10" rx="2" fill="#f7fafc" opacity="0.2" />

					<rect x="20" y="64" width="180" height="316" rx="10" fill="#121a2b" stroke="#ffffff" stroke-opacity="0.08" />
					<rect x="36" y="84" width="110" height="10" rx="2" fill="#009bcc" opacity="0.85" />
					{#each [0, 1, 2, 3, 4, 5] as row (row)}
						<rect
							x="36"
							y={118 + row * 36}
							width={140 - (row % 3) * 18}
							height="10"
							rx="2"
							fill="#f7fafc"
							opacity={0.18 + (row % 2) * 0.08}
						/>
					{/each}

					<rect x="220" y="64" width="400" height="150" rx="10" fill="#121a2b" stroke="#ffffff" stroke-opacity="0.08" />
					<rect x="240" y="84" width="160" height="12" rx="2" fill="#f7fafc" opacity="0.4" />
					<rect x="240" y="110" width="280" height="8" rx="2" fill="#f7fafc" opacity="0.16" />
					<rect x="240" y="128" width="240" height="8" rx="2" fill="#f7fafc" opacity="0.12" />
					<rect x="240" y="158" width="88" height="28" rx="14" fill="#009bcc" />
					<rect x="344" y="164" width="72" height="16" rx="2" fill="#f7fafc" opacity="0.2" />

					<rect x="220" y="232" width="190" height="148" rx="10" fill="#121a2b" stroke="#ffffff" stroke-opacity="0.08" />
					<circle cx="315" cy="292" r="34" fill="none" stroke="#009bcc" stroke-width="8" stroke-dasharray="140 80" />
					<rect x="280" y="340" width="70" height="8" rx="2" fill="#f7fafc" opacity="0.2" />

					<rect x="430" y="232" width="190" height="148" rx="10" fill="#121a2b" stroke="#ffffff" stroke-opacity="0.08" />
					{#each [0, 1, 2, 3, 4] as bar (bar)}
						<rect
							x={452 + bar * 30}
							y={340 - (bar + 1) * 16}
							width="18"
							height={(bar + 1) * 16}
							rx="3"
							fill="#009bcc"
							opacity={0.35 + bar * 0.12}
						/>
					{/each}
				</svg>

			{/if}

			{#if showMe.href}
				<div class="border-t border-bone/10 px-4 py-3 text-right">
					<a
						href={showMe.exploreHref ?? showMe.href}
						class="inline-flex items-center gap-1.5 text-[13px] font-medium text-lens no-underline transition-colors hover:text-[#2eb8e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens"
					>
						Explore {label}
						<span aria-hidden="true">→</span>
					</a>
				</div>
			{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.feature-preview {
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 0.45s ease,
			visibility 0.45s ease;
	}

	.feature-preview.preview-side-right {
		left: calc(50% + clamp(1.25rem, 3vw, 2.75rem));
		right: auto;
	}

	.feature-preview.preview-side-left {
		right: calc(50% + clamp(1.25rem, 3vw, 2.75rem));
		left: auto;
	}

	.feature-preview.is-visible {
		opacity: 1;
		visibility: visible;
	}

	.feature-preview-panel {
		will-change: transform, opacity, filter;
	}

	.feature-preview-panel.from-right {
		transform-origin: 8% 0%;
		animation: preview-swing-out-right 0.42s ease both;
	}

	.feature-preview-panel.from-left {
		transform-origin: 92% 0%;
		animation: preview-swing-out-left 0.42s ease both;
	}

	.feature-preview.is-visible .feature-preview-panel.from-right {
		animation: preview-swing-in-right 0.92s cubic-bezier(0.22, 0.82, 0.28, 1) both;
	}

	.feature-preview.is-visible .feature-preview-panel.from-left {
		animation: preview-swing-in-left 0.92s cubic-bezier(0.22, 0.82, 0.28, 1) both;
	}

	@media (max-width: 900px) {
		.feature-preview {
			width: min(88vw, 26rem);
			max-width: none;
		}

		.feature-preview.preview-side-right,
		.feature-preview.preview-side-left {
			left: 50%;
			right: auto;
			transform: translateX(-50%);
		}

		.feature-preview-panel.from-right,
		.feature-preview-panel.from-left {
			transform-origin: 50% 0%;
			animation: preview-swing-out-up 0.4s ease both;
		}

		.feature-preview.is-visible .feature-preview-panel.from-right,
		.feature-preview.is-visible .feature-preview-panel.from-left {
			animation: preview-swing-in-up 0.88s cubic-bezier(0.22, 0.82, 0.28, 1) both;
		}
	}

	@keyframes preview-swing-in-right {
		0% {
			transform: translateX(16vw) scale(0.9) rotate(7deg);
			opacity: 0;
			filter: blur(10px);
		}
		58% {
			transform: translateX(-0.55%) scale(1.015) rotate(-3.2deg);
			opacity: 1;
			filter: blur(0);
		}
		78% {
			transform: translateX(0.22%) scale(1) rotate(1.35deg);
		}
		100% {
			transform: translateX(0) scale(1) rotate(0deg);
			opacity: 1;
			filter: blur(0);
		}
	}

	@keyframes preview-swing-in-left {
		0% {
			transform: translateX(-16vw) scale(0.9) rotate(-7deg);
			opacity: 0;
			filter: blur(10px);
		}
		58% {
			transform: translateX(0.55%) scale(1.015) rotate(3.2deg);
			opacity: 1;
			filter: blur(0);
		}
		78% {
			transform: translateX(-0.22%) scale(1) rotate(-1.35deg);
		}
		100% {
			transform: translateX(0) scale(1) rotate(0deg);
			opacity: 1;
			filter: blur(0);
		}
	}

	@keyframes preview-swing-out-right {
		from {
			transform: translateX(0) scale(1) rotate(0deg);
			opacity: 1;
			filter: blur(0);
		}
		to {
			transform: translateX(10vw) scale(0.92) rotate(5deg);
			opacity: 0;
			filter: blur(8px);
		}
	}

	@keyframes preview-swing-out-left {
		from {
			transform: translateX(0) scale(1) rotate(0deg);
			opacity: 1;
			filter: blur(0);
		}
		to {
			transform: translateX(-10vw) scale(0.92) rotate(-5deg);
			opacity: 0;
			filter: blur(8px);
		}
	}

	@keyframes preview-swing-in-up {
		0% {
			transform: translateY(2.8rem) scale(0.92) rotate(-3deg);
			opacity: 0;
			filter: blur(10px);
		}
		58% {
			transform: translateY(-0.28rem) scale(1.015) rotate(2.2deg);
			opacity: 1;
			filter: blur(0);
		}
		78% {
			transform: translateY(0.1rem) scale(1) rotate(-0.9deg);
		}
		100% {
			transform: translateY(0) scale(1) rotate(0deg);
			opacity: 1;
			filter: blur(0);
		}
	}

	@keyframes preview-swing-out-up {
		from {
			transform: translateY(0) scale(1) rotate(0deg);
			opacity: 1;
			filter: blur(0);
		}
		to {
			transform: translateY(2rem) scale(0.94) rotate(2deg);
			opacity: 0;
			filter: blur(8px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.feature-preview,
		.feature-preview-panel {
			transition: none;
		}

		.feature-preview-panel.from-right,
		.feature-preview-panel.from-left,
		.feature-preview.is-visible .feature-preview-panel.from-right,
		.feature-preview.is-visible .feature-preview-panel.from-left {
			animation: none;
			transform: none;
			opacity: 1;
			filter: none;
		}
	}
</style>
