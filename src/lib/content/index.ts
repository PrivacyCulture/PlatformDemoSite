/**
 * Every piece of copy and every image, video and brand asset URL on the site.
 * The CMS ("Sorted") is the source of truth at run time; `data/database.json`
 * is the fallback used when it is not configured or unreachable, and the shape
 * every type below is derived from. See `./runtime.ts` for how the exports
 * follow the content as it changes.
 */
import type { BeatId } from '$lib/journey/beats';
import type raw from '../../../data/database.json';
import { live } from './runtime';
import type { AddedSection } from '$lib/site/added-sections';

export type { AddedSection } from '$lib/site/added-sections';

export type ImageRef = {
	src: string;
	/** Optional WebP alternative served via <picture>. */
	webp?: string;
	alt: string;
	width: number;
	height: number;
};

export type LinkRef = { label: string; href: string };

export type NavLink = {
	label: string;
	href?: string;
	/** Journey-only: scroll to a beat instead of navigating. */
	jump?: 'platform' | 'hero';
	/**
	 * Marks the entry that IS the Features menu: where it sits in the list is where the menu
	 * sits, its label is the menu's name and its href is the menu's "see the whole platform"
	 * link. Set in Sorted (Globals → Main navigation). See $lib/site/features-position.
	 */
	menu?: 'features';
};

export type JourneyShowMe = {
	label: string;
	/** Platform spec page; also drives the generated /platform/[slug] routes. */
	href: string;
	/** Where the preview panel's Explore link goes. Defaults to href. */
	exploreHref?: string;
	/** Real product screenshot for the preview panel; the placeholder mock is used when absent. */
	image?: ImageRef;
	/** Short explanation shown under the screenshot. */
	caption?: string;
};

export type JourneySceneContent = {
	id: BeatId;
	label: string;
	pain: string;
	whatIfRest: string;
	align?: 'left' | 'right';
	/** Seconds after clip start when scene copy appears. */
	textAfterSeconds?: number;
	showMe?: JourneyShowMe;
};

export type JourneyContent = {
	clips: {
		themeId: string;
		themeLabel: string;
		/** Bundled asset path (under /src) for the ambient hero loop. */
		hero: string;
		/** Bundled asset paths for scenes 1–6 plus the shared payoff clip. */
		scenes: string[];
		/**
		 * Where the subject sits in each clip, for cropping on portrait screens:
		 * `"time:x, …"` stops, time as a 0–1 fraction of the clip, x as % of frame width.
		 * `scenes` runs parallel to `clips.scenes`. Missing entries stay centred.
		 */
		portraitFocus?: { hero?: string; scenes?: string[] };
	};
	ui:Omit<(typeof raw)['journey']['ui'], 'beatLabels'> & { beatLabels: Record<BeatId, string> };
	hero: {
		strapline: string;
		titleLines: string[];
		cta: string;
		subline: string;
		showMe: JourneyShowMe;
	};
	scenes: JourneySceneContent[];
	/**
	 * How long the journey waits on a settled beat before its forward button glows and before
	 * it moves on by itself, in seconds. Absent = the defaults in $lib/site/idle-timing.ts.
	 */
	idle?: { glowAfterSeconds?: number | string; beginAfterSeconds?: number | string; nextAfterSeconds?: number | string };
	lens: {
		eyebrow: string;
		eyebrowLines?: string[];
		/** Seconds the vista line sits alone before the conversion copy fades in. */
		textAfterSeconds?: number;
		title: string;
		body: string;
		showMe: JourneyShowMe;
		principlesLabel: string;
		principles: { title: string; subtitle?: string; body: string }[];
		primaryCta: LinkRef;
		secondaryCta: LinkRef;
	};
	emergence: {
		eyebrow: string;
		line1: string;
		line2Before: string;
		line2Em: string;
		line2After: string;
		differentiators: { title: string; body: string }[];
		closing: string;
		closingEm: string;
	};
	doors: {
		eyebrow: string;
		lineBefore: string;
		lineEm: string;
		subline: string;
		items: {
			status: 'live' | 'soon';
			statusLabel: string;
			title: string;
			body: string;
			cta?: string;
			href?: string;
		}[];
	};
};

