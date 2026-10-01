// The <head> tags every page emits, decided here and drawn by SeoHead.svelte.
//
// Sorted's Platform CMS mirrors the LISTING rules (title, description, keywords) in
// src/lib/platform-seo.ts so its search-listing preview shows what this renders. Change those
// and change the other. The social tags and the canonical below are the site's alone.

import { plain } from './rich';

export type SeoInput = {
	/** The finished <title> text — the caller applies pageTitle() or not. */
	title: string;
	description?: string | null;
	/** Comma-separated. */
	keywords?: string | null;
	/** The page's own main image, site-relative or absolute. Absent = no social image. */
	image?: string | null;
	imageWidth?: number | null;
	imageHeight?: number | null;
	imageAlt?: string | null;
	/** `og:site_name`. */
	siteName?: string | null;
	/** True on a page search engines must not index: the 404, and every page of the draft site. */
	noindex?: boolean;
	/** page.url.origin */
	origin: string;
	/** page.url.pathname */
	pathname: string;
};

export type SeoTag = { name?: string; property?: string; content: string };

export const LOCALE = 'en_GB';

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

export function seoTitle(input: Pick<SeoInput, 'title'>): string {
	return plain(input.title).trim();
}

/**
 * The page's one address: origin + path, no query string, no trailing slash, no fragment.
 * UTM parameters are captured on arrival and must not make a second indexable page.
 */
export function canonicalUrl(input: Pick<SeoInput, 'origin' | 'pathname'>): string {
	const path = (input.pathname || '/').split(/[?#]/)[0] ?? '/';
	const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path;
	return absolute(trimmed, input.origin);
}

/** Every tag, in order, never one with empty content. */
export function seoTags(input: SeoInput): SeoTag[] {
	const title = seoTitle(input);
	const description = plain(input.description ?? '').trim();
	const keywords = normaliseKeywords(plain(input.keywords ?? ''));
	const image = input.image ? absolute(input.image.trim(), input.origin) : '';
	const imageAlt = plain(input.imageAlt ?? '').trim();
	const url = canonicalUrl(input);
	const siteName = plain(input.siteName ?? '').trim();

	const tags: SeoTag[] = [];
	if (input.noindex) tags.push({ name: 'robots', content: 'noindex, nofollow' });
	if (description) tags.push({ name: 'description', content: description });
	if (keywords) tags.push({ name: 'keywords', content: keywords });
	if (title) tags.push({ property: 'og:title', content: title });
	if (description) tags.push({ property: 'og:description', content: description });
	tags.push({ property: 'og:type', content: 'website' });
	tags.push({ property: 'og:url', content: url });
	if (siteName) tags.push({ property: 'og:site_name', content: siteName });
	tags.push({ property: 'og:locale', content: LOCALE });
	if (image) {
		tags.push({ property: 'og:image', content: image });
		if (input.imageWidth && input.imageHeight) {
			tags.push({ property: 'og:image:width', content: String(input.imageWidth) });
			tags.push({ property: 'og:image:height', content: String(input.imageHeight) });
		}
		if (imageAlt) tags.push({ property: 'og:image:alt', content: imageAlt });
		tags.push({ name: 'twitter:card', content: 'summary_large_image' });
		tags.push({ name: 'twitter:image', content: image });
		if (imageAlt) tags.push({ name: 'twitter:image:alt', content: imageAlt });
	} else {
		tags.push({ name: 'twitter:card', content: 'summary' });
	}
	if (title) tags.push({ name: 'twitter:title', content: title });
	if (description) tags.push({ name: 'twitter:description', content: description });
	return tags;
}
