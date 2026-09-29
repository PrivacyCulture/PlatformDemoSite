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
			<img class="block aspect-video w-full bg-white object-cover" src={posterUrl} alt={label} decoding="async" />
		</div>
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
				class="absolute inset-0 cursor-pointer bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold"
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
