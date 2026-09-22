<script lang="ts">
	import { pages, pageTitle } from '$lib/content';

	const copy = pages.faq;
	const faqs = copy.items;

	let open = $state(0);
</script>

<svelte:head>
	<title>{pageTitle(copy.meta.title)}</title>
	<meta name="description" content={copy.meta.description} />
</svelte:head>

<header class="w-full max-w-3xl pt-6 sm:pt-10">
	<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{copy.eyebrow}</p>
	<h1 class="text-[clamp(2.2rem,5.5vw,3.75rem)] leading-[1.04] font-bold tracking-tight">
		{copy.title}
	</h1>
</header>

<div class="mt-10 w-full max-w-3xl divide-y divide-bone/10 border-y border-bone/10">
	{#each faqs as item, i (item.q)}
		<div>
			<h2>
				<button
					type="button"
					class="flex w-full cursor-pointer items-start justify-between gap-4 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
					aria-expanded={open === i}
					onclick={() => (open = open === i ? -1 : i)}
				>
					<span class="text-[1.05rem] leading-snug font-bold tracking-tight">{item.q}</span>
					<span class="mt-1 font-mono text-[13px] text-gold" aria-hidden="true">
						{open === i ? '–' : '+'}
					</span>
				</button>
			</h2>
			{#if open === i}
				<p class="pb-5 text-[15px] leading-relaxed font-light text-bone/75">{item.a}</p>
			{/if}
		</div>
	{/each}
</div>

<p class="mt-10 max-w-3xl text-[14px] font-light text-bone/65">
	{copy.securityPack.lead}
	<a
		href={copy.securityPack.trustHref}
		class="text-lens no-underline underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
	>
		{copy.securityPack.trustLabel}
	</a>
	{copy.securityPack.or}
	<a
		href={copy.securityPack.demoHref}
		class="text-gold no-underline underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
	>
		{copy.securityPack.demoLabel}
	</a>.
</p>
