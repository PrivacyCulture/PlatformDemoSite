<script lang="ts">
	import { page } from '$app/state';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { allLink, featureItems, isCurrentFeature, type FeaturesMenu } from '$lib/site/features';
	import FeatureIcon from './FeatureIcon.svelte';

	// The desktop Features dropdown: a two-column panel of feature pages, each an icon, a title and
	// a line under it. It opens on a click (or Enter/Space) only, and is a disclosure of plain links, not
	// an ARIA menu, so Tab walks through it as it would any other links.
	let {
		menu,
		arrow,
		tone = 'light',
		open = $bindable(false)
	}: { menu: FeaturesMenu; arrow: string; tone?: 'light' | 'dark'; open?: boolean } = $props();

	const items = $derived(featureItems(menu.items));
	const all = $derived(allLink(menu));
	const path = $derived(page.url.pathname);
	const active = $derived(items.some((item) => isCurrentFeature(item.href, path)));
	const dark = $derived(tone === 'dark');
	const panelId = $props.id();

	let root = $state<HTMLElement>();
	let trigger = $state<HTMLButtonElement>();
	const reduceMotion =
		typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const motion = reduceMotion ? 0 : 1;

	function close(returnFocus = false) {
		open = false;
		if (returnFocus) trigger?.focus();
	}

	$effect(() => {
		void path;
		open = false;
	});

	// A press anywhere outside the trigger and panel closes it.
	$effect(() => {
		if (!open) return;
		const away = (e: PointerEvent) => {
			if (!root?.contains(e.target as Node)) close();
		};
		document.addEventListener('pointerdown', away);
		return () => document.removeEventListener('pointerdown', away);
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (open && e.key === 'Escape') close(true);
	}}
/>

{#if items.length}
	<!-- Focus moving to something outside closes it; a press on the panel's padding (no new focus) does not -->
	<div
		bind:this={root}
		class="contents"
		onfocusout={(e) => {
			const next = e.relatedTarget as Node | null;
			if (next && !root?.contains(next)) close();
		}}
	>
		<button
			type="button"
			bind:this={trigger}
			aria-expanded={open}
			aria-controls={panelId}
			onclick={() => (open = !open)}
			class="-my-3 inline-flex cursor-pointer items-center gap-1.5 rounded py-3 text-[14px] tracking-normal transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens {dark
				? active
					? 'text-lens'
					: open
						? 'text-bone'
						: 'text-bone hover:text-bone/80'
				: active
					? 'text-lens'
					: open
						? 'text-ink'
						: 'text-ink/75 hover:text-ink'}"
		>
			{menu.label}
			<svg
				width="10"
				height="10"
				viewBox="0 0 10 10"
				fill="none"
				aria-hidden="true"
				class="shrink-0 opacity-70 transition-transform duration-200 motion-reduce:transition-none {open ? 'rotate-180' : ''}"
			>
				<path d="M2 3.75 5 6.75 8 3.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>

		{#if open}
			<div
				id={panelId}
				class="absolute top-[calc(100%+1.5rem)] right-0 z-50 w-[42rem] max-w-[calc(100vw-2*var(--spacing-page))] rounded-3xl border p-2 text-left whitespace-normal {dark
					? 'border-bone/10 bg-ink shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)]'
					: 'border-ink/[0.06] bg-white shadow-[0_24px_60px_-12px_rgba(11,18,32,0.28)]'}"
				transition:fly={{ y: -6 * motion, duration: 180 * motion, easing: cubicOut }}
			>
				<ul class="grid grid-cols-2 gap-1">
					{#each items as item, i (i)}
						{@const current = isCurrentFeature(item.href, path)}
						<li>
							<a
								href={item.href}
								aria-current={current ? 'page' : undefined}
								onclick={() => close()}
								class="group flex h-full items-start gap-3.5 rounded-2xl px-4 py-3 no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lens {dark
									? 'hover:bg-white/[0.05]'
									: 'hover:bg-ink/[0.03]'}"
							>
								<FeatureIcon icon={item.icon} {current} {tone} />
								<span class="flex min-w-0 flex-col gap-1">
									<span
										class="text-[14px] leading-snug font-semibold transition-colors group-hover:text-lens {current
											? 'text-lens'
											: dark
												? 'text-bone'
												: 'text-ink'}"
									>
										{item.label}
									</span>
									{#if item.body}
										<span class="line-clamp-2 text-[13px] leading-snug font-light {dark ? 'text-bone/60' : 'text-ink/60'}">
											{item.body}
										</span>
									{/if}
								</span>
							</a>
						</li>
					{/each}
				</ul>

				{#if all}
					<div class="mx-2 mt-1 border-t pt-1 {dark ? 'border-bone/10' : 'border-ink/[0.06]'}">
						<a
							href={all.href}
							onclick={() => close()}
							class="group inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[14px] font-semibold text-lens no-underline focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lens"
						>
							{all.label}
							<span aria-hidden="true" class="transition-transform duration-200 group-hover:translate-x-1">{arrow}</span>
						</a>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
