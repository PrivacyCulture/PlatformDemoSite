// The JSON-LD nodes every page can emit, built from plain data. Pure: no content imports, no
// $app, so `scripts/test-schema.ts` runs it offline. `$lib/site/aeo.ts` reads the site content
// and feeds these; SeoHead.svelte draws the result.
//
// Every builder takes already-plain strings (the caller applies plain()) and never writes a key
// with an empty value — a blank `uploadDate` or `image` would be a claim, not an omission.

export type JsonLdNode = Record<string, unknown>;

export type OrganizationData = {
	origin: string;
	legalName: string;
	alternateNames: string[];
	url: string;
	logo: { src: string; width?: number; height?: number };
	email: string;
	telephone: string;
	sameAs: string[];
	address: Record<string, string>;
	knowsAbout: string[];
	/** Certifications the organisation visibly claims, e.g. Cyber Essentials. */
	credentials: { name: string; recognizedBy?: string }[];
};

export type OfferTier = { name: string; price: string; period: string; url: string; description: string };

export type SoftwareData = {
	origin: string;
	name: string;
	alternateName: string;
	description: string;
	subCategory: string;
	featureList: string[];
	audienceType: string;
	offersUrl: string;
	offerDescriptionSuffix: string;
	tiers: OfferTier[];
};

export type WebPageData = {
	origin: string;
	pathname: string;
	/** The finished <title>. */
	name: string;
	description: string;
	image?: string;
	/** `@id` of the page's main subject (the software, a FAQPage, a VideoObject). */
	mainEntityId?: string;
	breadcrumbId?: string;
};

export type Crumb = { name: string; href: string };

export type VideoData = {
	origin: string;
	pathname: string;
	name: string;
	description: string;
	contentUrl: string;
	thumbnailUrl: string;
	/** ISO 8601 date; absent when nobody has recorded one. */
	uploadDate?: string;
	/** ISO 8601 duration (`PT2M`); absent when unmeasured. */
	duration?: string;
	transcript?: string;
};

export type FaqData = {
	origin: string;
	pathname: string;
	name: string;
	description: string;
	items: { question: string; answer: string }[];
};

export const LANGUAGE = 'en-GB';

export function root(origin: string): string {
	return origin.replace(/\/$/, '');
}

