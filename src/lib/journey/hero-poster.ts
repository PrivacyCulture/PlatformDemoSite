// The hero's still: frame 0 of the hero clip, shown from the first paint so the page has its
// largest image (the LCP) long before the clip has downloaded. Found by naming convention next to
// the clip, so it needs no content key and works whatever the CMS has synced:
//
//   start.mp4                    the clip
//   start-poster.webp            frame 0, 1280×720 — every screen
//   start-poster-portrait.webp   optional: a centre crop for portrait screens (720×720 covers
//                                any of them), so phones download a smaller file
//
// The crop is the centre because the hero's portrait focus is "0:50". If that ever moves, crop
// the portrait still to match or leave it out.

export type HeroPosterPaths = { landscape: string; portrait: string };

/** Where the stills for a bundled hero clip would be, or null for a clip that is not bundled. */
export function heroPosterPaths(heroPath: string): HeroPosterPaths | null {
	const path = typeof heroPath === 'string' ? heroPath.trim() : '';
	if (!path.startsWith('/src/')) return null;
	const match = /^(.*)\.(mp4|webm|mov)$/i.exec(path);
	if (!match) return null;
	const base = match[1]!;
	return { landscape: `${base}-poster.webp`, portrait: `${base}-poster-portrait.webp` };
}
