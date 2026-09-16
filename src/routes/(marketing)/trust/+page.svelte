<script lang="ts">
	import GoldCta from '$lib/components/site/GoldCta.svelte';
	import LensCta from '$lib/components/site/LensCta.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import TrustSnapshot from '$lib/components/site/TrustSnapshot.svelte';
	import { site } from '$lib/site/content';

	const pillars = [
		{
			id: 'cyber-essentials',
			title: 'Cyber Essentials Certified',
			body: 'Fully compliant with UK Government-backed cybersecurity practices to safeguard against common online threats.'
		},
		{
			id: 'pen-test',
			title: 'Independent Penetration Testing',
			body: 'The Platform undergoes regular third-party penetration testing. Executive summaries and remediation logs are available to prospective customers under NDA.'
		},
		{
			id: 'residency',
			title: 'UK Data Residency & Encryption',
			body: 'Customer data is hosted strictly within tier-3 UK data centres, protected by AES-256 encryption at rest and TLS 1.3 in transit.'
		},
		{
			id: 'contracts',
			title: 'Contractual Transparency',
			body: 'Standard Data Processing Addendums (DPA), sub-processor registers, and security contact protocols are published openly without gating behind sales calls.'
		}
	];
</script>

<svelte:head>
	<title>Security & Trust Center — {site.brand}</title>
	<meta
		name="description"
		content="Built for privacy teams that demand technical rigor, data residency guarantees, and full compliance transparency."
	/>
</svelte:head>

<PageHero
	eyebrow="Trust & Security"
	title="Security & Trust Center"
	body="Built for privacy teams that demand technical rigor, data residency guarantees, and full compliance transparency."
	primary={{ label: 'Download standard DPA', href: '/dpa' }}
	secondary={{ label: 'Book a demo', href: site.demoHref }}
/>

<section class="mt-14 w-full sm:mt-20">
	<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Security pillars</p>
	<ul class="grid gap-4 sm:grid-cols-2">
		{#each pillars as item, i (item.id)}
			<li
				id={item.id}
				class="scroll-mt-24 rounded-2xl border border-lens/50 bg-transparent p-5"
			>
				<p class="font-mono text-[10px] tracking-[0.18em] text-gold tabular-nums">
					{String(i + 1).padStart(2, '0')}
				</p>
				<h2 class="mt-2 text-[1.15rem] leading-snug font-bold tracking-tight">{item.title}</h2>
				<p class="mt-2 text-[14px] leading-relaxed font-light text-ink/70">{item.body}</p>
			</li>
		{/each}
	</ul>
</section>

<section class="mt-16 w-full sm:mt-24">
	<TrustSnapshot />
	<div class="mt-6 flex flex-wrap gap-3">
		<GoldCta href="/dpa" label="Read the standard DPA" />
		<LensCta href="/sub-processors" label="Sub-processor list" />
	</div>
</section>
