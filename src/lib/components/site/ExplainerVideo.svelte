<script lang="ts">
	import { site } from '$lib/site/content';
	import { asset } from '$lib/content/assets';

	let {
		src = site.video.src,
		label = site.video.label,
		// The still shown before playback. Blank = the browser's own first frame.
		poster = site.video.poster,
		// Blank = no captions track (a page's own video may have none).
		captions = site.video.captions,
		compact = false,
		// A still in place of the video: the page has a thumbnail and no file of its own.
		image = false,
		open = $bindable(false)
	}: {
		src?: string;
		label?: string;
		poster?: string;
		captions?: string;
		compact?: boolean;
		image?: boolean;
		open?: boolean;
	} = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let zoomEl = $state<HTMLDialogElement | null>(null);
	let started = $state(false);
	/**
	 * A device with no hover (phones, tablets). The clean poster with an invisible click target
	 * relies on the pointer cursor to say "this plays"; a phone has no cursor, and its browser
	 * only reliably honours a play request that comes straight from a tap on the media itself.
	 * So on touch devices the browser's own controls are there from the start.
	 */
	let touch = $state(false);
	const posterUrl = $derived(poster?.trim() ? asset(poster.trim()) : undefined);

	$effect(() => {
		const query = window.matchMedia('(hover: none)');
		const sync = () => (touch = query.matches);
		sync();
		query.addEventListener('change', sync);
		return () => query.removeEventListener('change', sync);
	});

	/**
	 * Starts playback. Call it synchronously from the user's tap or click: mobile browsers refuse
	 * a play request that is not inside a user gesture, and the request must be made on the spot,
	 * not after a state change has been flushed.
	 */
	export function play() {
		if (image) return;
		started = true;
		open = true;
		const video = videoEl;
		if (!video) return;
		revealIfHidden(video);
		video.play().catch(() => {
			// Refused (no gesture, or the browser wants a tap on the media itself): the native
			// controls are showing now, so the viewer can press the browser's own play button.
		});
	}

	/** Bring the player on screen when a control elsewhere on the page starts it. */
	function revealIfHidden(video: HTMLVideoElement) {
		const rect = video.getBoundingClientRect();
		const viewportH = window.innerHeight || document.documentElement.clientHeight;
		const inView = rect.top >= 0 && rect.bottom <= viewportH;
		if (!inView) video.scrollIntoView({ block: 'center', behavior: 'smooth' });
	}

	$effect(() => {
		if (!open || !videoEl || started) return;
		play();
	});
</script>

<div class="w-full" id={compact ? 'overview' : undefined}>
	{#if !compact && !image}
		<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">{site.video.eyebrow}</p>
	{/if}

	{#if image}
		<!-- A thumbnail with no video: shown as a still where the player would be, nothing to play. -->
		<div
			class={[
				'relative overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(11,18,32,0.1)]',
				compact ? '' : 'mt-6'
			]}
		>
			<!-- Often a screenshot too small to read in the column, so it opens full size on click. -->
			<button
				type="button"
				class="group block w-full cursor-pointer bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold"
				aria-label={label ? `Enlarge: ${label}` : 'Enlarge image'}
				onclick={() => zoomEl?.showModal()}
			>
				<img class="block aspect-video w-full bg-white object-cover" src={posterUrl} alt={label} decoding="async" />
				<!-- Shown on hover or keyboard focus; always on touch, which has no hover to reveal it. -->
				<span
					class={[
						'pointer-events-none absolute right-3 bottom-3 grid h-10 w-10 place-items-center rounded-full bg-ink/70 text-white shadow-lg transition-opacity duration-200',
						touch ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
					]}
					aria-hidden="true"
				>
					<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="7" />
						<path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
					</svg>
				</span>
			</button>
		</div>
		<!-- A native dialog: centred, Esc closes it, focus is held inside and returned afterwards.
		     A click on the dim surround lands on the dialog itself, so that closes it too. -->
		<dialog
			bind:this={zoomEl}
			class="zoom m-auto max-h-none max-w-none cursor-zoom-out bg-transparent p-0 backdrop:bg-ink/80"
			aria-label={label || 'Image'}
			onclick={(e) => {
				if (e.target === zoomEl) zoomEl?.close();
			}}
		>
			<div class="relative">
				<img
					class="block max-h-[90vh] max-w-[94vw] rounded-xl bg-white object-contain shadow-2xl"
					src={posterUrl}
					alt={label}
					decoding="async"
				/>
				<button
					type="button"
					class="absolute top-2 right-2 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-ink/70 text-white hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
					aria-label="Close"
					onclick={() => zoomEl?.close()}
				>
					<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
						<path d="M6 6l12 12M18 6 6 18" />
					</svg>
				</button>
			</div>
		</dialog>
		{#if label}<p class="mt-3 text-[14px] font-semibold tracking-wide text-lens">{label}</p>{/if}
	{:else}
	<div
		class={[
			// isolate: Safari otherwise lets the video's layer escape the rounded clip at the corners.
			'group relative isolate overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(11,18,32,0.1)]',
			compact ? '' : 'mt-6'
		]}
	>
		<video
			bind:this={videoEl}
			class="block aspect-video w-full rounded-[inherit] bg-transparent object-cover"
			{src}
			poster={posterUrl}
			controls={started || touch}
			playsinline
			preload="metadata"
			aria-label={label}
			onplay={() => {
				started = true;
				open = true;
			}}
			onended={() => {
				started = false;
				open = false;
				if (videoEl) videoEl.currentTime = 0;
			}}
		>
			<!-- Always present: a page's own video may have no captions yet, and a track with no src
			     is ignored by the browser. The CMS says so on that page's explainer card. -->
			<track kind="captions" src={captions || undefined} srclang={site.video.captionsLang} label={site.video.captionsLabel} />
		</video>

		{#if !started && !touch}
			<button
				type="button"
				onclick={play}
				class="play-cursor absolute inset-0 bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold"
				aria-label={label}
			></button>
		{/if}
	</div>

	{#if started}
		<p class="mt-3 text-[14px] font-semibold tracking-wide text-lens">{label}</p>
	{:else}
		<button
			type="button"
			onclick={play}
			class="mt-3 inline-flex cursor-pointer items-center bg-transparent p-0 text-[14px] font-semibold tracking-wide text-lens underline-offset-4 transition-colors hover:text-gold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
		>
			{label}
		</button>
	{/if}
{/if}
</div>

<style>
	/* Over a video not yet started, the cursor itself says "play": a dark disc with a white ring
	   and triangle, readable on a light or a dark poster. 32px, the size every browser honours,
	   with the hotspot at its centre. Browsers that refuse the image fall back to the hand. */
	.play-cursor {
		cursor:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14.5' fill='%230b1220' fill-opacity='0.75' stroke='white' stroke-width='1.5'/%3E%3Cpath d='M13 10.5v11l9-5.5z' fill='white'/%3E%3C/svg%3E")
				16 16,
			pointer;
	}
	/* Open the enlarged view with a short fade and grow, not a jump. */
	.zoom[open] {
		animation: zoom-in 180ms ease-out;
	}
	.zoom[open]::backdrop {
		animation: zoom-fade 180ms ease-out;
	}
	@keyframes zoom-in {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
	}
	@keyframes zoom-fade {
		from {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.zoom[open],
		.zoom[open]::backdrop {
			animation: none;
		}
	}
</style>
