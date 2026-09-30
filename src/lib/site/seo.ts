// The <head> tags every page emits, decided here and drawn by SeoHead.svelte.
//
// Sorted's Platform CMS mirrors these rules in src/lib/platform-seo.ts so its search-listing
// preview shows what this renders. Change one and change the other.

import { plain } from './rich';

export type SeoInput = {
	/** The finished <title> text — the caller applies pageTitle() or not. */
	title: string;
	description?: string | null;
	/** Comma-separated. */
	keywords?: string | null;
	/** The page's own main image, site-relative or absolute. Absent = no social image. */
	image?: string | null;
	/** page.url.origin */
	origin: string;
	/** page.url.pathname */
	pathname: string;
};

export type SeoTag = { name?: string; property?: string; content: string };

/** Read an optional `meta.keywords` off any meta object, whatever the content file's type says. */
export function metaKeywords(meta: unknown): string {
	if (!meta || typeof meta !== 'object') return '';
	const k = (meta as { keywords?: unknown }).keywords;
	return typeof k === 'string' ? k : '';
}

/** Trim, drop empties, dedupe case-insensitively, join with ", ". */
export function normaliseKeywords(value: string | null | undefined): string {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const raw of String(value ?? '').split(',')) {
		const k = raw.replace(/\s+/g, ' ').trim();
		if (!k || seen.has(k.toLowerCase())) continue;
		seen.add(k.toLowerCase());
		out.push(k);
	}
	return out.join(', ');
}

function absolute(url: string, origin: string): string {
	if (/^https?:\/\//i.test(url)) return url;
	if (url.startsWith('//')) return '';
	return `${origin.replace(/\/$/, '')}/${url.replace(/^\/+/, '')}`;
}

export function seoTitle(input: SeoInput): string {
	return plain(input.title).trim();
}

/** Every tag, in order, never one with empty content. */
export function seoTags(input: SeoInput): SeoTag[] {
	const title = seoTitle(input);
	const description = plain(input.description ?? '').trim();
	const keywords = normaliseKeywords(plain(input.keywords ?? ''));
	const image = input.image ? absolute(input.image.trim(), input.origin) : '';
	const url = absolute(input.pathname || '/', input.origin);

	const tags: SeoTag[] = [];
	if (description) tags.push({ name: 'description', content: description });
	if (keywords) tags.push({ name: 'keywords', content: keywords });
	if (title) tags.push({ property: 'og:title', content: title });
	if (description) tags.push({ property: 'og:description', content: description });
	tags.push({ property: 'og:type', content: 'website' });
	tags.push({ property: 'og:url', content: url });
	if (image) {
		tags.push({ property: 'og:image', content: image });
		tags.push({ name: 'twitter:card', content: 'summary_large_image' });
	} else {
		tags.push({ name: 'twitter:card', content: 'summary' });
	}
	return tags;
}
