// Where the Features menu sits in the top navigation — pure, with no imports, so the rule is
// tested offline (scripts/test-features-position.ts). Re-exported by ./features.
//
// The menu is an ENTRY in the main navigation list, marked `menu: 'features'`, managed in Sorted
// beside the other links: where it sits in the list is where the menu sits, its label is the
// menu's name, and its href is the menu's closing "see the whole platform" link. A list with no
// such entry draws the menu first, which is where it sat before the entry existed.

type Entry = { label?: unknown; href?: unknown; menu?: unknown };

export function isFeaturesEntry(link: unknown): boolean {
	return !!link && typeof link === 'object' && (link as Entry).menu === 'features';
}

/**
 * The main navigation links before and after the menu, and the entry that places it. Split on
 * the FULL list, before any link is hidden for pointing at an archived page, so archiving one
 * never moves the menu. A second marked entry is dropped rather than drawn as a plain link.
 */
export function splitAtFeatures<T>(links: readonly T[]): { before: T[]; after: T[]; entry: T | null } {
	const at = links.findIndex(isFeaturesEntry);
	const plain = (xs: readonly T[]) => xs.filter((l) => !isFeaturesEntry(l));
	if (at < 0) return { before: [], after: plain(links), entry: null };
	return { before: plain(links.slice(0, at)), after: plain(links.slice(at + 1)), entry: links[at] };
}

/** The menu as drawn: the entry's label and link win over the menu's own, where they are set. */
export function featuresMenuFrom<M extends { label: string; allHref?: string }>(menu: M, entry: unknown): M {
	if (!isFeaturesEntry(entry)) return menu;
	const e = entry as Entry;
	const label = typeof e.label === 'string' && e.label.trim() ? e.label.trim() : menu.label;
	const allHref = typeof e.href === 'string' && e.href.trim() ? e.href.trim() : menu.allHref;
	return { ...menu, label, allHref };
}
