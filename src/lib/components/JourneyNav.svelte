<script lang="ts">
	import { NAV_JUMPS } from '$lib/journey/beats';

	let {
		onJump,
		playing = false,
		onTogglePlay
	}: {
		onJump: (progress: number) => void;
		playing?: boolean;
		onTogglePlay: () => void;
	} = $props();
</script>

<nav
	aria-label="Main"
	class="fixed top-[22px] left-1/2 z-40 flex -translate-x-1/2 items-center gap-5 rounded-full border border-bone/15 bg-ink/55 px-4 py-2.5 text-xs tracking-[0.14em] uppercase backdrop-blur-md sm:gap-6 sm:px-5"
>
	<button
		type="button"
		onclick={onTogglePlay}
		aria-label={playing ? 'Pause auto tour' : 'Play auto tour'}
		aria-pressed={playing}
		class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-lens/40 bg-lens/15 text-lens transition-colors hover:border-lens hover:bg-lens/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
	>
		{#if playing}
			<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<rect x="6" y="5" width="4" height="14" rx="1" />
				<rect x="14" y="5" width="4" height="14" rx="1" />
			</svg>
		{:else}
			<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M8 5.14v13.72L19 12 8 5.14z" />
			</svg>
		{/if}
	</button>

	<span class="flex items-center gap-2 text-sm tracking-normal normal-case">
		<span class="h-4 w-4 rounded-full border-2 border-lens" aria-hidden="true"></span>
		<span class="hidden sm:inline">Privacy Platform</span>
	</span>
	<span class="links hidden items-center gap-5 sm:flex">
		<button
			type="button"
			onclick={() => onJump(NAV_JUMPS.free)}
			class="rounded text-bone-dim no-underline transition-colors hover:text-bone focus-visible:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
		>
			Free
		</button>
		<button
			type="button"
			onclick={() => onJump(NAV_JUMPS.platform)}
			class="rounded text-bone-dim no-underline transition-colors hover:text-bone focus-visible:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
		>
			The Platform
		</button>
	</span>
	<button
		type="button"
		onclick={() => onJump(NAV_JUMPS.start)}
		class="cta rounded-full bg-lens px-4 py-2 font-medium tracking-normal text-ink normal-case no-underline transition-colors hover:bg-[#7BE6D6]"
	>
		Start free
	</button>
</nav>
