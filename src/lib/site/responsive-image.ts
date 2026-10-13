// Responsive images from the Platform media library. Pure — no $env, no server, no DB.
//
// Shared byte for byte between Sorted (src/lib/responsive-image.ts) and the Platform site
// (VideoAI src/lib/site/responsive-image.ts). Both repos assert its SHA-256 in a test; copy the
// file across and update the constant in BOTH tests — never edit one side alone.
//
// Sorted stores a photo or screenshot as WebP copies at fixed widths beside the original upload:
// `<name>--w480.webp`, `<name>--w960.webp`, … up to the largest, which is the picture's own width
// capped at MAX_IMAGE_WIDTH. The content holds the address of the LARGEST copy, and its name says
// every other width there is — so the site can offer them all from that one address, and an
// address without the marker is simply drawn as it is.

/** The widths a picture is stored at, smallest first, below its own (capped) width. */
export const IMAGE_WIDTHS: readonly number[] = [480, 960, 1440, 1920];

/** No copy is wider than this. Wide enough for a full-width screenshot on a 2x screen. */
export const MAX_IMAGE_WIDTH = 1920;

// `--` never appears in a name Sorted makes for an upload (runs of anything else collapse to one
// `-`), so the marker cannot be mistaken for part of somebody's file name.
const MARKER = /--w(\d{1,4})\.webp$/;

/** The widths stored for a picture whose largest copy is `top` pixels wide, smallest first. */
export function variantWidths(top: number): number[] {
	return [...IMAGE_WIDTHS.filter((w) => w < top), top];
}

/** The width the largest copy of a picture `width` pixels wide is stored at. */
export function topWidth(width: number): number {
	return Math.min(Math.max(1, Math.round(width)), MAX_IMAGE_WIDTH);
}

/** The stored name of one copy: `images/foo-k3j2ab12` + 960 → `images/foo-k3j2ab12--w960.webp`. */
export function variantName(base: string, width: number): string {
	return `${base}--w${width}.webp`;
}

/** Splits an address into the part the marker applies to and any query or fragment. */
function split(url: string): { path: string; rest: string } {
	const i = url.search(/[?#]/);
	return i === -1 ? { path: url, rest: '' } : { path: url.slice(0, i), rest: url.slice(i) };
}

/** The largest copy's width when `url` names a stored copy, else null. */
export function optimisedWidth(url: string): number | null {
	const m = MARKER.exec(split(String(url ?? '').trim()).path);
	if (!m) return null;
	const w = Number(m[1]);
	return w >= 1 && w <= MAX_IMAGE_WIDTH ? w : null;
}

/** The address of the `width` copy of the picture `url` names. */
export function variantUrl(url: string, width: number): string {
	const { path, rest } = split(String(url ?? '').trim());
	return path.replace(MARKER, `--w${width}.webp`) + rest;
}

/**
 * A `srcset` offering every stored copy of the picture `url` names, or null when `url` is not a
 * stored copy (a file in the site's own folder, a third-party address, an SVG).
 */
export function responsiveSrcset(url: string): string | null {
	const top = optimisedWidth(url);
	if (top === null) return null;
	return variantWidths(top)
		.map((w) => `${variantUrl(url, w)} ${w}w`)
		.join(', ');
}