/** Shared elements a problem page's hero may carry. Keep in step with the CMS's ENUM_RULES. */
export const HERO_SHARED_ELEMENTS = ['none', 'explainer-video'] as const;
export type HeroSharedElement = (typeof HERO_SHARED_ELEMENTS)[number];

/**
 * The blocks of a problem page between its hero and its pager, in their default order.
 * Keep in step with the CMS's PROBLEM_LAYOUT_BLOCKS.
 */
export const PROBLEM_BLOCKS = ['quote', 'inPlatform', 'functionality', 'pricing', 'cta'] as const;
export type ProblemBlockId = (typeof PROBLEM_BLOCKS)[number];

/** One of the ten problem pages, in the order they appear on /platform. */
export type ProblemItem = {
	slug: string;
	href: string;
	/** Short title used in the /platform list and the prev/next pager. */
	title: string;
	/** One-line summary used in the /platform list. */
	summary: string;
	/** `keywords` is optional: set in the CMS, absent in content written before it existed. */
	meta: { title: string; description: string; keywords?: string };
	hero: {
		title: string;
		body: string;
		/**
		 * A shared element drawn in the hero's right-hand column. The element's own content is
		 * edited once (the explainer is `site.video`); this only chooses whether it appears here.
		 * Optional so content written before it existed still renders — absent reads as 'none'.
		 */
		sharedElement?: HeroSharedElement;
	};
	quote?: string;
	/** Product screenshot section. Omitted when `panel` is used instead. */
	inPlatform?: { title: string; body: string; image: ImageRef };
	/** Mock UI panel rendered in place of a screenshot. */
	panel?: 'auditChecklist';
	functionality: { title: string; items: { title: string; body: string }[] };
	cta: { title: string; body: string };
	/**
	 * Which blocks and added sections are drawn, in order. Absent = every block in PROBLEM_BLOCKS
	 * order and nothing added. An id names a block, or a section in `sections`.
	 */
	layout?: { id: string }[];
	/** Sections added to this page in the CMS, placed by `layout`. */
	sections?: AddedSection[];
};

/**
 * A page created in the CMS rather than in this repository, drawn by the generic
 * `(marketing)/[slug]` route. Optional in the content — a CMS or a file without any is normal,
 * and `validateContent` drops anything malformed rather than refusing the whole payload.
 */
export type CustomPage = {
	slug: string;
	meta: { title: string; description: string; keywords?: string };
	eyebrow: string;
	title: string;
	intro: string;
	/** Drawn in order. Each is made from a template; the first pages had only text sections. */
	sections: AddedSection[];
	/** The house demo CTA. Blank lines fall back to `site.demoCta`. */
	cta: { eyebrow: string; title: string; body: string; micro: string };
};

type Raw = typeof raw;

export type SiteContent = Omit<Raw, 'journey' | 'problems' | 'site'> & {
	site: Omit<Raw['site'], 'nav'> & {
		nav: Omit<Raw['site']['nav'], 'links'> & { links: NavLink[] };
	};
	journey: JourneyContent;
	problems: { common: Raw['problems']['common']; items: ProblemItem[] };
	customPages?: CustomPage[];
	/** Addresses archived in the CMS: answered with "not found", and links to them hidden. */
	archivedPaths?: string[];
};

export const content = live((c) => c);

export const site = live((c) => c.site);
export const journey = live((c) => c.journey);
export const pages = live((c) => c.pages);
export const problems = live((c) => c.problems);
export const panels = live((c) => c.panels);
export const demoForm = live((c) => c.demoForm);
export const aeo = live((c) => c.aeo);
export const customPages = live((c) => c.customPages ?? [], 'array');
export const archivedPaths = live((c) => c.archivedPaths ?? [], 'array');

/** A page created in the CMS, or undefined. Read inside a load, after `await parent()`. */
export function customPageBySlug(slug: string): CustomPage | undefined {
	return customPages.find((p) => p.slug === slug);
}

/** "<page title> — <brand>", the pattern every marketing page's <title> follows. */
export function pageTitle(title: string, suffix: string = site.brand): string {
	return `${title}${site.titleSeparator}${suffix}`;
}
