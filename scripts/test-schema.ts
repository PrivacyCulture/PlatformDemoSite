// The JSON-LD nodes every page emits. Run: npx tsx scripts/test-schema.ts
//
// Both directions are asserted: a claim the content does not make (an empty uploadDate, a blank
// credential) must never reach the graph, and a real one must not be dropped by the pruning.
import {
	absoluteUrl,
	breadcrumbNode,
	faqPageNode,
	graph,
	isoDate,
	isoDuration,
	jsonLdScript,
	organizationNode,
	pageUrl,
	prune,
	softwareNode,
	videoObjectNode,
	vttTranscript,
	webPageNode,
	webSiteNode,
	ORGANIZATION_ID,
	SOFTWARE_ID,
	WEBPAGE_ID,
	BREADCRUMB_ID
} from '../src/lib/site/schema';

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
	console.log(`  ${cond ? '✓' : '✗'} ${name}${cond || !detail ? '' : ` — ${detail}`}`);
	if (!cond) failures++;
}
const origin = 'https://example.com';
const j = (v: unknown) => JSON.stringify(v);

console.log('urls');
check('pageUrl home keeps the trailing slash', pageUrl(origin, '/') === 'https://example.com/');
check('pageUrl strips query, hash and trailing slash', pageUrl(origin, '/pricing/?utm=x#y') === 'https://example.com/pricing');
check('absoluteUrl keeps absolute', absoluteUrl(origin, 'https://cdn.x/a.png') === 'https://cdn.x/a.png');
check('absoluteUrl refuses protocol-relative', absoluteUrl(origin, '//evil/a.png') === '');
check('ids are stable per page', WEBPAGE_ID(origin, '/faq') === 'https://example.com/faq#webpage' && WEBPAGE_ID(origin, '/') === 'https://example.com/#webpage');

console.log('prune');
check('drops empty strings, nulls, empty arrays and empty objects', j(prune({ a: '', b: null, c: [], d: {}, e: [''], f: 'x', g: 0 })) === j({ f: 'x', g: 0 }));
check('prunes nested objects', j(prune({ a: { b: '', c: { d: '' } }, e: { f: 'y' } })) === j({ e: { f: 'y' } }));

console.log('organization');
const org = organizationNode({
	origin,
	legalName: 'Privacy Culture Ltd',
	alternateNames: ['PrivacyCulture', 'Privacy Culture Platform'],
	url: 'https://www.privacyculture.com/',
	logo: { src: '/brand/logo.png', width: 500, height: 50 },
	email: 'hello@x.com',
	telephone: '+44 1',
	sameAs: ['https://linkedin.com/company/x', ''],
	address: { streetAddress: '1 St', addressLocality: 'London', postalCode: 'EC4A 2DQ', addressCountry: 'GB' },
	knowsAbout: ['GDPR'],
	credentials: [{ name: 'Cyber Essentials', recognizedBy: 'NCSC' }]
}) as Record<string, any>;
check('@id is the organisation anchor', org['@id'] === ORGANIZATION_ID(origin));
check('logo is absolute with size', org.logo.url === 'https://example.com/brand/logo.png' && org.logo.width === 500 && org.logo.height === 50);
check('areaServed from the address country', org.areaServed === 'GB');
check('empty sameAs entry dropped', j(org.sameAs) === j(['https://linkedin.com/company/x']));
check('credential carries its recogniser', org.hasCredential[0].name === 'Cyber Essentials' && org.hasCredential[0].recognizedBy.name === 'NCSC' && org.hasCredential[0].credentialCategory === 'certification');
const orgNoCred = organizationNode({ ...({} as any), origin, legalName: 'X', alternateNames: [], url: 'u', logo: { src: '/l.png' }, email: '', telephone: '', sameAs: [], address: { addressCountry: 'GB' }, knowsAbout: [], credentials: [] }) as Record<string, any>;
check('no credentials → no hasCredential key', !('hasCredential' in orgNoCred));
check('no email → no email, no contactPoint email', !('email' in orgNoCred) && !('email' in orgNoCred.contactPoint));
check('logo without size has no width/height', !('width' in orgNoCred.logo));

