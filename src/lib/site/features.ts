// The Features menu in the top navigation, managed in Sorted as `site.nav.features`. Both headers
// draw it — a panel on wide screens, an accordion in the phone menu — from the entries here.

import { isArchived, normalisePath } from './archive';

/** `icon` is an id from ./feature-icons. */
export type FeatureItem = { label: string; icon?: string; body?: string; href: string };

export type FeaturesMenu = {
	label: string;
	allLabel?: string;
	allHref?: string;
	items: readonly FeatureItem[];
};

function isFeatureItem(x: unknown): x is FeatureItem {
	if (!x || typeof x !== 'object') return false;
	const { label, href } = x as Record<string, unknown>;
	return typeof label === 'string' && label.trim() !== '' && typeof href === 'string' && href.trim() !== '';
}

/** The entries a visitor can follow: well formed, and not pointing at an archived page. */
export function featureItems(items: readonly unknown[] | undefined): FeatureItem[] {
	if (!Array.isArray(items)) return [];
	return items.filter(isFeatureItem).filter((item) => !isArchived(item.href));
}

/** The menu's closing link, or nothing when it has no label or its page is archived. */
export function allLink(menu: FeaturesMenu): { label: string; href: string } | null {
	const label = menu.allLabel?.trim();
	const href = menu.allHref?.trim();
	if (!label || !href || isArchived(href)) return null;
	return { label, href };
}

export function isCurrentFeature(href: string, path: string): boolean {
	const p = normalisePath(href);
	return !!p && p === normalisePath(path);
}

export { splitAtFeatures, featuresMenuFrom, isFeaturesEntry } from './features-position';
