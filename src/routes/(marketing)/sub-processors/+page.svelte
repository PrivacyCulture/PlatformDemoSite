<script lang="ts">
	import { pages, pageTitle } from '$lib/content';

	const copy = pages.subProcessors;
	const processors = copy.processors;
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
	<p class="mt-5 max-w-[48ch] text-[16px] leading-relaxed font-light text-bone/75">
		{copy.intro}
	</p>

	<div class="mt-10 overflow-x-auto">
		<table class="w-full min-w-[28rem] border-collapse text-left text-[14px]">
			<thead>
				<tr class="border-b border-bone/15 text-[11px] tracking-[0.16em] text-bone/50 uppercase">
					<th class="py-3 pr-4 font-medium">{copy.columns.name}</th>
					<th class="py-3 pr-4 font-medium">{copy.columns.role}</th>
					<th class="py-3 font-medium">{copy.columns.location}</th>
				</tr>
			</thead>
			<tbody>
				{#each processors as row (row.name)}
					<tr class="border-b border-bone/10">
						<td class="py-3 pr-4 font-semibold">{row.name}</td>
						<td class="py-3 pr-4 font-light text-bone/75">{row.role}</td>
						<td class="py-3">{row.location}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</article>
