<script lang="ts">
	import { pages, pageTitle } from '$lib/content';

	const copy = pages.dpa;
</script>

<svelte:head>
	<title>{pageTitle(copy.meta.title)}</title>
	<meta name="description" content={copy.meta.description} />
</svelte:head>

<article class="w-full max-w-3xl pt-6 sm:pt-10">
	<p class="mb-6">
		<a
			href={copy.backHref}
			class="text-[13px] tracking-wide text-bone/70 no-underline transition-colors hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
		>
			{copy.backLabel}
		</a>
	</p>

	<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{copy.eyebrow}</p>
	<h1 class="text-[clamp(2rem,5vw,3.4rem)] leading-[1.04] font-bold tracking-tight">
		{copy.title}
	</h1>
	<p class="mt-4 text-[14px] font-light text-bone/55">
		{copy.dateline}
	</p>

	<div class="mt-8 space-y-6 text-[15px] leading-relaxed font-light text-bone/80">
		<p>{copy.intro}</p>
		{#each copy.sections as section (section.title)}
			<section>
				<h2 class="text-[1.15rem] font-bold tracking-tight text-bone">{section.title}</h2>
				<p class="mt-2">{section.body}</p>
			</section>
		{/each}
		<section>
			<h2 class="text-[1.15rem] font-bold tracking-tight text-bone">{copy.subProcessors.title}</h2>
			<p class="mt-2">
				{copy.subProcessors.before}
				<a
					href={copy.subProcessors.linkHref}
					class="text-lens no-underline underline-offset-4 hover:underline"
				>
					{copy.subProcessors.linkLabel}
				</a>{copy.subProcessors.after}
			</p>
		</section>
	</div>

	<button
		type="button"
		onclick={() => window.print()}
		class="mt-10 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-gold px-7 py-3 text-[14px] font-semibold tracking-wide text-gold-ink transition-all hover:-translate-y-0.5 hover:bg-[#e0c07a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
	>
		{copy.printLabel}
	</button>
</article>
