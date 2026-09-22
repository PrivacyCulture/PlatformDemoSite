<script lang="ts">
	import { pages } from '$lib/content';

	const faq = pages.faq;
	const faqs = faq.items;

	let open = $state(0);
</script>

<div class="divide-y divide-ink/10 border-y border-ink/10">
	{#each faqs as item, i (item.q)}
		<div>
			<h3>
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
			</h3>
			{#if open === i}
				<p class="pb-5 text-[15px] leading-relaxed font-light text-ink/70">{item.a}</p>
			{/if}
		</div>
	{/each}
</div>

<p class="mt-8 text-[14px] font-light text-ink/60">
	{faq.securityPack.lead}
	<a
		href={faq.securityPack.trustHref}
		class="text-lens no-underline underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
	>
		{faq.securityPack.trustLabel}
	</a>
	{faq.securityPack.or}
	<a
		href={faq.securityPack.demoHref}
		class="text-horizon no-underline underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
	>
		{faq.securityPack.demoLabel}
	</a>.
</p>
