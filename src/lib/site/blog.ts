// The blog: posts written and approved in Sorted, served in the content payload as `blogPosts`.
// Pure — no content imports, no $app — so scripts/test-blog.ts runs it offline.
//
// Sorted's side of the shape is src/lib/platform-blog.ts there. A field Sorted writes and this
// file does not read is a field that does nothing; keep the two in step.
//
// Read time and word count are worked out HERE, once, when the content is validated, and travel
// with every post. The browser is handed posts without their bodies (see blogSummaries), so a card
// that worked its read time out from the body would render one number on the server and zero in
// the browser — a hydration mismatch on every page that shows a card.

import { cleanArticleHtml, articlePlainText, articleWordCount, readMinutes } from './article-html';

export type BlogImage = { src: string; webp: string; alt: string; width: number; height: number };

export type BlogPost = {
	slug: string;
	title: string;
	/** Blank = the related challenge's title (see postEyebrow). */
	eyebrow: string;
	/** A problem page's slug, or ''. */
	challenge: string;
	excerpt: string;
	/** Article HTML, already cleaned to the article grammar. */
	body: string;
	image: BlogImage;
	tags: string[];
	author: { name: string; role: string };
	pinned: boolean;
	takeaways: string[];
	questions: { q: string; a: string }[];
	publishedAt: string;
	updatedAt: string;
	meta: { title: string; description: string; keywords: string };
	readMinutes: number;
	wordCount: number;
};

/** A post without the parts only its own page draws — what every other page is handed. */
export type BlogSummary = Omit<BlogPost, 'body' | 'takeaways' | 'questions'>;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const num = (v: unknown): number => {
	const n = typeof v === 'number' ? v : Number(v);
	return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};
const strings = (v: unknown, max: number): string[] => (Array.isArray(v) ? v.map(str).filter(Boolean).slice(0, max) : []);

/** The URL form of a tag: "Vendor risk" → "vendor-risk". The same rule as Sorted's tagSlug. */
export function tagSlug(tag: string): string {
	return String(tag ?? '')
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80)
		.replace(/-+$/, '');
}

/** Newest first; the slug breaks a tie so the order cannot change between requests. */
function byDate(a: { publishedAt: string; slug: string }, b: { publishedAt: string; slug: string }): number {
	if (a.publishedAt === b.publishedAt) return a.slug.localeCompare(b.slug);
	return a.publishedAt < b.publishedAt ? 1 : -1;
}

/**
 * The payload's `blogPosts`, coerced post by post: one bad post is dropped and the rest kept, a
 * repeated slug is served once, and the body is cleaned again here — the site trusts nothing it
 * is about to put in {@html}, whoever sent it. Absent = no blog yet = [].
 */
export function validBlogPosts(v: unknown): BlogPost[] {
	if (!Array.isArray(v)) return [];
	const out: BlogPost[] = [];
	const seen = new Set<string>();
	for (const p of v) {
		if (!isObject(p)) continue;
		const slug = str(p.slug);
		const title = str(p.title);
		if (!SLUG.test(slug) || !title || seen.has(slug)) continue;
		seen.add(slug);
		const image = isObject(p.image) ? p.image : {};
		const author = isObject(p.author) ? p.author : {};
		const meta = isObject(p.meta) ? p.meta : {};
		const body = cleanArticleHtml(typeof p.body === 'string' ? p.body : '');
		const seenTags = new Set<string>();
		const tags = strings(p.tags, 10).filter((t) => {
			const k = tagSlug(t);
			if (!k || seenTags.has(k)) return false;
			seenTags.add(k);
			return true;
		});
		out.push({
			slug,
			title,
			eyebrow: str(p.eyebrow),
			challenge: SLUG.test(str(p.challenge)) ? str(p.challenge) : '',
			excerpt: str(p.excerpt),
			body,
			image: { src: str(image.src), webp: str(image.webp), alt: str(image.alt), width: num(image.width), height: num(image.height) },
			tags,
			author: { name: str(author.name), role: str(author.role) },
			pinned: p.pinned === true,
			takeaways: strings(p.takeaways, 5),
			questions: (Array.isArray(p.questions) ? p.questions : [])
				.filter(isObject)
				.map((q) => ({ q: str(q.q), a: str(q.a) }))
				.filter((q) => q.q && q.a)
				.slice(0, 5),
			publishedAt: str(p.publishedAt),
			updatedAt: str(p.updatedAt),
			meta: { title: str(meta.title), description: str(meta.description), keywords: str(meta.keywords) },
			readMinutes: readMinutes(body),
			wordCount: articleWordCount(body)
		});
	}
	return out.sort(byDate);
}

