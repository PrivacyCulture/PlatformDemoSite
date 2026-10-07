<script lang="ts">
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { allLink, featureItems, isCurrentFeature, type FeaturesMenu } from '$lib/site/features';
	import FeatureIcon from './FeatureIcon.svelte';

	// The Features menu inside the phone menu sheet: a row of the sheet's list, where its entry
	// sits among the main links in Sorted, opening in place to show each feature page with a line
	// under it. It starts open on a feature page, so
	// the reader sees where they are.
	let {
		menu,
		arrow,
		tone = 'light',
		onnavigate
	}: { menu: FeaturesMenu; arrow: string; tone?: 'light' | 'dark'; onnavigate?: () => void } = $props();

	const items = $derived(featureItems(menu.items));
	const all = $derived(allLink(menu));
	const path = $derived(page.url.pathname);
	const active = $derived(items.some((item) => isCurrentFeature(item.href, path)));
	const dark = $derived(tone === 'dark');
	const listId = $props.id();

	// The sheet is drawn fresh each time it opens, so this reads the page it opens on.
	// svelte-ignore state_referenced_locally
	let expanded = $state(active);
	const reduceMotion =
		typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const motion = reduceMotion ? 0 : 1;
</script>

{#if items.length}
	<!-- The same divider the link rows draw above themselves, now that this row need not be first. -->
	<li class="{dark ? 'border-bone/[0.08]' : 'border-ink/[0.06]'} [&:not(:first-child)]:border-t">
		<button
			type="button"
			aria-expanded={expanded}
			aria-controls={listId}
			onclick={() => (expanded = !expanded)}
			class="group flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 text-left text-[17px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lens {dark
				? 'text-bone hover:bg-white/[0.04] active:bg-white/[0.06]'
				: active
					? 'text-lens hover:bg-ink/[0.03]'
					: 'text-ink hover:bg-ink/[0.03] active:bg-ink/[0.05]'}"
		>
			<span class="flex items-center gap-3">
				<span
					class="h-1.5 w-1.5 rounded-full transition-colors {active ? 'bg-lens' : dark ? 'bg-bone/25' : 'bg-ink/15'}"
					aria-hidden="true"
				></span>
				{menu.label}
			</span>
			<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="none"
				aria-hidden="true"
				class="shrink-0 transition-transform duration-200 motion-reduce:transition-none {expanded ? 'rotate-180' : ''} {active
					? 'text-lens'
					: dark
						? 'text-bone/40'
						: 'text-ink/35'}"
			>
				<path d="M3.5 6 8 10.5 12.5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>

		{#if expanded}
			<div id={listId} transition:slide={{ duration: 200 * motion, easing: cubicOut }}>
				<ul class="flex flex-col pb-2">
					{#each items as item, i (i)}
						{@const current = isCurrentFeature(item.href, path)}
						<li>
							<!-- The icon tiles start where the rows' dots do, so the entries read as inside the row -->
							<a
								href={item.href}
								aria-current={current ? 'page' : undefined}
								onclick={() => onnavigate?.()}
								class="group flex min-h-14 items-center gap-3 rounded-2xl py-2.5 pr-4 pl-3 no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lens {dark
									? 'hover:bg-white/[0.04] active:bg-white/[0.06]'
									: 'hover:bg-ink/[0.03] active:bg-ink/[0.05]'}"
							>
								<FeatureIcon icon={item.icon} {current} {tone} size="sm" />
								<span class="flex min-w-0 flex-col gap-0.5">
									<span class="text-[16px] leading-snug font-medium {current ? 'text-lens' : dark ? 'text-bone' : 'text-ink'}">
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
					{#if all}
						<li>
							<a
								href={all.href}
								onclick={() => onnavigate?.()}
								class="group flex min-h-12 items-center gap-1.5 rounded-2xl pr-4 pl-[3.5rem] text-[15px] font-semibold text-lens no-underline focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lens"
							>
								{all.label}
								<span aria-hidden="true" class="transition-transform duration-200 group-hover:translate-x-0.5">{arrow}</span>
							</a>
						</li>
					{/if}
				</ul>
			</div>
		{/if}
	</li>
{/if}
