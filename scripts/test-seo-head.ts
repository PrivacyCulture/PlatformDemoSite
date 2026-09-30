// The <head> tags every page emits. Run: npx tsx scripts/test-seo-head.ts
//
// Sorted's search-listing preview (pcl-abm src/lib/platform-seo.ts) mirrors these rules, so a
// change here that the CMS does not know about shows editors something the site does not render.
import { metaKeywords, normaliseKeywords, seoTags, seoTitle } from '../src/lib/site/seo';

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

check('metaKeywords reads a string', metaKeywords({ keywords: 'a, b' }) === 'a, b');
check('metaKeywords: absent is empty', metaKeywords({ title: 'x' }) === '' && metaKeywords(null) === '');
check('metaKeywords: non-string is empty', metaKeywords({ keywords: 5 }) === '');
check('normalise collapses inner spaces', normaliseKeywords('data   protection,DPO') === 'data protection, DPO');

console.log(failures ? `\n${failures} failed` : '\nAll passed');
process.exit(failures ? 1 : 0);
