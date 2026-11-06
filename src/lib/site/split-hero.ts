/**
 * The split hero: two panels side by side on one background, chosen in Sorted's page builder as the
 * Hero block's "Split: pitch and services" layout.
 *
 * - The pitch panel is the hero's own eyebrow, heading and copy, a row of short stats, and the hero
 *   block's first button drawn as the gold card (`cta`, carried here because the FAQ and pages made
 *   in Sorted have no hero buttons of their own) with a line under it.
 * - The services panel has words of its own and a list of icon + label links, with one outline button.
 * - Both share the background (a picture or a video; none = the navy gradient). Each panel lays its
 *   own colour over it at its own opacity, and sets whether its text is light or dark.
 * - `swap` puts the services panel on the left.
 *
 * The content carries it as `split` beside the hero's words (`hero.split`, or top level on the FAQ
 * and on pages made in Sorted), written by block-pages.ts and absent for the ordinary hero. Every
 * field is coerced here before it is drawn, so a malformed value costs that value, not the page.
 *
 * Keep in step with Sorted's src/lib/page-builder/platform-convert.ts (`splitData`). Pure.
 */

import { featureIcon } from './feature-icons';

export type SplitTone = 'light' | 'dark';

export type SplitPanelLook = {
	/** `#rrggbb`, or '' for no overlay. */
	overlay: string;
	/** 0–100. */
	opacity: number;
	tone: SplitTone;
};

export type SplitPicture = { src: string; alt: string; width?: number; height?: number; webp?: string };

export type HeroSplit = {
	/** true = the services panel on the left. */
	swap: boolean;
	/** The shared background picture; null with a video or with nothing. */
	background: SplitPicture | null;
	/** The shared background video's address; '' for none. */
	video: string;
	/** The gold card: the hero block's first button. A blank label = the page's own primary button. */
	cta: { label: string; href: string };
	pitch: SplitPanelLook & { stats: { title: string; body: string }[]; ctaNote: string };
	services: SplitPanelLook & {
		eyebrow: string;
		heading: string;
		body: string;
		links: { label: string; href: string; icon: string }[];
		button: { label: string; href: string };
	};
};

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const rec = (v: unknown): Rec => (isRec(v) ? v : {});

export const SPLIT_DEFAULTS = {
	pitch: { overlay: '#0b1f5c', opacity: 80, tone: 'light' as SplitTone },
	services: { overlay: '#f3f5fa', opacity: 95, tone: 'dark' as SplitTone }
};

/** A colour as the overlay takes it: `#rrggbb` (a `#rgb` is widened), anything else is none. */
export function overlayColour(v: unknown): string {
	const s = str(v).trim().toLowerCase();
	if (/^#[0-9a-f]{6}$/.test(s)) return s;
	const m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s);
	return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}` : '';
}

/** An opacity in whole percent, 0–100; anything not a number is `fallback`. */
export function overlayOpacity(v: unknown, fallback: number): number {
	const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
	return Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n))) : fallback;
}

const tone = (v: unknown, fallback: SplitTone): SplitTone => (v === 'light' || v === 'dark' ? v : fallback);

function look(v: Rec, d: SplitPanelLook): SplitPanelLook {
	return {
		overlay: 'overlay' in v ? overlayColour(v.overlay) : d.overlay,
		opacity: overlayOpacity(v.opacity, d.opacity),
		tone: tone(v.tone, d.tone)
	};
}

function picture(v: unknown): SplitPicture | null {
	const r = rec(v);
	const src = str(r.src).trim();
	if (!src) return null;
	const out: SplitPicture = { src, alt: str(r.alt) };
	if (typeof r.width === 'number') out.width = r.width;
	if (typeof r.height === 'number') out.height = r.height;
	if (str(r.webp)) out.webp = str(r.webp);
	return out;
}

/** The split hero from the content, coerced field by field; null when there is none. */
export function readHeroSplit(v: unknown): HeroSplit | null {
	if (!isRec(v)) return null;
	const p = rec(v.pitch);
	const s = rec(v.services);
	const b = rec(s.button);
	const c = rec(v.cta);
	return {
		swap: v.swap === true,
		background: picture(v.background),
		video: str(v.video).trim(),
		cta: { label: str(c.label), href: str(c.href) },
		pitch: {
			...look(p, SPLIT_DEFAULTS.pitch),
			stats: arr(p.stats)
				.filter(isRec)
				.map((x) => ({ title: str(x.title), body: str(x.body) }))
				.filter((x) => x.title.trim() || x.body.trim()),
			ctaNote: str(p.ctaNote)
		},
		services: {
			...look(s, SPLIT_DEFAULTS.services),
			eyebrow: str(s.eyebrow),
			heading: str(s.heading),
			body: str(s.body),
			links: arr(s.links)
				.filter(isRec)
				.map((x) => ({ label: str(x.label), href: str(x.href), icon: featureIcon(str(x.icon)) ? str(x.icon) : '' }))
				.filter((x) => x.label.trim()),
			button: { label: str(b.label), href: str(b.href) }
		}
	};
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(?:[?#]|$)/i;

/** Whether a media pick from Sorted (`{url, mime, …}`) is a video. */
export function isVideoMedia(m: unknown): boolean {
	const r = rec(m);
	return str(r.mime).startsWith('video/') || VIDEO_EXT.test(str(r.url));
}

/**
 * The split hero as block-pages.ts writes it into the content, from a Hero block's data, or null
 * when the block is not on the split layout. `picture` is block-pages' own media writer.
 */
export function splitFromBlock(
	hero: { layout: string; swap: boolean; data: Rec; header: { buttons: { label: string; url: string }[] } },
	picture: (m: unknown) => Rec | null
): Rec | null {
	if (hero.layout !== 'split') return null;
	const d = hero.data;
	const first = hero.header.buttons[0];
	const bg = rec(d.background);
	const video = isVideoMedia(bg) ? str(bg.url).trim() : '';
	const items = (v: unknown) => arr(v).filter(isRec);
	return {
		swap: hero.swap,
		background: video ? null : picture(d.background),
		video,
		cta: { label: first?.label ?? '', href: first?.url ?? '' },
		pitch: {
			overlay: overlayColour(d.pitchOverlay),
			opacity: overlayOpacity(d.pitchOpacity, SPLIT_DEFAULTS.pitch.opacity),
			tone: tone(d.pitchTone, SPLIT_DEFAULTS.pitch.tone),
			stats: items(d.stats).map((i) => ({ title: str(i.title), body: str(i.body) })),
			ctaNote: str(d.ctaNote)
		},
		services: {
			overlay: overlayColour(d.servicesOverlay),
			opacity: overlayOpacity(d.servicesOpacity, SPLIT_DEFAULTS.services.opacity),
			tone: tone(d.servicesTone, SPLIT_DEFAULTS.services.tone),
			eyebrow: str(d.servicesEyebrow),
			heading: str(d.servicesHeading),
			body: str(d.servicesBody),
			links: items(d.services).map((i) => ({ label: str(i.title), href: str(i.buttonUrl), icon: str(i.icon) })),
			button: { label: str(d.servicesButtonText), href: str(d.servicesButtonUrl) }
		}
	};
}
