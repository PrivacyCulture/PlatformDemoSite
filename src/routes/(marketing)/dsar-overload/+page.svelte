<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import MountainScene from '$lib/components/site/MountainScene.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import ProblemPager from '$lib/components/site/ProblemPager.svelte';
	import { site } from '$lib/site/content';

	const functions = [
		{
			title: 'Connected estate lookup',
			body: 'Subject records resolve against live processing activities, systems, and owners — not a scavenger hunt through inboxes.'
		},
		{
			title: 'Routed collection tasks',
			body: 'Department leads get a precise request for the systems they own, with a timestamped trail back to privacy.'
		},
		{
			title: 'Incident linkage',
			body: 'If a breach or lost device is in play, the same map shows which processing activities and vendors sit in the blast radius.'
		}
	];
</script>

<svelte:head>
	<title>DSAR Overload — {site.brand}</title>
	<meta
		name="description"
		content="Stop manually chasing department leads for data locations. When your estate is connected, locating data subject records takes minutes instead of weeks."
	/>
</svelte:head>

<PageHero
	eyebrow="Problem"
	title="More than five DSARs a month, and you can't keep up?"
	body="Stop manually chasing department leads for data locations. When your estate is connected to operational systems, locating data subject records takes minutes instead of weeks."
	primary={{ label: 'Book a demo', href: site.demoHref }}
	secondary={{ label: 'See the platform', href: '/platform' }}
	micro={site.pricing.micro}
/>

<blockquote
	class="mt-12 max-w-4xl border-l-2 border-gold pl-5 text-[clamp(1.2rem,2.4vw,1.55rem)] leading-snug font-bold tracking-tight"
>
	“Regulators don't measure good intentions; they measure statutory deadlines.”
</blockquote>

<section class="mt-14 w-full sm:mt-20">
	<div class="w-full">
		<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">In the platform</p>
		<h2 class="text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
			Every open request against its statutory clock.
		</h2>
		<p class="mt-4 text-[16px] leading-relaxed font-light text-ink/70">
			This is the DSAR Overview. Across the top sit the numbers that matter on a Monday morning:
			how many requests are open, how many arrived this month, how many are past their statutory
			deadline or due within seven days, which have extensions running and the share closed inside
			30 days. Below that the requests break down by the right being exercised, the channel they
			came in through, the volume month by month and where identity verification has got to, so you
			can see the pattern behind the backlog rather than one request at a time.
		</p>
	</div>
	<figure class="mt-8 w-full sm:mt-10">
		<picture>
			<source srcset="/Images/screenshots/dsr-overview-screen.webp" type="image/webp" />
			<img
				src="/Images/screenshots/dsr-overview-screen.png"
				alt="The DSAR Overview dashboard with counts of open, new, overdue and due-soon requests, the SLA met rate, and charts breaking requests down by right type, monthly volume, intake channel and identity verification status."
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
			The map does the chasing.
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
		title="See a DSAR resolved against the map."
		body="Book a 25-minute demo and watch a subject request go from inbox to located records in less time than it takes to draft the first chase email."
	/>
</div>

<ProblemPager current="/dsar-overload" />
