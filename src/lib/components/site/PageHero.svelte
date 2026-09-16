<script lang="ts">
	import GoldCta from './GoldCta.svelte';
	import LensCta from './LensCta.svelte';
	import LogoStrip from './LogoStrip.svelte';

	let {
		eyebrow,
		title,
		titleLines,
		body,
		primary,
		secondary,
		micro,
		children
	}: {
		eyebrow?: string;
		title: string;
		titleLines?: string[];
		body: string;
		primary?: { label: string; href: string; external?: boolean };
		secondary?: { label: string; href?: string; onSelect?: () => void; external?: boolean };
		micro?: string;
		children?: import('svelte').Snippet;
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
			<div class="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
				<div class="hero-main min-w-0 max-w-[36rem]">
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
					<p class="mt-5 max-w-[46ch] text-[15px] leading-relaxed font-light text-ink/70">
						{body}
					</p>

					{#if primary || secondary}
						<div class="mt-8 flex flex-wrap items-center gap-5">
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
						<p class="mt-4 text-[13px] font-light text-ink/50">{micro}</p>
					{/if}
				</div>

				<div class="hero-specs w-full max-w-[40rem] shrink-0 lg:max-w-[min(40rem,46vw)]">
					{@render children?.()}
				</div>
			</div>
		</div>
		<div class="mt-8 lg:mt-10">
			<LogoStrip />
		</div>
	{:else}
		{#if eyebrow}
			<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{eyebrow}</p>
		{/if}
		<h1
			class="max-w-[18ch] text-[clamp(2.2rem,5.8vw,4.1rem)] leading-[1.04] font-bold tracking-tight text-heading"
		>
			{title}
		</h1>
		<p class="mt-5 max-w-[52ch] text-[16px] leading-relaxed font-light text-ink/70">
			{body}
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
			<p class="mt-4 text-[13px] font-light text-ink/50">{micro}</p>
		{/if}
		<div class="mt-10 sm:mt-12">
			<LogoStrip />
		</div>
	{/if}
</header>