console.log('software');
const sw = softwareNode({
	origin,
	name: 'Brand',
	alternateName: 'B',
	description: 'D',
	subCategory: 'Privacy management software',
	featureList: ['Visual ROPA View', ''],
	audienceType: 'Mid-market',
	offersUrl: '/demo',
	offerDescriptionSuffix: '12-month',
	tiers: [
		{ name: '1,001–2,500 employees', price: '800', period: '/month', url: '/demo', description: 'a' },
		{ name: '2,501–5,000', price: '1600', period: '/month', url: '/demo', description: 'b' },
		{ name: 'Above 5,000', price: '', period: '', url: '/demo', description: 'c' }
	]
}) as Record<string, any>;
check('@id is the software anchor', sw['@id'] === SOFTWARE_ID(origin));
check('empty feature dropped', j(sw.featureList) === j(['Visual ROPA View']));
check('unpriced tier is not an offer', sw.offers.offerCount === 2 && sw.offers.offers.length === 2);
check('low/high from the real prices', sw.offers.lowPrice === '800' && sw.offers.highPrice === '1600');
check('monthly tier carries a unit price per month', sw.offers.offers[0].priceSpecification.unitCode === 'MON' && sw.offers.offers[0].priceSpecification.billingDuration === 'P1M' && sw.offers.offers[0].priceSpecification.price === '800');
check('offer url is absolute', sw.offers.offers[0].url === 'https://example.com/demo');
const swFree = softwareNode({ origin, name: 'B', alternateName: '', description: '', subCategory: '', featureList: [], audienceType: '', offersUrl: '/demo', offerDescriptionSuffix: '', tiers: [{ name: 'Talk', price: '', period: '', url: '/demo', description: '' }] }) as Record<string, any>;
check('no priced tier → no offers block', !('offers' in swFree));
const swYear = softwareNode({ origin, name: 'B', alternateName: '', description: '', subCategory: '', featureList: [], audienceType: '', offersUrl: '/demo', offerDescriptionSuffix: '', tiers: [{ name: 'Y', price: '9000', period: '/year', url: '/demo', description: '' }] }) as Record<string, any>;
check('a non-monthly period gets no monthly spec', !('priceSpecification' in swYear.offers.offers[0]));

console.log('webpage + breadcrumb');
const wp = webPageNode({ origin, pathname: '/pricing?utm=1', name: 'Pricing — Brand', description: 'D', image: '/i.png', mainEntityId: SOFTWARE_ID(origin), breadcrumbId: BREADCRUMB_ID(origin, '/pricing') }) as Record<string, any>;
check('url and @id ignore the query string', wp.url === 'https://example.com/pricing' && wp['@id'] === 'https://example.com/pricing#webpage');
check('primary image is absolute', wp.primaryImageOfPage.url === 'https://example.com/i.png');
check('mainEntity and breadcrumb reference by @id', wp.mainEntity['@id'] === SOFTWARE_ID(origin) && wp.breadcrumb['@id'] === BREADCRUMB_ID(origin, '/pricing'));
const wpBare = webPageNode({ origin, pathname: '/x', name: 'X', description: '' }) as Record<string, any>;
check('no image → no primaryImageOfPage; no description key', !('primaryImageOfPage' in wpBare) && !('description' in wpBare) && !('mainEntity' in wpBare));
check('WebSite links publisher and subject', (webSiteNode(origin, 'B') as any).publisher['@id'] === ORGANIZATION_ID(origin));

