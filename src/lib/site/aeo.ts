// The structured data the site publishes, read off the content and built by $lib/site/schema.ts.
//
// Every page carries the same three entity nodes — the organisation, the website and the
// software — plus its own WebPage and breadcrumb, so a crawler can join any page to the company
// and the product without having to have seen the homepage. Pages add what is theirs: the FAQ its
// FAQPage, a page showing the explainer a VideoObject. Nothing here is invented: every claim is
// read from content that is also drawn on a visible page.

import { aeo, pages, site } from '$lib/content';
import { live } from '$lib/content/runtime';
import type { ExplainerProps } from './explainer';
import { plain } from './rich';
import {
	FAQ_ID,
	SOFTWARE_ID,
	VIDEO_ID,
	breadcrumbNode,
	faqPageNode,
	graph,
	isoDate,
	isoDuration,
	organizationNode,
	softwareNode,
	videoObjectNode,
	webPageNode,
	webSiteNode,
	type Crumb,
	type JsonLdNode
} from './schema';

export { FAQ_ID, SOFTWARE_ID, VIDEO_ID, jsonLdScript } from './schema';

export const featureList: readonly string[] = live((c) => c.aeo.featureList, 'array');

/**
 * What the organisation is expert in, for `knowsAbout`. A short list of real subjects, not the
 * search phrases in aeo.searchTerms: those stay in the content file as a copywriting checklist
 * and are no longer published anywhere, because a list of phrases nobody reads is keyword
 * stuffing whichever part of the page carries it.
 */
export const KNOWS_ABOUT: readonly string[] = [
	'GDPR',
	'UK GDPR',
	'Record of Processing Activities (ROPA)',
	'Data Protection Impact Assessment (DPIA)',
	'Data Subject Access Request (DSAR)',
	'Vendor privacy risk',
	'AI governance'
];

/**
 * Certifications the Trust page visibly claims, keyed by its pillar id. A credential is published
 * only while its pillar is in the content, so the structured data cannot outlive the page copy.
 */
const CREDENTIALS: Record<string, { name: string; recognizedBy: string }> = {
	'cyber-essentials': { name: 'Cyber Essentials', recognizedBy: 'National Cyber Security Centre' }
};

function credentials(): { name: string; recognizedBy: string }[] {
	const pillars = (pages.trust as { pillars?: { id?: string }[] }).pillars ?? [];
	return pillars.flatMap((p) => (p.id && CREDENTIALS[p.id] ? [CREDENTIALS[p.id]] : []));
}

/** The organisation, the website and the software — on every page. */
export function siteGraph(origin: string): JsonLdNode[] {
	const tiers = site.pricing.tiers.map((tier) => ({
		name: plain(tier.band),
		price: tier.rate.replace(/[^\d.]/g, ''),
		period: tier.period,
		url: tier.href,
		description: `${plain(tier.band)} · ${tier.rate}${tier.period} · ${site.pricing.offerDescriptionSuffix}`
	}));
	return [
		organizationNode({
			origin,
			legalName: site.legalName,
			alternateNames: [site.shortName, site.brand],
			url: site.companyHref,
			logo: site.logos.colour,
			email: site.footer.email,
			telephone: site.footer.phone,
			sameAs: [site.footer.linkedin, site.companyHref],
			address: { ...site.footer.postalAddress },
			knowsAbout: [...KNOWS_ABOUT],
			credentials: credentials()
		}),
		webSiteNode(origin, site.brand),
		softwareNode({
			origin,
			name: site.brand,
			alternateName: site.shortName,
			description: plain(site.meta.description),
			subCategory: aeo.applicationSubCategory,
			featureList: [...featureList],
			audienceType: aeo.audienceType,
			offersUrl: site.demoHref,
			offerDescriptionSuffix: site.pricing.offerDescriptionSuffix,
			tiers
		})
	];
}

export type PageSchemaInput = {
	origin: string;
	pathname: string;
	/** The finished <title>. */
	title: string;
	description?: string | null;
	image?: string | null;
	/** Parents between Home and this page, in order. Home and the page itself are added here. */
	parents?: Crumb[];
	/** The short name the breadcrumb and listing give this page; the title without the brand. */
	heading?: string | null;
	/** `@id` of the page's main subject, when one of the extra nodes is it. */
	mainEntityId?: string | null;
	/** Nodes the page adds: a FAQPage, a VideoObject. */
	extra?: (JsonLdNode | null | undefined)[];
};

/** Everything one page publishes, as one graph. */
export function pageGraph(input: PageSchemaInput): JsonLdNode {
	const isHome = (input.pathname || '/').split(/[?#]/)[0] === '/';
	const crumbs: Crumb[] = isHome
		? []
		: [
				{ name: site.brand, href: '/' },
				...(input.parents ?? []),
				{ name: plain(input.heading || stripBrand(input.title)), href: input.pathname }
			];
	const breadcrumb = breadcrumbNode(input.origin, input.pathname, crumbs);
	return graph([
		...siteGraph(input.origin),
		webPageNode({
			origin: input.origin,
			pathname: input.pathname,
			name: plain(input.title),
			description: plain(input.description ?? ''),
			image: input.image ?? undefined,
			mainEntityId: input.mainEntityId ?? (isHome ? SOFTWARE_ID(input.origin) : undefined),
			breadcrumbId: breadcrumb ? (breadcrumb['@id'] as string) : undefined
		}),
		breadcrumb,
		...(input.extra ?? [])
	]);
}

/** "Pricing — Brand" → "Pricing": the page's own name, for a breadcrumb. */
export function stripBrand(title: string): string {
	const suffix = `${site.titleSeparator}${site.brand}`;
	const t = plain(title).trim();
	return t.endsWith(suffix) ? t.slice(0, -suffix.length).trim() : t;
}

/**
 * The explainer a page shows, as a VideoObject. Null when the page draws a still (no file) or
 * nothing. The default video's recorded date, length and transcript come from Site globals when
 * someone has entered them; a page's own film carries none unless its content does.
 */
export function explainerVideoNode(
	origin: string,
	pathname: string,
	explainer: ExplainerProps,
	transcript?: string | null
): JsonLdNode | null {
	if (explainer.image || !explainer.src) return null;
	const isDefault = explainer.src === site.video.src;
	const video = site.video as { uploadDate?: unknown; durationSeconds?: unknown; caption?: unknown };
	return videoObjectNode({
		origin,
		pathname,
		name: plain(explainer.label || site.video.label),
		description: isDefault ? plain(typeof video.caption === 'string' ? video.caption : '') : '',
		contentUrl: explainer.src,
		thumbnailUrl: explainer.poster,
		uploadDate: isDefault ? isoDate(video.uploadDate) : undefined,
		duration: isDefault ? isoDuration(video.durationSeconds) || undefined : undefined,
		transcript: isDefault ? transcript?.trim() || undefined : undefined
	});
}

/** The FAQ page's questions, every one of which is drawn on the page. */
export function faqNode(origin: string, pathname: string): JsonLdNode | null {
	const copy = pages.faq;
	return faqPageNode({
		origin,
		pathname,
		name: plain(copy.meta.title),
		description: plain(copy.meta.description),
		items: copy.items.map((item) => ({ question: plain(item.q), answer: plain(item.a) }))
	});
}

