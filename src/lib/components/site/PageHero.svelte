<script lang="ts">
	import GoldCta from './GoldCta.svelte';
	import LensCta from './LensCta.svelte';
	import LogoStrip from './LogoStrip.svelte';
	import { rich } from '$lib/site/rich';

	let {
		eyebrow,
		title,
		titleLines,
		body,
		primary,
		secondary,
		micro,
		logos = true,
		children,
		under
	}: {
		eyebrow?: string;
		title: string;
		titleLines?: string[];
		body: string;
		primary?: { label: string; href: string; external?: boolean };
		secondary?: { label: string; href?: string; onSelect?: () => void; external?: boolean };
		micro?: string;
		/** The trusted-by logo strip under the hero. A page that places it elsewhere turns it off. */
		logos?: boolean;
		children?: import('svelte').Snippet;
		/** Drawn under the side element (the video) in the split layout, or under the text without one. */
		under?: import('svelte').Snippet;
	} = $props();

	const split = $derived(Boolean(children));
	const lines = $derived(titleLines?.length ? titleLines : [title]);
</script>

<header
	class={[
		'w-full',
		split
			? 'flex min-h-[calc(min(78vh,46rem)-5.5rem)] flex-col py-6'
			: 'pt-6 sm:pt-10'
	]}
>
	{#if split}
		<div class="flex flex-1 flex-col justify-center">
			<!-- With something under the video (the problem pager), wide screens use a grid so the right
			     column ends level with the bottom of the buttons: text, buttons and micro take rows 1-3 on
			     the left, the video and pager span rows 1-2 on the right, and the 1fr first row absorbs
			     any difference in height. Without it, the two columns are centred as before. -->
			<div
				class={[
					'flex flex-col gap-8',
					under
						? 'lg:grid lg:grid-cols-[minmax(0,36rem)_min(40rem,46%)] lg:grid-rows-[1fr_auto_auto] lg:justify-between lg:gap-x-10 lg:gap-y-0'
						: 'lg:flex-row lg:items-center lg:justify-between lg:gap-10'
				]}
			>
				<div class={['hero-main min-w-0 max-w-[36rem]', under && 'lg:contents']}>
					<div class={under && 'lg:col-start-1 lg:row-start-1 lg:self-end'}>
					{#if eyebrow}
						<p
							class="mb-4 text-[12px] tracking-[0.2em] text-lens uppercase sm:text-[13px] sm:tracking-[0.22em]"
						>
							{eyebrow}
						</p>
					{/if}
					<h1
						class="text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.04] font-bold tracking-tight text-heading"
					>
						{#each lines as line, i (line)}
							{#if i > 0}<br />{/if}{line}
						{/each}
					</h1>
					<p class="rt mt-5 max-w-[46ch] text-[15px] leading-relaxed font-light text-ink/70">
						{@html rich(body)}
					</p>
					</div>

					{#if primary || secondary}
						<div class={['mt-8 flex flex-wrap items-center gap-5', under && 'lg:col-start-1 lg:row-start-2']}>
							{#if primary}
								<GoldCta href={primary.href} label={primary.label} external={primary.external} />
							{/if}
							{#if secondary}
								<LensCta
									href={secondary.href}
									label={secondary.label}
									external={secondary.external}
									onclick={secondary.onSelect}
								/>
							{/if}
						</div>
					{/if}
					{#if micro}
						<p class={['rt mt-4 text-[13px] font-light text-ink/50', under && 'lg:col-start-1 lg:row-start-3']}>
							{@html rich(micro)}
						</p>
					{/if}
				</div>

				<div
					class={[
						'hero-specs w-full max-w-[40rem] shrink-0',
						under ? 'lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-end' : 'lg:w-[min(40rem,46%)]'
					]}
				>
					{@render children?.()}
					{@render under?.()}
				</div>
			</div>
		</div>
		{#if logos}
			<div class="mt-8 lg:mt-10">
				<LogoStrip />
			</div>
		{/if}
	{:else}
		{#if eyebrow}
			<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{eyebrow}</p>
		{/if}
		<h1
			class="max-w-[18ch] text-[clamp(2.2rem,5.8vw,4.1rem)] leading-[1.04] font-bold tracking-tight text-heading"
		>
			{title}
		</h1>
		<p class="rt mt-5 max-w-[52ch] text-[16px] leading-relaxed font-light text-ink/70">
			{@html rich(body)}
		</p>
		{#if primary || secondary}
			<div class="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
				{#if primary}
					<GoldCta href={primary.href} label={primary.label} external={primary.external} />
				{/if}
				{#if secondary}
					<LensCta
						href={secondary.href}
						label={secondary.label}
						external={secondary.external}
						onclick={secondary.onSelect}
					/>
				{/if}
			</div>
		{/if}
		{#if micro}
			<p class="rt mt-4 text-[13px] font-light text-ink/50">{@html rich(micro)}</p>
		{/if}
		{#if under}
			<div class="max-w-[36rem]">{@render under()}</div>
		{/if}
		{#if logos}
			<div class="mt-10 sm:mt-12">
				<LogoStrip />
			</div>
		{/if}
	{/if}
</header>
