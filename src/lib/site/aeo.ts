import { aeo, site } from '$lib/content';
import { live } from '$lib/content/runtime';

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

export function homepageJsonLd(origin: string) {
	const root = origin.replace(/\/$/, '');
	const pageUrl = `${root}/`;
	const orgId = `${root}/#organization`;
	const websiteId = `${root}/#website`;
	const webpageId = `${root}/#webpage`;
	const softwareId = `${root}/#software`;
	const logoUrl = `${root}${site.logos.colour.src}`;
	const pricedTiers = site.pricing.tiers.filter((tier) => tier.rate.startsWith('£'));
	const prices = pricedTiers.map((tier) => tier.rate.replace(/[^\d.]/g, ''));

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Organization',
				'@id': orgId,
				name: site.legalName,
				legalName: site.legalName,
				alternateName: [site.shortName, site.brand],
				url: site.companyHref,
				logo: {
					'@type': 'ImageObject',
					url: logoUrl
				},
				email: site.footer.email,
				telephone: site.footer.phone,
				sameAs: [site.footer.linkedin, site.companyHref],
				address: {
					'@type': 'PostalAddress',
					...site.footer.postalAddress
				},
				contactPoint: {
					'@type': 'ContactPoint',
					contactType: 'sales',
					email: site.footer.email,
					telephone: site.footer.phone,
					availableLanguage: ['English']
				},
				knowsAbout: [...KNOWS_ABOUT]
			},
			{
				'@type': 'WebSite',
				'@id': websiteId,
				name: site.brand,
				url: pageUrl,
				inLanguage: 'en-GB',
				publisher: { '@id': orgId },
				about: { '@id': softwareId }
			},
			{
				'@type': 'WebPage',
				'@id': webpageId,
				url: pageUrl,
				name: site.meta.title,
				description: site.meta.description,
				inLanguage: 'en-GB',
				isPartOf: { '@id': websiteId },
				about: { '@id': softwareId },
			},
			{
				'@type': ['SoftwareApplication', 'WebApplication'],
				'@id': softwareId,
				name: site.brand,
				alternateName: site.shortName,
				url: pageUrl,
				applicationCategory: 'BusinessApplication',
				applicationSubCategory: aeo.applicationSubCategory,
				operatingSystem: 'Web',
				countriesSupported: 'GB',
				inLanguage: 'en-GB',
				description: site.meta.description,
				featureList: [...featureList],
				audience: {
					'@type': 'BusinessAudience',
					audienceType: aeo.audienceType
				},
				creator: { '@id': orgId },
				publisher: { '@id': orgId },
				offers: {
					'@type': 'AggregateOffer',
					priceCurrency: 'GBP',
					lowPrice: prices[0] ?? '',
					highPrice: prices[prices.length - 1] ?? '',
					offerCount: pricedTiers.length,
					availability: 'https://schema.org/InStock',
					url: `${root}${site.demoHref}`,
					offers: pricedTiers.map((tier, i) => ({
						'@type': 'Offer',
						name: tier.band,
						price: prices[i],
						priceCurrency: 'GBP',
						url: `${root}${tier.href}`,
						description: `${tier.band} · ${tier.rate}${tier.period} · ${site.pricing.offerDescriptionSuffix}`
					}))
				}
			}
		]
	};
}

export function jsonLdScript(data: unknown): string {
	const json = JSON.stringify(data).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${json}</script>`;
}
