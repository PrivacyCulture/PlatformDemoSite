<script lang="ts">
	import { site } from '$lib/site/content';
</script>

<svelte:head>
	<title>Standard DPA — {site.brand}</title>
	<meta
		name="description"
		content="Public summary of the Privacy Culture Platform standard Data Processing Addendum, including UK residency, encryption, and sub-processor transparency."
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

	<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">Standard DPA</p>
	<h1 class="text-[clamp(2rem,5vw,3.4rem)] leading-[1.04] font-bold tracking-tight">
		Data Processing Addendum
	</h1>
	<p class="mt-4 text-[14px] font-light text-bone/55">
		Public terms summary · Privacy Culture Ltd · September 2026
	</p>

	<div class="mt-8 space-y-6 text-[15px] leading-relaxed font-light text-bone/80">
		<p>
			This page is the openly published summary of our standard Data Processing Addendum. The
			executable DPA is issued with the order form. Use your browser’s print dialog to save a PDF
			copy.
		</p>
		<section>
			<h2 class="text-[1.15rem] font-bold tracking-tight text-bone">Processor</h2>
			<p class="mt-2">
				Privacy Culture Ltd, registered in England & Wales, acts as processor for customer personal
				data hosted in the Privacy Culture Platform.
			</p>
		</section>
		<section>
			<h2 class="text-[1.15rem] font-bold tracking-tight text-bone">Nature of processing</h2>
			<p class="mt-2">
				Records and workflows that support privacy operations, including tasks, ROPA, incidents,
				vendors, operational assessments, and risks.
			</p>
		</section>
		<section>
			<h2 class="text-[1.15rem] font-bold tracking-tight text-bone">Location and security</h2>
			<p class="mt-2">
				Customer data is hosted in the United Kingdom (AWS UK Region), in tier-3 data centres, with
				AES-256 encryption at rest and TLS 1.3 in transit. Privacy Culture holds Cyber Essentials
				certification. The Platform undergoes independent penetration testing.
			</p>
		</section>
		<section>
			<h2 class="text-[1.15rem] font-bold tracking-tight text-bone">Sub-processors</h2>
			<p class="mt-2">
				Sub-processors are published on the
				<a
					href="/sub-processors"
					class="text-lens no-underline underline-offset-4 hover:underline"
				>
					sub-processor list
				</a>.
			</p>
		</section>
	</div>

	<button
		type="button"
		onclick={() => window.print()}
		class="mt-10 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-gold px-7 py-3 text-[14px] font-semibold tracking-wide text-gold-ink transition-all hover:-translate-y-0.5 hover:bg-[#e0c07a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
	>
		Print or save as PDF
	</button>
</article>