export function toSummary(post: BlogPost): BlogSummary {
	const { body: _b, takeaways: _t, questions: _q, ...rest } = post;
	return structuredClone(rest);
}

/** Content with every post reduced to its summary — what the browser is handed by the layout. */
export function blogSummaries<T extends { blogPosts?: unknown }>(content: T): T {
	if (!content || !Array.isArray(content.blogPosts)) return content;
	return { ...content, blogPosts: (content.blogPosts as BlogPost[]).map(toSummary) };
}

/**
 * How /blog is laid out with no search: the newest post as the hero, the next three as Recent,
 * the pinned post in Featured research, and the rest under More. Every post appears once. When
 * the only pinned post is also the only post, it is the hero and nothing is featured.
 */
export function blogIndex<T extends BlogSummary>(posts: readonly T[]): { hero: T | null; recent: T[]; featured: T | null; more: T[] } {
	const sorted = [...posts].sort(byDate);
	const featured = sorted.find((p) => p.pinned) ?? null;
	const rest = sorted.filter((p) => p !== featured);
	if (!rest.length) return { hero: featured, recent: [], featured: null, more: [] };
	return { hero: rest[0], recent: rest.slice(1, 4), featured, more: rest.slice(4) };
}

/**
 * Posts matching a search and/or a tag. Every word typed must appear somewhere — the title, the
 * label, the summary, a tag, the author or the article itself. Case and accents are ignored.
 */
export function searchPosts(posts: readonly BlogPost[], q: string, tag = ''): BlogPost[] {
	const fold = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
	const words = fold(q).split(/\s+/).filter(Boolean).slice(0, 12);
	const wanted = tagSlug(tag);
	return posts.filter((p) => {
		if (wanted && !p.tags.some((t) => tagSlug(t) === wanted)) return false;
		if (!words.length) return true;
		const hay = fold([p.title, p.eyebrow, p.excerpt, p.tags.join(' '), p.author.name, articlePlainText(p.body)].join(' \n '));
		return words.every((w) => hay.includes(w));
	});
}

/**
 * "Keep reading": the posts sharing the most tags with this one, then those on the same
 * challenge, then the newest — so there are always `n` where `n` other posts exist.
 */
export function relatedPosts<T extends BlogSummary>(post: BlogSummary, all: readonly T[], n = 3): T[] {
	const mine = new Set(post.tags.map(tagSlug));
	return all
		.filter((p) => p.slug !== post.slug)
		.map((p) => ({
			p,
			shared: p.tags.filter((t) => mine.has(tagSlug(t))).length,
			sameChallenge: !!post.challenge && p.challenge === post.challenge ? 1 : 0
		}))
		.sort((a, b) => b.shared - a.shared || b.sameChallenge - a.sameChallenge || byDate(a.p, b.p))
		.slice(0, n)
		.map((x) => x.p);
}

/** The small label over a post's title: its own, else its challenge's title, else nothing. */
export function postEyebrow(post: Pick<BlogSummary, 'eyebrow' | 'challenge'>, problems: readonly { slug: string; title: string }[]): string {
	if (post.eyebrow) return post.eyebrow;
	return problems.find((p) => p.slug === post.challenge)?.title ?? '';
}

/**
 * "13 October 2026". Pinned to London so the server and the browser print the same day — left to
 * each machine's own zone, a post published near midnight reads as two different dates and the
 * page fails to hydrate.
 */
export function formatPostDate(iso: string): string {
	const d = new Date(iso);
	if (!iso || Number.isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' });
}

/** "6 min read", or '' for a post with no words. */
export function readTimeLabel(minutes: number): string {
	return minutes > 0 ? `${minutes} min read` : '';
}
