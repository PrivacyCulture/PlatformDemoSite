import { aeo, site } from '$lib/content';
import { live } from '$lib/content/runtime';
import { plain } from './rich';

export type AeoQuestion = {
	question: string;
	answer: string;
};

/** Phrases people type into Google or ask ChatGPT, Perplexity, Gemini, and Copilot. */
export const searchTerms: readonly string[] = live((c) => c.aeo.searchTerms, 'array');

export function aeoKeywords(): string {
	return searchTerms.join(', ');
}

export const featureList: readonly string[] = live((c) => c.aeo.featureList, 'array');

/**
 * Questions a privacy lead is likely to ask an AI assistant when shopping
 * for software — answered from the public product facts on this site.
 */
export const aeoQuestions: AeoQuestion[] = live((c) => c.aeo.questions, 'array');

export function homepageJsonLd(origin: string) {
	const root = origin.replace(/\/$/, '');
	const pageUrl = `${root}/`;
	const orgId = `${root}/#organization`;
	const websiteId = `${root}/#website`;
	const webpageId = `${root}/#webpage`;
	const softwareId = `${root}/#software`;
	const faqId = `${root}/#faq`;
	const termsId = `${root}/#search-terms`;
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
				knowsAbout: [...searchTerms]
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
				mainEntity: { '@id': faqId },
				keywords: aeoKeywords(),
				speakable: {
					'@type': 'SpeakableSpecification',
					cssSelector: ['h1', '[data-aeo-answer]']
				}
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
				keywords: aeoKeywords(),
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
			},
			{
				'@type': 'FAQPage',
				'@id': faqId,
				url: pageUrl,
				inLanguage: 'en-GB',
				isPartOf: { '@id': webpageId },
				mainEntity: aeoQuestions.map((item) => ({
					'@type': 'Question',
					name: plain(item.question),
					acceptedAnswer: {
						'@type': 'Answer',
						text: plain(item.answer)
					}
				}))
			},
			{
				'@type': 'DefinedTermSet',
				'@id': termsId,
				name: aeo.termSet.name,
				description: aeo.termSet.description,
				url: pageUrl,
				hasDefinedTerm: searchTerms.map((term) => ({
					'@type': 'DefinedTerm',
					name: term,
					inDefinedTermSet: { '@id': termsId }
				}))
			}
		]
	};
}

export function jsonLdScript(data: unknown): string {
	const json = JSON.stringify(data).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${json}</script>`;
}
