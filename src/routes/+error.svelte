<!--
	The page a visitor lands on when nothing answers their address (404), or when a page fails
	while it is being drawn (any other status). Every word on it is read from the site content
	under `pages.notFound`, which Sorted edits as the "Page not found" document: the hero and its
	two buttons, the explainer it carries, the "Where next" links and the copy shown for an error
	that is not a 404. The status code itself comes from the request, never from the file.
-->
<script lang="ts">
	import { page } from '$app/state';
	import DemoCtaBlock from '$lib/components/site/DemoCtaBlock.svelte';
	import ExplainerVideo from '$lib/components/site/ExplainerVideo.svelte';
	import PageHero from '$lib/components/site/PageHero.svelte';
	import SeoHead from '$lib/components/site/SeoHead.svelte';
	import SiteShell from '$lib/components/site/SiteShell.svelte';
	import { pages, pageTitle } from '$lib/content';
	import { isArchived, visibleLinks } from '$lib/site/archive';
	import { explainerFor } from '$lib/site/explainer';
	import { plain, rich } from '$lib/site/rich';

	const copy = pages.notFound;
	const notFound = $derived(page.status === 404);

	// A 404 has its own hero copy; any other failure shows the shorter "something went wrong"
	// words in the same frame, so a visitor is never met by a bare white page.
	const hero = $derived(
		notFound
			? { eyebrow: copy.hero.eyebrow, title: copy.hero.title, body: copy.hero.body }
			: { eyebrow: copy.error.eyebrow, title: copy.error.title, body: copy.error.body }
	);
	// A button whose page has been archived in the CMS is dropped rather than drawn as a dead link.
	const primary = $derived(isArchived(copy.hero.primary.href) ? undefined : copy.hero.primary);
	const secondary = $derived(isArchived(copy.hero.secondary.href) ? undefined : copy.hero.secondary);
	// Absent (content written before the field existed) or anything unrecognised reads as none.
	const showExplainer = $derived(copy.hero.sharedElement === 'explainer-video');
	const links = $derived(visibleLinks(copy.whereNext.items));
</script>

<SeoHead title={pageTitle(plain(notFound ? copy.meta.title : copy.error.eyebrow))} description={copy.meta.description} />

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<SiteShell>
	{#if showExplainer}
		<PageHero
			eyebrow={`${page.status} · ${hero.eyebrow}`}
			title={hero.title}
			body={hero.body}
			{primary}
			{secondary}
			micro={notFound ? copy.hero.micro : undefined}
			logos={false}
		>
			<ExplainerVideo compact {...explainerFor(copy)} />
		</PageHero>
	{:else}
		<PageHero
			eyebrow={`${page.status} · ${hero.eyebrow}`}
			title={hero.title}
			body={hero.body}
			{primary}
			{secondary}
			micro={notFound ? copy.hero.micro : undefined}
			logos={false}
		/>
	{/if}

	{#if links.length}
		<section class="mt-14 w-full sm:mt-20" aria-labelledby="where-next">
			<p class="mb-3 text-[12px] tracking-[0.22em] text-gold uppercase">{copy.whereNext.eyebrow}</p>
			<h2 id="where-next" class="max-w-[22ch] text-[clamp(1.5rem,3vw,2.1rem)] leading-tight font-bold tracking-tight">
				{copy.whereNext.title}
			</h2>
			<ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<!-- Keyed by position: the list is written in the CMS, and a repeated label must not
				     throw during hydration and take the site's router down. -->
				{#each links as item, i (i)}
					<li>
						<a
							href={item.href}
							class="group flex h-full flex-col rounded-2xl border border-lens/50 bg-white/60 p-5 no-underline backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_12px_32px_rgba(11,18,32,0.10)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
						>
							<p class="font-mono text-[10px] tracking-[0.18em] text-gold tabular-nums">
								{String(i + 1).padStart(2, '0')}
							</p>
							<h3 class="mt-2 flex items-center gap-2 text-[1.05rem] leading-snug font-bold tracking-tight text-heading">
								{item.label}
								<svg
									viewBox="0 0 24 24"
									class="h-4 w-4 shrink-0 text-lens transition-transform duration-200 group-hover:translate-x-0.5"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="M5 12h14M13 6l6 6-6 6" />
								</svg>
							</h3>
							{#if item.body}
								<p class="rt mt-2 text-[14px] leading-relaxed font-light text-ink/70">{@html rich(item.body)}</p>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="mt-16 w-full sm:mt-24">
		<DemoCtaBlock />
	</section>
</SiteShell>
