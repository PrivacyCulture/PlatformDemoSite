<script lang="ts">
	import { NAV_JUMPS } from '$lib/journey/beats';

	let { onJump }: { onJump: (progress: number) => void } = $props();
</script>

<nav
	aria-label="Main"
	class="fixed top-[22px] left-1/2 z-40 flex -translate-x-1/2 items-center gap-6 rounded-full border border-bone/15 bg-ink/55 px-5 py-2.5 text-xs tracking-[0.14em] uppercase backdrop-blur-md"
>
	<span class="flex items-center gap-2 text-sm tracking-normal normal-case">
		<span class="h-4 w-4 rounded-full border-2 border-lens" aria-hidden="true"></span>
		Privacy Platform
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
