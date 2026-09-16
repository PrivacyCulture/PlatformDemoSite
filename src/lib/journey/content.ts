import type { BeatId } from '$lib/journey/beats';
import raw from '$lib/journey/content.json';

export type JourneyShowMe = {
	label: string;
	href: string;
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
	meta: {
		title: string;
		description: string;
	};
	nav: {
		links: {
			label: string;
			href?: string;
			jump?: 'platform' | 'hero';
		}[];
		demo: {
			label: string;
			href: string;
		};
	};
	legal: {
		links: { label: string; href: string }[];
	};
	coldOpen: {
		title: string;
		paragraphs: string[];
		tagline: string;
		begin: string;
		skip: string;
	};
	hero: {
		strapline: string;
		titleLines: string[];
		cta: string;
		subline: string;
		showMe: JourneyShowMe;
	};
	scenes: JourneySceneContent[];
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
		primaryCta: { label: string; href: string };
		secondaryCta: { label: string; href: string };
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

/** All editable journey copy — edit `content.json`. */
export const content = raw as JourneyContent;

export type PlatformSpec = {
	slug: string;
	label: string;
	pain: string;
	whatIfRest: string;
	href: string;
};

export function platformSpecs(): PlatformSpec[] {
	return content.scenes.flatMap((scene) => {
		const href = scene.showMe?.href;
		if (!href) return [];
		const slug = href.match(/^\/platform\/([^/?#]+)$/)?.[1];
		if (!slug) return [];
		return [
			{
				slug,
				label: scene.label,
				pain: scene.pain,
				whatIfRest: scene.whatIfRest,
				href
			}
		];
	});
}

export function platformSpecBySlug(slug: string): PlatformSpec | undefined {
	return platformSpecs().find((spec) => spec.slug === slug);
}

export function sceneClassName(scene: JourneySceneContent): string {
	return scene.align === 'right' ? 'scene-copy from-right' : 'scene-copy';
}
