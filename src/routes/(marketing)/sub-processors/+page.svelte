<script lang="ts">
	import { site } from '$lib/site/content';

	const processors = [
		{
			name: 'Amazon Web Services EMEA SARL (UK Region)',
			role: 'Infrastructure hosting',
			location: 'United Kingdom'
		}
	];
</script>

<svelte:head>
	<title>Sub-processor List — {site.brand}</title>
	<meta
		name="description"
		content="Published sub-processor register for the Privacy Culture Platform. Customer data is hosted in the AWS UK Region."
	/>
</svelte:head>

<article class="w-full max-w-3xl pt-6 sm:pt-10">
	<p class="mb-6">
		<a
			href="/trust"
			class="text-[13px] tracking-wide text-bone/70 no-underline transition-colors hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
		>
			← Trust & Security
		</a>
	</p>

	<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">Trust & Governance</p>
	<h1 class="text-[clamp(2rem,5vw,3.4rem)] leading-[1.04] font-bold tracking-tight">
		Sub-processor list
	</h1>
	<p class="mt-5 max-w-[48ch] text-[16px] leading-relaxed font-light text-bone/75">
		Customer data is hosted strictly within the United Kingdom. This register is published without a
		sales gate.
	</p>

	<div class="mt-10 overflow-x-auto">
		<table class="w-full min-w-[28rem] border-collapse text-left text-[14px]">
			<thead>
				<tr class="border-b border-bone/15 text-[11px] tracking-[0.16em] text-bone/50 uppercase">
					<th class="py-3 pr-4 font-medium">Name</th>
					<th class="py-3 pr-4 font-medium">Role</th>
					<th class="py-3 font-medium">Location</th>
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
