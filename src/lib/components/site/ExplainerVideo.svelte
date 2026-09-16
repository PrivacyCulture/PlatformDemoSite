<script lang="ts">
	import { site } from '$lib/site/content';

	let {
		src = site.video.src,
		label = site.video.label,
		compact = false,
		open = $bindable(false)
	}: {
		src?: string;
		label?: string;
		compact?: boolean;
		open?: boolean;
	} = $props();

	let triggerEl = $state<HTMLButtonElement | null>(null);
	let modalVideo = $state<HTMLVideoElement | null>(null);
	let closeBtn = $state<HTMLButtonElement | null>(null);

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}

	function openModal() {
		open = true;
		void modalVideo?.play();
		queueMicrotask(() => closeBtn?.focus());
	}

	function closeModal() {
		open = false;
		const video = modalVideo;
		if (video) {
			video.pause();
			video.currentTime = 0;
		}
		triggerEl?.focus();
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) closeModal();
	}

	$effect(() => {
		if (!open) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});

	$effect(() => {
		if (open) void modalVideo?.play();
	});
</script>

<svelte:window onkeydown={onKeydown} />

<div class="w-full" id={compact ? 'overview' : undefined}>
	{#if !compact}
		<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Explainer</p>
		<h2 class="text-[clamp(1.6rem,3.2vw,2.2rem)] leading-tight font-bold tracking-tight">{label}</h2>
	{/if}

	<button
		bind:this={triggerEl}
		type="button"
		onclick={openModal}
		aria-haspopup="dialog"
		aria-expanded={open}
		aria-controls="explainer-modal"
		class={[
			'group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-gold/20 bg-black text-left shadow-[0_24px_80px_rgba(4,6,10,0.225)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold',
			compact ? '' : 'mt-6'
		]}
	>
		<video
			class="aspect-video w-full bg-black object-cover"
			{src}
			muted
			playsinline
			preload="metadata"
			aria-hidden="true"
		>
			<track kind="captions" src="/clips/overview-captions.vtt" srclang="en" label="English" />
		</video>
		<span
			class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b1220]/28 transition-colors group-hover:bg-[#0b1220]/18"
		>
			<span
				class="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-gold-ink shadow-[0_0_32px_rgba(212,175,106,0.4)] transition-transform group-hover:scale-[1.04]"
				aria-hidden="true"
			>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
					<path d="M8 5.14v13.72L19.06 12 8 5.14z" />
				</svg>
			</span>
			<span class="text-[14px] font-semibold tracking-wide text-bone [text-shadow:0_1px_14px_rgba(4,6,10,0.7)]"
				>{label}</span
			>
		</span>
	</button>
</div>

<div
	use:portal
	id="explainer-modal"
	class={['explainer-overlay', open && 'is-open']}
	role="dialog"
	aria-modal="true"
	aria-label={label}
	aria-hidden={!open}
	inert={!open}
>
	<button
		type="button"
		class="explainer-backdrop"
		onclick={closeModal}
		tabindex={open ? 0 : -1}
		aria-label="Dismiss video"
	></button>
	<div class="explainer-stage">
		<button
			bind:this={closeBtn}
			type="button"
			onclick={closeModal}
			class="explainer-close"
			aria-label="Close video"
			tabindex={open ? 0 : -1}
		>
			<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
				<path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.7" />
			</svg>
		</button>
		<video
			bind:this={modalVideo}
			class="explainer-video"
			{src}
			controls
			playsinline
			preload="metadata"
		>
			<track kind="captions" src="/clips/overview-captions.vtt" srclang="en" label="English" />
		</video>
	</div>
</div>

<style>
	.explainer-overlay {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: grid;
		place-items: center;
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
	}

	.explainer-overlay.is-open {
		opacity: 1;
		visibility: visible;
		pointer-events: auto;
	}

	.explainer-backdrop {
		position: absolute;
		inset: 0;
		cursor: pointer;
		border: 0;
		background: rgba(5, 8, 15, 0.88);
		backdrop-filter: blur(10px);
	}

	.explainer-stage {
		position: relative;
		z-index: 1;
		width: 96vw;
		height: 94vh;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--color-gold) 28%, transparent);
		border-radius: 1rem;
		background: #05080f;
		box-shadow: 0 40px 120px rgba(4, 6, 10, 0.275);
	}

	.explainer-video {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		background: #000;
	}

	.explainer-close {
		position: absolute;
		top: 0.85rem;
		right: 0.85rem;
		z-index: 2;
		display: inline-flex;
		width: 2.75rem;
		height: 2.75rem;
		cursor: pointer;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(247, 250, 252, 0.16);
		border-radius: 999px;
		background: rgba(5, 8, 15, 0.72);
		color: var(--color-bone);
		transition:
			background 160ms ease,
			border-color 160ms ease;
	}

	.explainer-close:hover {
		border-color: color-mix(in srgb, var(--color-gold) 55%, transparent);
		background: rgba(5, 8, 15, 0.9);
	}

	.explainer-close:focus-visible {
		outline: 2px solid var(--color-gold);
		outline-offset: 3px;
	}

	@media (prefers-reduced-motion: reduce) {
		.explainer-backdrop {
			backdrop-filter: none;
		}
	}
</style>
