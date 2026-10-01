// The <head> tags every page emits. Run: npx tsx scripts/test-seo-head.ts
//
// Sorted's search-listing preview (pcl-abm src/lib/platform-seo.ts) mirrors these rules, so a
// change here that the CMS does not know about shows editors something the site does not render.
import { canonicalUrl, metaKeywords, normaliseKeywords, seoTags, seoTitle } from '../src/lib/site/seo';

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
	console.log(`  ${cond ? '✓' : '✗'} ${name}${cond || !detail ? '' : ` — ${detail}`}`);
	if (!cond) failures++;
}
const base = { origin: 'https://example.com', pathname: '/pricing' };
const find = (tags: ReturnType<typeof seoTags>, key: string) =>
	tags.find((t) => t.name === key || t.property === key)?.content;

const full = seoTags({ ...base, title: 'Pricing — Brand', description: 'About <strong>pricing</strong> &amp; more', keywords: 'gdpr, GDPR ,  , ropa', image: '/Images/a.png' });
check('description is plain text', find(full, 'description') === 'About pricing & more', find(full, 'description'));
check('keywords normalised and deduped', find(full, 'keywords') === 'gdpr, ropa', find(full, 'keywords'));
check('og:image is absolute', find(full, 'og:image') === 'https://example.com/Images/a.png');
check('large card with an image', find(full, 'twitter:card') === 'summary_large_image');
check('og:url is absolute', find(full, 'og:url') === 'https://example.com/pricing');
check('og:description matches description', find(full, 'og:description') === find(full, 'description'));

const bare = seoTags({ ...base, title: 'X', description: '', keywords: '' });
check('no empty description tag', find(bare, 'description') === undefined);
check('no empty keywords tag', find(bare, 'keywords') === undefined);
check('no og:image without an image', find(bare, 'og:image') === undefined);
check('small card without an image', find(bare, 'twitter:card') === 'summary');
check('no tag ever has empty content', [...full, ...bare].every((t) => t.content !== ''));

check('an absolute image is kept', find(seoTags({ ...base, title: 'X', image: 'https://cdn.x/i.png' }), 'og:image') === 'https://cdn.x/i.png');
check('a protocol-relative image is refused', find(seoTags({ ...base, title: 'X', image: '//evil/i.png' }), 'og:image') === undefined);
check('title is plain text', seoTitle({ ...base, title: '<em>A</em> — B' }) === 'A — B');

const social = seoTags({ ...base, title: 'T', description: 'D', image: '/i.png', imageWidth: 2048, imageHeight: 1152, imageAlt: 'An <strong>image</strong>', siteName: 'Brand' });
check('og:site_name and og:locale', find(social, 'og:site_name') === 'Brand' && find(social, 'og:locale') === 'en_GB');
check('og:image size and alt', find(social, 'og:image:width') === '2048' && find(social, 'og:image:height') === '1152' && find(social, 'og:image:alt') === 'An image');
check('twitter title, description and image mirror og', find(social, 'twitter:title') === 'T' && find(social, 'twitter:description') === 'D' && find(social, 'twitter:image') === 'https://example.com/i.png');
check('no size tags when only one dimension is known', find(seoTags({ ...base, title: 'T', image: '/i.png', imageWidth: 10 }), 'og:image:width') === undefined);
check('no robots tag by default', find(full, 'robots') === undefined);
check('noindex emits robots noindex, nofollow', find(seoTags({ ...base, title: 'T', noindex: true }), 'robots') === 'noindex, nofollow');

check('canonical drops the query string and trailing slash', canonicalUrl({ origin: 'https://example.com', pathname: '/pricing/?utm_source=x' }) === 'https://example.com/pricing');
check('canonical of home keeps the slash', canonicalUrl({ origin: 'https://example.com', pathname: '/' }) === 'https://example.com/');
check('og:url is the canonical', find(seoTags({ ...base, pathname: '/faq?x=1', title: 'T' }), 'og:url') === 'https://example.com/faq');

check('metaKeywords reads a string', metaKeywords({ keywords: 'a, b' }) === 'a, b');
check('metaKeywords: absent is empty', metaKeywords({ title: 'x' }) === '' && metaKeywords(null) === '');
check('metaKeywords: non-string is empty', metaKeywords({ keywords: 5 }) === '');
check('normalise collapses inner spaces', normaliseKeywords('data   protection,DPO') === 'data protection, DPO');

console.log(failures ? `\n${failures} failed` : '\nAll passed');
process.exit(failures ? 1 : 0);
