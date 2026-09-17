<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import MountainScene from '$lib/components/site/MountainScene.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import ProblemPager from '$lib/components/site/ProblemPager.svelte';
	import { site } from '$lib/site/content';

	const functions = [
		{
			title: 'Re-attestation on a clock',
			body: 'Every processor carries a review date. Terms, certifications and sub-processor lists are re-confirmed before they go stale, not after.'
		},
		{
			title: 'Sub-processor changes tracked',
			body: 'Log each sub-processor a vendor uses and keep the change history, so a quiet move of data to a new region is visible when it happens.'
		},
		{
			title: 'Impact you can trace',
			body: 'A vendor issue shows every processing activity, system and data subject group it touches, so the response is proportionate rather than guessed.'
		}
	];
</script>

<svelte:head>
	<title>Vendor Risk That Goes Quiet — {site.brand}</title>
	<meta
		name="description"
		content="Vendors watched continuously, not vetted once. Re-attestation schedules, sub-processor tracking and a live link from every processor to the activities it supports."
	/>
</svelte:head>

<PageHero
	eyebrow="Problem"
	title="You vetted the vendor two years ago. Who has checked since?"
	body="Due diligence at onboarding is a moment. Vendors change sub-processors, move data, get acquired and let certifications lapse. Keep processors on a re-attestation schedule and tie them to the activities they serve, so a change on their side becomes a task on yours."
	primary={{ label: 'Book a demo', href: site.demoHref }}
	secondary={{ label: 'See the platform', href: '/platform' }}
	micro={site.pricing.micro}
/>

<section class="mt-14 w-full sm:mt-20">
	<div class="w-full">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">In the platform</p>
		<h2 class="text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
			The vendors that need you this week.
		</h2>
		<p class="mt-4 text-[16px] leading-relaxed font-light text-ink/70">
			This is the third parties requiring attention list. Every processor on it has a reason to
			be there: a high risk rating, a DPA that is still pending or was never signed, or an
			assessment that has never happened. Each row shows the business unit that owns the
			relationship, the current DPA status, when the vendor was last assessed and when the next
			review falls due, with overdue dates picked out in red. Export it to CSV when procurement
			or the auditor wants the list.
		</p>
	</div>
	<figure class="mt-8 w-full sm:mt-10">
		<picture>
			<source srcset="/Images/screenshots/vendor-overview-status-screen.webp" type="image/webp" />
			<img
				src="/Images/screenshots/vendor-overview-status-screen.png"
				alt="A table of third parties requiring attention, listing each vendor's category, business unit, risk rating, DPA status, last assessment, next review date and the reason it needs attention."
				width="2048"
				height="1152"
				class="block h-auto w-full drop-shadow-[0_24px_60px_rgba(11,18,32,0.14)]"
				loading="lazy"
				decoding="async"
			/>
		</picture>
	</figure>
</section>

<MountainScene side="left" class="mt-16 sm:mt-24">
	<section class="w-full">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Functionality</p>
		<h2 class="max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
			Onboarding is where it starts, not where it ends.
		</h2>
		<ul class="mt-8 grid gap-4 sm:grid-cols-3">
			{#each functions as item, i (item.title)}
				<li class="rounded-2xl border border-lens/50 bg-transparent p-5">
					<p class="font-mono text-[10px] tracking-[0.18em] text-gold tabular-nums">
						{String(i + 1).padStart(2, '0')}
					</p>
					<h3 class="mt-2 text-[1.05rem] leading-snug font-bold tracking-tight">{item.title}</h3>
					<p class="mt-2 text-[14px] leading-relaxed font-light text-ink/70">{item.body}</p>
				</li>
			{/each}
		</ul>
	</section>
</MountainScene>

<MountainScene side="right" class="mt-16 sm:mt-24">
	<PricingStrip />
</MountainScene>

<div class="mt-10 w-full">
	<DemoCtaBlock
		title="Put your processors on a clock."
		body="Book a demo to see re-attestation schedules, sub-processor change tracking and the trace from a vendor issue to every activity it touches."
	/>
</div>

<ProblemPager current="/vendor-drift" />
