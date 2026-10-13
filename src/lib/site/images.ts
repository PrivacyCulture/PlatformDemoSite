/**
 * Responsive pictures. A picture from Sorted's media library is stored as WebP copies at several
 * widths, and its address names the largest (`…--w1920.webp`, see responsive-image.ts, shared with
 * Sorted). These helpers offer the browser every copy with a `sizes` hint, so it downloads the
 * smallest one that is sharp at the size the picture is drawn. Any other address — a file in
 * /static, an SVG — is drawn exactly as before.
 */
import { optimisedWidth, responsiveSrcset, variantUrl, variantWidths } from './responsive-image';

/**
 * How wide each kind of picture is drawn, for `sizes`. The page column is 72rem (1152px) with
 * side padding of up to 7vw, so "90vw" is the narrow-screen width of anything full-column.
 */
export const SIZES = {
	/** The whole page column. */
	column: '(min-width: 1344px) 1152px, 90vw',
	/** One side of a two-column row (lg:grid-cols-2). */
	half: '(min-width: 1344px) 560px, (min-width: 1024px) 45vw, 90vw',
	/** A card in a grid of two, then three. */
	card: '(min-width: 1344px) 370px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw',
	/** An article's reading column (46rem). */
	article: '(min-width: 900px) 736px, 90vw',
	/** The blog index hero (min(40rem, 46%)). */
	blogHero: '(min-width: 1024px) 640px, 90vw',
	/** The explainer box (52rem). */
	explainer: '(min-width: 960px) 832px, 90vw',
	/** The journey's feature preview panel (min(42vw, 30rem)). */
	preview: '(min-width: 768px) 480px, 90vw',
	/** The Next step box's picture (26rem column, wide screens only). */
	demoCta: '416px',
	/** A logo drawn about 2rem tall. */
	logo: '240px',
	/** The enlarged picture in a dialog. */
	zoom: '94vw'
} as const;

/** `srcset` and `sizes` for an <img>, when the picture has copies; nothing otherwise. */
export function responsive(src: string, sizes: string): { srcset?: string; sizes?: string } {
	const srcset = responsiveSrcset(src);
	return srcset ? { srcset, sizes } : {};
}

/** A <source>'s `srcset`: every copy when the picture has them, else the address itself. */
export function sourceSrcset(url: string): string {
	return responsiveSrcset(url) ?? url;
}

/**
 * The copy to use where only one address fits — a CSS background, a video poster: the smallest
 * copy at least `width` pixels wide (the largest if none is). Any other address comes back as is.
 */
export function imageAtWidth(url: string, width: number): string {
	const top = optimisedWidth(url);
	if (top === null) return url;
	const w = variantWidths(top).find((v) => v >= width) ?? top;
	return variantUrl(url, w);
}

/**
 * An article body with every library picture made responsive and lazy. The body has already been
 * through the article grammar, which writes each picture exactly as `<img src="…" alt="…">`.
 */
export function responsiveArticleImages(html: string, sizes: string = SIZES.article): string {
	return html.replace(/<img src="([^"]*)"/g, (whole, raw: string) => {
		const srcset = responsiveSrcset(raw.replace(/&amp;/g, '&'));
		if (!srcset) return whole;
		const attr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
		return `<img loading="lazy" decoding="async" srcset="${attr(srcset)}" sizes="${attr(sizes)}" src="${raw}"`;
	});
}
