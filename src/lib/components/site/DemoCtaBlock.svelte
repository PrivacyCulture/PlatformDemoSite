<script lang="ts">
	import GoldCta from './GoldCta.svelte';
	import { site } from '$lib/site/content';
	import { rich } from '$lib/site/rich';
	import { asset } from '$lib/content/assets';

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

	// The second link's words and address. Set in the CMS on the Next step box; blank is what this
	// box showed before it had a link of its own — the video label, to the overview address.
	// The file does not carry the keys until one is set, so they are read loosely.
	const cta = site.demoCta as typeof site.demoCta & { secondaryLabel?: string; secondaryHref?: string };
	const secondaryLabel = $derived(cta.secondaryLabel?.trim() || site.video.label);
	const secondaryHref = $derived(cta.secondaryHref?.trim() || site.overviewHref);
	// Only a link that leaves the site opens a new tab.
	const external = $derived(/^https?:\/\//i.test(secondaryHref));

	// The picture in the right-hand column, set in the CMS on the Next step box (`demoCta.image`).
	// The default is the node constellation that used to be drawn here, now a file under static/
	// so Sorted can swap it for any image. A blank alt keeps it decorative.
	const image = $derived(site.demoCta.image);
	const imageSrc = $derived(image?.src?.trim() ? asset(image.src.trim()) : '');
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
			<p class="rt mt-4 max-w-[46ch] text-[16px] leading-relaxed font-light text-bone/75">{@html rich(body)}</p>
			<div class="mt-8 flex flex-wrap items-center gap-5">
				<GoldCta href={site.demoHref} label={site.demoCta.primaryLabel} />
				<a
					href={secondaryHref}
					target={external ? '_blank' : undefined}
					rel={external ? 'noopener noreferrer' : undefined}
					class="group inline-flex min-h-11 cursor-pointer items-center gap-2 text-[14px] font-medium text-bone/80 no-underline transition-colors duration-200 hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					{secondaryLabel}
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
				<p class="rt mt-5 text-[13px] font-light text-bone/50">{@html rich(micro)}</p>
			{/if}
		</div>

		{#if imageSrc}
			<div class="hidden lg:block">
				<img
					src={imageSrc}
					alt={image.alt ?? ''}
					width={image.width}
					height={image.height}
					class="block h-auto w-full"
					loading="lazy"
					decoding="async"
				/>
			</div>
		{/if}
	</div>
</section>