export function absoluteUrl(origin: string, url: string): string {
	if (/^https?:\/\//i.test(url)) return url;
	if (url.startsWith('//')) return '';
	return `${root(origin)}/${url.replace(/^\/+/, '')}`;
}

export function pageUrl(origin: string, pathname: string): string {
	const path = (pathname || '/').split(/[?#]/)[0] ?? '/';
	return path === '/' ? `${root(origin)}/` : `${root(origin)}${path.replace(/\/+$/, '')}`;
}

export const ORGANIZATION_ID = (origin: string) => `${root(origin)}/#organization`;
export const WEBSITE_ID = (origin: string) => `${root(origin)}/#website`;
export const SOFTWARE_ID = (origin: string) => `${root(origin)}/#software`;
export const WEBPAGE_ID = (origin: string, pathname: string) => `${pageUrl(origin, pathname)}#webpage`;
export const BREADCRUMB_ID = (origin: string, pathname: string) => `${pageUrl(origin, pathname)}#breadcrumb`;
export const VIDEO_ID = (origin: string, pathname: string) => `${pageUrl(origin, pathname)}#video`;
export const FAQ_ID = (origin: string, pathname: string) => `${pageUrl(origin, pathname)}#faq`;

/** Drop keys whose value is '', null, undefined, an empty array or an empty object. */
export function prune<T extends JsonLdNode>(node: T): T {
	const out: JsonLdNode = {};
	for (const [k, v] of Object.entries(node)) {
		if (v === '' || v === null || v === undefined) continue;
		if (Array.isArray(v)) {
			const list = v.filter((x) => x !== '' && x !== null && x !== undefined);
			if (!list.length) continue;
			out[k] = list;
			continue;
		}
		if (typeof v === 'object') {
			const inner = prune(v as JsonLdNode);
			if (!Object.keys(inner).length) continue;
			out[k] = inner;
			continue;
		}
		out[k] = v;
	}
	return out as T;
}

export function organizationNode(d: OrganizationData): JsonLdNode {
	return prune({
		'@type': 'Organization',
		'@id': ORGANIZATION_ID(d.origin),
		name: d.legalName,
		legalName: d.legalName,
		alternateName: d.alternateNames,
		url: d.url,
		logo: {
			'@type': 'ImageObject',
			url: absoluteUrl(d.origin, d.logo.src),
			width: d.logo.width,
			height: d.logo.height
		},
		email: d.email,
		telephone: d.telephone,
		sameAs: d.sameAs,
		address: { '@type': 'PostalAddress', ...d.address },
		areaServed: d.address.addressCountry,
		contactPoint: {
			'@type': 'ContactPoint',
			contactType: 'sales',
			email: d.email,
			telephone: d.telephone,
			availableLanguage: ['English']
		},
		knowsAbout: d.knowsAbout,
		hasCredential: d.credentials.map((c) =>
			prune({
				'@type': 'EducationalOccupationalCredential',
				name: c.name,
				credentialCategory: 'certification',
				recognizedBy: c.recognizedBy ? { '@type': 'Organization', name: c.recognizedBy } : undefined
			})
		)
	});
}

export function webSiteNode(origin: string, name: string): JsonLdNode {
	return {
		'@type': 'WebSite',
		'@id': WEBSITE_ID(origin),
		name,
		url: `${root(origin)}/`,
		inLanguage: LANGUAGE,
		publisher: { '@id': ORGANIZATION_ID(origin) },
		about: { '@id': SOFTWARE_ID(origin) }
	};
}

/** A monthly rate carries a unit price specification, so "per month" is machine-readable. */
function offerNode(origin: string, tier: OfferTier): JsonLdNode {
	const monthly = /month/i.test(tier.period);
	return prune({
		'@type': 'Offer',
		name: tier.name,
		price: tier.price,
		priceCurrency: 'GBP',
		url: absoluteUrl(origin, tier.url),
		availability: 'https://schema.org/InStock',
		description: tier.description,
		priceSpecification: monthly
			? {
					'@type': 'UnitPriceSpecification',
					price: tier.price,
					priceCurrency: 'GBP',
					billingDuration: 'P1M',
					unitCode: 'MON',
					referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' }
				}
			: undefined
	});
}

export function softwareNode(d: SoftwareData): JsonLdNode {
	const tiers = d.tiers.filter((t) => /^\d/.test(t.price));
	const prices = tiers.map((t) => Number(t.price)).filter((n) => Number.isFinite(n));
	return prune({
		'@type': ['SoftwareApplication', 'WebApplication'],
		'@id': SOFTWARE_ID(d.origin),
		name: d.name,
		alternateName: d.alternateName,
		url: `${root(d.origin)}/`,
		applicationCategory: 'BusinessApplication',
		applicationSubCategory: d.subCategory,
		operatingSystem: 'Web',
		countriesSupported: 'GB',
		inLanguage: LANGUAGE,
		description: d.description,
		featureList: d.featureList,
		audience: { '@type': 'BusinessAudience', audienceType: d.audienceType },
		creator: { '@id': ORGANIZATION_ID(d.origin) },
		publisher: { '@id': ORGANIZATION_ID(d.origin) },
		offers: tiers.length
			? {
					'@type': 'AggregateOffer',
					priceCurrency: 'GBP',
					lowPrice: String(Math.min(...prices)),
					highPrice: String(Math.max(...prices)),
					offerCount: tiers.length,
					availability: 'https://schema.org/InStock',
					url: absoluteUrl(d.origin, d.offersUrl),
					offers: tiers.map((t) => offerNode(d.origin, t))
				}
			: undefined
	});
}

export function webPageNode(d: WebPageData): JsonLdNode {
	return prune({
		'@type': 'WebPage',
		'@id': WEBPAGE_ID(d.origin, d.pathname),
		url: pageUrl(d.origin, d.pathname),
		name: d.name,
		description: d.description,
		inLanguage: LANGUAGE,
		isPartOf: { '@id': WEBSITE_ID(d.origin) },
		about: { '@id': SOFTWARE_ID(d.origin) },
		primaryImageOfPage: d.image ? { '@type': 'ImageObject', url: absoluteUrl(d.origin, d.image) } : undefined,
		mainEntity: d.mainEntityId ? { '@id': d.mainEntityId } : undefined,
		breadcrumb: d.breadcrumbId ? { '@id': d.breadcrumbId } : undefined
	});
}

/**
 * Home → parents → this page. Returns null for Home itself and for a chain with one entry — a
 * breadcrumb of a single item says nothing.
 */
export function breadcrumbNode(origin: string, pathname: string, crumbs: Crumb[]): JsonLdNode | null {
	const list = crumbs.filter((c) => c.name && c.href);
	if (list.length < 2) return null;
	return {
		'@type': 'BreadcrumbList',
		'@id': BREADCRUMB_ID(origin, pathname),
		itemListElement: list.map((c, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: c.name,
			item: pageUrl(origin, c.href)
		}))
	};
}

export function videoObjectNode(d: VideoData): JsonLdNode | null {
	if (!d.contentUrl || !d.name) return null;
	return prune({
		'@type': 'VideoObject',
		'@id': VIDEO_ID(d.origin, d.pathname),
		name: d.name,
		description: d.description || d.name,
		contentUrl: absoluteUrl(d.origin, d.contentUrl),
		thumbnailUrl: d.thumbnailUrl ? absoluteUrl(d.origin, d.thumbnailUrl) : undefined,
		uploadDate: d.uploadDate,
		duration: d.duration,
		transcript: d.transcript,
		inLanguage: LANGUAGE,
		publisher: { '@id': ORGANIZATION_ID(d.origin) },
		about: { '@id': SOFTWARE_ID(d.origin) }
	});
}

export function faqPageNode(d: FaqData): JsonLdNode | null {
	const items = d.items.filter((i) => i.question && i.answer);
	if (!items.length) return null;
	return prune({
		'@type': 'FAQPage',
		'@id': FAQ_ID(d.origin, d.pathname),
		url: pageUrl(d.origin, d.pathname),
		name: d.name,
		description: d.description,
		inLanguage: LANGUAGE,
		mainEntity: items.map((i) => ({
			'@type': 'Question',
			name: i.question,
			acceptedAnswer: { '@type': 'Answer', text: i.answer }
		}))
	});
}

export function graph(nodes: (JsonLdNode | null | undefined)[]): JsonLdNode {
	return { '@context': 'https://schema.org', '@graph': nodes.filter((n): n is JsonLdNode => !!n) };
}

/** `<` is escaped so a value can never close the script element early. */
export function jsonLdScript(data: unknown): string {
	const json = JSON.stringify(data).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${json}</script>`;
}

/** The ISO 8601 duration for a whole number of seconds, or '' for anything else. */
export function isoDuration(seconds: unknown): string {
	const n = typeof seconds === 'number' ? seconds : Number(seconds);
	if (!Number.isFinite(n) || n <= 0) return '';
	const s = Math.round(n);
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${sec || (!h && !m) ? `${sec}S` : ''}`;
}

/** A `YYYY-MM-DD` or full ISO timestamp, or '' for anything that is not one. */
export function isoDate(value: unknown): string {
	if (typeof value !== 'string') return '';
	const v = value.trim();
	return /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/.test(v) ? v : '';
}

/** The words of a WebVTT file: cue text only, no header, timings, settings or cue ids. */
export function vttTranscript(vtt: string): string {
	const lines = vtt.replace(/\r/g, '').split('\n');
	const out: string[] = [];
	let inCue = false;
	let block: 'header' | 'note' | 'none' = 'header';
	for (const line of lines) {
		const t = line.trim();
		if (!t) {
			inCue = false;
			block = 'none';
			continue;
		}
		if (block === 'header' && /^WEBVTT/.test(t)) continue;
		if (/^(NOTE|STYLE|REGION)\b/.test(t)) {
			block = 'note';
			continue;
		}
		if (block === 'note') continue;
		if (t.includes('-->')) {
			inCue = true;
			continue;
		}
		if (!inCue) continue; // a cue identifier line, or stray text
		out.push(t.replace(/<[^>]+>/g, ''));
	}
	return out.join(' ').replace(/\s+/g, ' ').trim();
}
