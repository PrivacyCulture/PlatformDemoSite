<script lang="ts">
	import GoldCta from './GoldCta.svelte';
	import { site } from '$lib/site/content';

	let {
		eyebrow = site.demoCta.eyebrow,
		title = site.demoCta.title,
		body = site.demoCta.body,
		micro = site.demoCta.micro
	}: {
		eyebrow?: string;
		title?: string;
		body?: string;
		micro?: string;
	} = $props();

	// Node constellation echoing the Visual ROPA View: one gold hub, satellite nodes on
	// gold-to-lens gradient lines. Purely decorative, hidden from assistive tech.
	const hub = { x: 300, y: 150 };
	const nodes = [
		{ x: 120, y: 60, r: 7, tone: 'lens' },
		{ x: 470, y: 48, r: 6, tone: 'gold' },
		{ x: 90, y: 230, r: 5, tone: 'bone' },
		{ x: 500, y: 236, r: 8, tone: 'lens' },
		{ x: 300, y: 278, r: 5, tone: 'gold' },
		{ x: 410, y: 130, r: 4, tone: 'bone' },
		{ x: 190, y: 160, r: 4, tone: 'gold' }
	] as const;
	const stroke = { lens: '#009bcc', gold: '#d4af6a', bone: 'rgba(247,250,252,0.55)' } as const;
</script>

<section
	class="on-ink demo-cta relative isolate w-full overflow-hidden rounded-2xl border border-gold/25 bg-ink text-bone shadow-[0_28px_80px_rgba(11,18,32,0.35),inset_0_1px_0_rgba(247,250,252,0.06)]"
>
	<!-- Depth: horizon-blue wash bottom right, gold bloom top left, gold hairline along the top. -->
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_110%,rgba(16,51,137,0.55),transparent_55%),radial-gradient(ellipse_at_-5%_-20%,rgba(212,175,106,0.22),transparent_45%)]"
	></div>
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,106,0.9)_30%,rgba(0,155,204,0.7)_70%,transparent)]"
	></div>

	<div class="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12 lg:p-14">
		<div class="min-w-0">
			<p class="flex items-center gap-3 text-[12px] tracking-[0.22em] text-gold uppercase">
				<span aria-hidden="true" class="h-px w-8 bg-gold/70"></span>
				{eyebrow}
			</p>
			<h2
				class="mt-4 max-w-[16ch] text-[clamp(1.9rem,3.9vw,3rem)] leading-[1.06] font-bold tracking-tight text-bone"
			>
				{title}
			</h2>
			<p class="mt-4 max-w-[46ch] text-[16px] leading-relaxed font-light text-bone/75">{body}</p>
			<div class="mt-8 flex flex-wrap items-center gap-5">
				<GoldCta href={site.demoHref} label={site.demoCta.primaryLabel} />
				<a
					href={site.overviewHref}
					target="_blank"
					rel="noopener noreferrer"
					class="group inline-flex min-h-11 cursor-pointer items-center gap-2 text-[14px] font-medium text-bone/80 no-underline transition-colors duration-200 hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					{site.video.label}
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4 text-lens transition-transform duration-200 group-hover:translate-x-0.5"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M5 12h14M13 6l6 6-6 6" />
					</svg>
				</a>
			</div>
			{#if micro}
				<p class="mt-5 text-[13px] font-light text-bone/50">{micro}</p>
			{/if}
		</div>

		<div aria-hidden="true" class="constellation hidden lg:block">
			<svg viewBox="0 0 600 320" class="h-auto w-full">
				<defs>
					<linearGradient id="demo-cta-line" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stop-color="#d4af6a" stop-opacity="1" />
						<stop offset="100%" stop-color="#009bcc" stop-opacity="0.9" />
					</linearGradient>
					<radialGradient id="demo-cta-hub">
						<stop offset="0%" stop-color="#d4af6a" stop-opacity="0.35" />
						<stop offset="100%" stop-color="#d4af6a" stop-opacity="0" />
					</radialGradient>
				</defs>

				{#each nodes as n (n.x + '-' + n.y)}
					<line x1={hub.x} y1={hub.y} x2={n.x} y2={n.y} stroke="url(#demo-cta-line)" stroke-width="1.6" />
				{/each}
				<line x1={nodes[0].x} y1={nodes[0].y} x2={nodes[6].x} y2={nodes[6].y} stroke="rgba(247,250,252,0.28)" stroke-width="1" stroke-dasharray="3 5" />
				<line x1={nodes[1].x} y1={nodes[1].y} x2={nodes[5].x} y2={nodes[5].y} stroke="rgba(247,250,252,0.28)" stroke-width="1" stroke-dasharray="3 5" />
				<line x1={nodes[3].x} y1={nodes[3].y} x2={nodes[4].x} y2={nodes[4].y} stroke="rgba(247,250,252,0.28)" stroke-width="1" stroke-dasharray="3 5" />

				<circle cx={hub.x} cy={hub.y} r="62" fill="url(#demo-cta-hub)" />
				<circle class="pulse" cx={hub.x} cy={hub.y} r="30" fill="none" stroke="#d4af6a" stroke-opacity="0.35" stroke-width="1" />
				<circle cx={hub.x} cy={hub.y} r="20" fill="#103389" stroke="#d4af6a" stroke-width="2" />
				<circle cx={hub.x} cy={hub.y} r="5" fill="#d4af6a" />

				{#each nodes as n, i (i)}
					<circle cx={n.x} cy={n.y} r={n.r + 6} fill={stroke[n.tone]} fill-opacity="0.16" />
					<circle cx={n.x} cy={n.y} r={n.r} fill="#0b1220" stroke={stroke[n.tone]} stroke-width="2" />
				{/each}
			</svg>
		</div>
	</div>
</section>

<style>
	.pulse {
		transform-origin: 300px 150px;
		transform-box: view-box;
		animation: demo-cta-pulse 3.2s ease-out infinite;
	}

	@keyframes demo-cta-pulse {
		0% {
			transform: scale(0.85);
			opacity: 0.9;
		}
		100% {
			transform: scale(1.9);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pulse {
			animation: none;
			opacity: 0.4;
		}
	}
</style>
