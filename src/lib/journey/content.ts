import { journey } from '$lib/content';
import { isArchived } from '$lib/site/archive';

export type {
	JourneyContent,
	JourneySceneContent,
	JourneyShowMe
} from '$lib/content';

/** All editable journey copy lives in the site content under `journey` (see `$lib/content`). */
export const content = journey;

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
		if (!href || isArchived(href)) return [];
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

/** A scene's "Show me" link, or undefined when its page is archived — the scene itself stays. */
export function sceneShowMe<T extends { href?: string }>(showMe: T | undefined): T | undefined {
	return showMe && !isArchived(showMe.href) ? showMe : undefined;
}

export function platformSpecBySlug(slug: string): PlatformSpec | undefined {
	return platformSpecs().find((spec) => spec.slug === slug);
}

export function sceneClassName(scene: (typeof content.scenes)[number]): string {
	return scene.align === 'right' ? 'scene-copy from-right' : 'scene-copy';
}
