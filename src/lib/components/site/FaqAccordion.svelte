<script lang="ts">
	const faqs = [
		{
			q: 'Who is the Privacy Culture Platform designed for?',
			a: 'It is designed for mid-market privacy teams that need stronger oversight than spreadsheets provide, without taking on an enterprise-scale privacy platform implementation. Our focus is UK organisations with roughly 1,000 to 5,000 employees.'
		},
		{
			q: 'What is included at launch?',
			a: 'At launch, the platform includes Tasks, ROPA, Incidents, Vendors, Operational Assessments, and Risks. All modules are fully connected and included together rather than sold as separate feature-gated tiers.'
		},
		{
			q: 'Can you import our existing ROPA?',
			a: 'Yes. We import existing ROPA data from Excel as part of our assisted onboarding process to ensure your Visual ROPA View is live quickly.'
		},
		{
			q: 'How quickly can we get live?',
			a: 'Our launch commitment is to get your Visual ROPA View live within 30 days, subject to standard data availability, agreed scope, and customer participation.'
		},
		{
			q: 'Do you offer a free trial?',
			a: 'We do not offer an anonymous, self-serve trial at this time. Following a brief demo, controlled product access can be arranged once we understand your operational context and data structures.'
		},
		{
			q: 'How much does it cost?',
			a: 'Pricing starts at £800 per month for organisations with up to 2,500 employees and £1,600 per month for 2,501 to 5,000 employees. Pricing is based on a 12-month agreement and includes all launch modules.'
		},
		{
			q: 'What security assurances are available?',
			a: 'Privacy Culture holds Cyber Essentials certification, and the Platform undergoes independent penetration testing. Detailed security collateral, including our standard DPA and sub-processor list, is accessible directly on our dedicated Trust & Security page.'
		}
	];

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
	Need the security pack?
	<a
		href="/trust"
		class="text-lens no-underline underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
	>
		Open the Trust & Security page
	</a>
	or
	<a
		href="/demo"
		class="text-horizon no-underline underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
	>
		book a demo
	</a>.
</p>
