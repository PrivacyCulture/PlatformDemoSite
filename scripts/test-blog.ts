// Offline test for the blog (src/lib/site/blog.ts) and its copy of the article grammar.
//   npx tsx scripts/test-blog.ts
//
// src/lib/site/article-html.ts is a byte-identical copy of Sorted's src/lib/article-html.ts; both
// repos assert MODULE_SHA256 below. Copy the file across and update the constant in BOTH tests.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validBlogPosts, blogIndex, searchPosts, relatedPosts, postEyebrow, formatPostDate, toSummary, blogSummaries, tagSlug } from '../src/lib/site/blog';
import { cleanArticleHtml, headingsOf, withHeadingIds } from '../src/lib/site/article-html';
import { blogPostingNode, blogNode } from '../src/lib/site/schema';
import { seoTags } from '../src/lib/site/seo';

let failures = 0;
let passed = 0;
function check(name: string, cond: boolean, detail?: string) {
	if (cond) passed++;
	else {
		failures++;
		console.error(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`);
	}
}
function eq(name: string, a: unknown, e: unknown) {
	check(name, JSON.stringify(a) === JSON.stringify(e), `expected ${JSON.stringify(e)}\n      got      ${JSON.stringify(a)}`);
}

const MODULE_SHA256 = 'da2cf97511067582c469557f3469e85fff611b8303dffe6bb0d6f5a44dd41c02';
const src = readFileSync(new URL('../src/lib/site/article-html.ts', import.meta.url), 'utf8');
check('article-html.ts is byte-identical to Sorted’s', createHash('sha256').update(src).digest('hex') === MODULE_SHA256, `now ${createHash('sha256').update(src).digest('hex')}`);

const words = (n: number) => `<p>${'word '.repeat(n)}</p>`;
const raw = [
	{ slug: 'older', title: 'Older', publishedAt: '2026-03-01', body: words(460), tags: ['ROPA', 'Ownership'], challenge: 'stale-ropa' },
	{ slug: 'newest', title: 'Newest', publishedAt: '2026-09-01', body: words(10), tags: ['DPIA'] },
	{ slug: 'pinned', title: 'Pinned', publishedAt: '2026-08-01', pinned: true, body: words(10), tags: ['Research'] },
	{ slug: 'mid', title: 'Mid', publishedAt: '2026-06-01', body: '<h2>Why</h2><p>Vendor <strong>drift</strong></p><script>alert(1)</script>', tags: ['ropa', 'Vendors'] },
	{ slug: 'Bad Slug', title: 'x' },
	{ slug: 'no-title' },
	{ slug: 'newest', title: 'Duplicate of newest' },
	'not an object',
	{ slug: 'a', title: 'A', publishedAt: '2026-01-01', body: words(5) },
	{ slug: 'b', title: 'B', publishedAt: '2026-01-02', body: words(5), challenge: 'stale-ropa' },
	{ slug: 'c', title: 'C', publishedAt: '2026-01-03', body: words(5) }
];

const posts = validBlogPosts(raw);
eq('bad entries are dropped one by one, the rest kept', posts.map((p) => p.slug), ['newest', 'pinned', 'mid', 'older', 'c', 'b', 'a']);
check('a repeated slug is served once — the first', posts.filter((p) => p.slug === 'newest').length === 1 && posts[0].title === 'Newest');
eq('read time is worked out at validation (460 words = 2 min)', posts.find((p) => p.slug === 'older')!.readMinutes, 2);
eq('the body is cleaned again on the site', posts.find((p) => p.slug === 'mid')!.body, '<h2>Why</h2><p>Vendor <strong>drift</strong></p>');
eq('tags dedupe case-insensitively', validBlogPosts([{ slug: 'x', title: 'X', tags: ['ROPA', 'ropa', 'DPIA'] }])[0].tags, ['ROPA', 'DPIA']);
eq('absent blogPosts = no posts', validBlogPosts(undefined), []);

const summary = toSummary(posts[0]);
check('a summary has no body, takeaways or questions', !('body' in summary) && !('takeaways' in summary) && !('questions' in summary));
check('a summary keeps its read time (the browser cannot work it out)', 'readMinutes' in summary);
const stripped = blogSummaries({ blogPosts: posts, other: 1 }) as { blogPosts: object[]; other: number };
check('blogSummaries strips every post and keeps the rest', stripped.other === 1 && stripped.blogPosts.every((p) => !('body' in p)));
check('blogSummaries leaves content with no posts alone', JSON.stringify(blogSummaries({ x: 1 })) === '{"x":1}');

const idx = blogIndex(posts.map(toSummary));
eq('hero is the newest unpinned post', idx.hero?.slug, 'newest');
eq('recent is the next three', idx.recent.map((p) => p.slug), ['mid', 'older', 'c']);
eq('the pinned post is featured, and nowhere else', [idx.featured?.slug, [idx.hero, ...idx.recent, ...idx.more].some((p) => p?.slug === 'pinned')], ['pinned', false]);
eq('more is the rest', idx.more.map((p) => p.slug), ['b', 'a']);
const lonePinned = blogIndex(validBlogPosts([{ slug: 'only', title: 'Only', pinned: true }]).map(toSummary));
eq('a lone pinned post is the hero, not featured', [lonePinned.hero?.slug, lonePinned.featured], ['only', null]);
eq('no posts: nothing anywhere', blogIndex([]), { hero: null, recent: [], featured: null, more: [] });

eq('search finds words in the article text', searchPosts(posts, 'drift').map((p) => p.slug), ['mid']);
eq('every word must match', searchPosts(posts, 'vendor nothing').length, 0);
eq('case is ignored', searchPosts(posts, 'NEWEST').map((p) => p.slug), ['newest']);
eq('a tag filters by its URL form', searchPosts(posts, '', 'ropa').map((p) => p.slug), ['mid', 'older']);
eq('the script that was cleaned out cannot be searched for', searchPosts(posts, 'alert').length, 0);
eq('tag slug', tagSlug('Vendor risk'), 'vendor-risk');

const older = posts.find((p) => p.slug === 'older')!;
eq('related: shared tags first, then same challenge, then newest', relatedPosts(older, posts).map((p) => p.slug), ['mid', 'b', 'newest']);
check('related never includes the post itself', !relatedPosts(older, posts, 10).some((p) => p.slug === 'older'));
eq('related backfills to n when nothing is shared', relatedPosts(posts.find((p) => p.slug === 'a')!, posts, 3).length, 3);

eq('eyebrow: its own first', postEyebrow({ eyebrow: 'Own', challenge: 'stale-ropa' }, [{ slug: 'stale-ropa', title: 'The stale ROPA' }]), 'Own');
eq('eyebrow: else the challenge title', postEyebrow({ eyebrow: '', challenge: 'stale-ropa' }, [{ slug: 'stale-ropa', title: 'The stale ROPA' }]), 'The stale ROPA');
eq('eyebrow: else nothing', postEyebrow({ eyebrow: '', challenge: 'gone' }, []), '');
eq('a date late at night UTC is still the London day', formatPostDate('2026-06-30T23:30:00Z'), '1 July 2026');
eq('a missing date is blank', formatPostDate(''), '');

eq('headings get ids for On this page', headingsOf('<h2>Why records drift</h2><h2>Why records drift</h2>').map((h) => h.id), ['why-records-drift', 'why-records-drift-2']);
check('withHeadingIds puts the same ids on the headings', withHeadingIds('<h2>A b</h2>') === '<h2 id="a-b">A b</h2>');
check('the site refuses a javascript: link even if Sorted sent one', !cleanArticleHtml('<p><a href="javascript:x">y</a></p>').includes('javascript'));

const node = blogPostingNode({ origin: 'https://x.test', pathname: '/blog/a', headline: 'A', description: 'd', datePublished: '2026-01-01T09:00:00Z', keywords: ['ROPA'], authorName: '', wordCount: 300 });
check('BlogPosting with no named author is credited to the organisation', JSON.stringify(node?.author) === '{"@id":"https://x.test/#organization"}');
check('BlogPosting carries its dates, keywords and blog', node?.datePublished === '2026-01-01T09:00:00Z' && node?.dateModified === '2026-01-01T09:00:00Z' && node?.keywords === 'ROPA' && JSON.stringify(node?.isPartOf) === '{"@id":"https://x.test/blog#blog"}');
const named = blogPostingNode({ origin: 'https://x.test', pathname: '/blog/a', headline: 'A', description: '', authorName: 'Jo Bloggs', authorRole: 'DPO', keywords: [] });
check('a named author is a Person', (named?.author as { '@type': string; name: string; jobTitle: string })['@type'] === 'Person' && (named?.author as { name: string }).name === 'Jo Bloggs');
check('no keywords key when there are no tags', !('keywords' in (named ?? {})));
check('no headline, no node', blogPostingNode({ origin: 'https://x.test', pathname: '/blog/a', headline: '', description: '', keywords: [] }) === null);
const blog = blogNode({ origin: 'https://x.test', name: 'Blog', description: 'd', posts: [{ url: '/blog/a', headline: 'A' }] });
check('the Blog node lists its posts', Array.isArray(blog.blogPost) && (blog.blogPost as { url: string }[])[0].url === 'https://x.test/blog/a');

const tags = seoTags({ title: 'T', origin: 'https://x.test', pathname: '/blog/a', ogType: 'article', article: { publishedTime: '2026-01-01', tags: ['ROPA', 'DPIA'], author: 'Jo' } });
check('og:type is article on a post', tags.some((t) => t.property === 'og:type' && t.content === 'article'));
check('one article:tag per tag', tags.filter((t) => t.property === 'article:tag').map((t) => t.content).join() === 'ROPA,DPIA');
check('a page that is not a post stays a website', seoTags({ title: 'T', origin: 'https://x.test', pathname: '/' }).some((t) => t.property === 'og:type' && t.content === 'website'));

console.log(`\n${passed} passed, ${failures} failed`);
if (failures) process.exit(1);