const bc = breadcrumbNode(origin, '/stale-ropa', [{ name: 'Brand', href: '/' }, { name: 'The Platform', href: '/platform' }, { name: 'Stale ROPA', href: '/stale-ropa' }]) as Record<string, any>;
check('breadcrumb positions are 1-based and in order', bc.itemListElement.map((i: any) => i.position).join() === '1,2,3' && bc.itemListElement[1].name === 'The Platform');
check('breadcrumb items are absolute urls', bc.itemListElement[0].item === 'https://example.com/' && bc.itemListElement[2].item === 'https://example.com/stale-ropa');
check('a single crumb is no breadcrumb', breadcrumbNode(origin, '/', [{ name: 'Brand', href: '/' }]) === null);
check('a crumb with no name is dropped', (breadcrumbNode(origin, '/x', [{ name: 'B', href: '/' }, { name: '', href: '/y' }, { name: 'X', href: '/x' }]) as any).itemListElement.length === 2);

console.log('video');
const vid = videoObjectNode({ origin, pathname: '/platform', name: 'Watch the overview', description: 'A walk-through', contentUrl: '/clips/e.mp4', thumbnailUrl: '/clips/e.webp', uploadDate: '2026-09-01', duration: 'PT2M', transcript: 'words' }) as Record<string, any>;
check('video urls are absolute', vid.contentUrl === 'https://example.com/clips/e.mp4' && vid.thumbnailUrl === 'https://example.com/clips/e.webp');
check('video carries date, duration, transcript when given', vid.uploadDate === '2026-09-01' && vid.duration === 'PT2M' && vid.transcript === 'words');
const vidBare = videoObjectNode({ origin, pathname: '/x', name: 'N', description: '', contentUrl: '/c.mp4', thumbnailUrl: '' }) as Record<string, any>;
check('video without a date claims none', !('uploadDate' in vidBare) && !('duration' in vidBare) && !('transcript' in vidBare) && !('thumbnailUrl' in vidBare));
check('description falls back to the name', vidBare.description === 'N');
check('no file → no video', videoObjectNode({ origin, pathname: '/x', name: 'N', description: '', contentUrl: '', thumbnailUrl: '/p.webp' }) === null);

console.log('faq');
const faq = faqPageNode({ origin, pathname: '/faq', name: 'FAQ', description: 'D', items: [{ question: 'Q1', answer: 'A1' }, { question: 'Q2', answer: '' }] }) as Record<string, any>;
check('faq keeps answered questions only', faq.mainEntity.length === 1 && faq.mainEntity[0].acceptedAnswer.text === 'A1');
check('faq with no answered question is no node', faqPageNode({ origin, pathname: '/faq', name: 'F', description: '', items: [] }) === null);

console.log('graph + script');
const g = graph([org, null, undefined, wp]) as Record<string, any>;
check('graph drops nulls', g['@graph'].length === 2 && g['@context'] === 'https://schema.org');
check('script escapes < so a value cannot close the tag', jsonLdScript({ a: '</script><b>' }).includes('\\u003c/script>') && !jsonLdScript({ a: '</script>' }).includes('</script><'));

console.log('dates, durations, transcripts');
check('isoDuration', isoDuration(125) === 'PT2M5S' && isoDuration(120) === 'PT2M' && isoDuration(3600) === 'PT1H' && isoDuration(0) === '' && isoDuration('x') === '' && isoDuration(7) === 'PT7S');
check('isoDate accepts a date or a timestamp', isoDate('2026-09-01') === '2026-09-01' && isoDate('2026-09-01T10:00:00Z') === '2026-09-01T10:00:00Z');
check('isoDate refuses prose', isoDate('last week') === '' && isoDate(5) === '' && isoDate('') === '');
const vtt = 'WEBVTT\nKind: captions\n\nNOTE made by hand\n\n1\n00:00:00.000 --> 00:00:02.000\nHello <b>there</b>\n\n00:00:02.000 --> 00:00:04.000 align:start\nsecond line\nand more\n';
check('vttTranscript keeps the words only', vttTranscript(vtt) === 'Hello there second line and more', j(vttTranscript(vtt)));
check('vttTranscript of nothing is empty', vttTranscript('') === '' && vttTranscript('WEBVTT\n') === '');

console.log(failures ? `\n${failures} failed` : '\nAll passed');
process.exit(failures ? 1 : 0);
