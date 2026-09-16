<script lang="ts">
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import ExplainerVideo from '$lib/components/site/ExplainerVideo.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import PricingStrip from '$lib/components/site/PricingStrip.svelte';
	import { site } from '$lib/site/content';

	let explainerOpen = $state(false);

	function playWhenVisible(node: HTMLVideoElement) {
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const playIfIdle = () => {
			if (reducedMotion.matches || !node.paused) return;
			void node.play().catch(() => {});
		};

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) playIfIdle();
			},
			{ threshold: 0.4 }
		);
		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	const capabilities = [
		{
			title: 'Visual ROPA View',
			body: 'Replace flat records with a live, visual map of data flows, processing activities, and system dependencies.',
			href: '/platform/living-ropa'
		},
		{
			title: 'Automated Task Routing',
			body: 'Distribute ownership across business functions while retaining central privacy governance and audit trails.',
			href: '/platform/connected-view'
		},
		{
			title: 'Integrated Vendor & Risk Tracking',
			body: 'Automatically calculate risk scores, log vendor processing terms, and monitor third-party sub-processors.',
			href: '/platform/vendor-risk'
		},
		{
			title: 'Incident & DSAR Logging',
			body: 'Connect data subject requests and security incidents directly to the underlying systems and processing activities involved.',
			href: '/dsar-overload'
		}
	];

	const problems = [
		{
			title: 'DSAR overload',
			body: 'Locate data subject records in minutes instead of weeks.',
			href: '/dsar-overload'
		},
		{
			title: 'Audit readiness',
			body: 'Keep a continuous evidence log instead of scrambling before review.',
			href: '/audit-readiness'
		},
		{
			title: 'Training that misses the risk',
			body: 'Point education at operational weak spots, not generic tick-boxes.',
			href: '/training-budget'
		}
	];
</script>

<svelte:head>
	<title>The Platform — {site.brand}</title>
	<meta
		name="description"
		content="The Privacy Culture Platform links the records and workflows that support day-to-day privacy operations. Start with the Visual ROPA View, then dive into operational detail when you need it."
	/>
</svelte:head>

<PageHero
	eyebrow="The Platform"
	title="Total visibility across your privacy estate."
	titleLines={['Total visibility', 'across your privacy estate.']}
	body="The Privacy Culture Platform links the records and workflows that support day-to-day privacy operations. Start with the big picture in the Visual ROPA View, then dive into operational detail when you need it."
	primary={{ label: 'Book a demo', href: site.demoHref }}
	secondary={{
		label: 'Watch the 2-minute overview',
		onSelect: () => (explainerOpen = true)
	}}
>
	<ExplainerVideo bind:open={explainerOpen} compact />
</PageHero>

<section class="mt-4 w-full sm:mt-8">
	<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Key capabilities</p>
	<h2 class="max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
		One estate. Four connected operational layers.
	</h2>
	<ul class="mt-8 grid gap-4 sm:grid-cols-2">
		{#each capabilities as item, i (item.title)}
			<li class="rounded-2xl border border-lens/50 bg-transparent p-5">
				<p class="font-mono text-[10px] tracking-[0.18em] text-gold tabular-nums">
					{String(i + 1).padStart(2, '0')}
				</p>
				<h3 class="mt-2 text-[1.15rem] leading-snug font-bold tracking-tight">{item.title}</h3>
				<p class="mt-2 text-[14px] leading-relaxed font-light text-ink/70">{item.body}</p>
				<a
					href={item.href}
					class="mt-4 inline-flex text-[13px] font-medium text-lens no-underline underline-offset-4 transition-colors hover:text-gold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					See how it works →
				</a>
			</li>
		{/each}
	</ul>
</section>

<section class="mt-16 w-full sm:mt-24">
	<div class="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
		<div class="min-w-0">
			<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">How it fits together</p>
			<h2
				class="max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight"
			>
				From the map down to the task.
			</h2>
			<p class="mt-3 max-w-[50ch] text-[15px] leading-relaxed font-light text-ink/70">
				Start in the Visual ROPA View, open the record that needs attention, and let routing carry
				the work to the right owner — with board-ready governance sitting underneath.
			</p>
		</div>
		<video
			use:playWhenVisible
			class="aspect-video w-full border-0 object-cover outline-none"
			src="/clips/RopaVideo.mp4"
			playsinline
			muted
			preload="metadata"
			aria-label="How the Visual ROPA View fits together"
		></video>
	</div>
</section>

<section class="mt-16 w-full sm:mt-24">
	<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">Problems this solves</p>
	<h2 class="max-w-[16ch] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight font-bold tracking-tight">
		Clarity where the work actually breaks.
	</h2>
	<ul class="mt-8 divide-y divide-ink/10 border-y border-ink/10">
		{#each problems as item (item.href)}
			<li>
				<a
					href={item.href}
					class="group flex cursor-pointer items-start justify-between gap-4 py-5 no-underline transition-colors hover:bg-ink/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					<div>
						<p class="text-[1.15rem] font-bold tracking-tight text-ink">{item.title}</p>
						<p class="mt-1 max-w-[46ch] text-[14px] leading-relaxed font-light text-ink/70">
							{item.body}
						</p>
					</div>
					<span
						class="mt-1 hidden text-ink/35 transition-transform group-hover:translate-x-1 group-hover:text-lens sm:inline"
						aria-hidden="true">→</span
					>
				</a>
			</li>
		{/each}
	</ul>
</section>

<div class="mt-16 w-full sm:mt-24">
	<PricingStrip />
</div>

<div class="mt-10 w-full">
	<DemoCtaBlock />
</div>
