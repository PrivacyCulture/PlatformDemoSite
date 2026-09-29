// Pages archived in the CMS. Sorted serves the list as `archivedPaths`; while a path is on it the
// site answers it with "not found" and hides the links it draws to it — the menus, the footer, the
// problems list and pager, the journey's "Show me" links. Pure apart from the live() list, and
// safe for content served before the key existed (absent = nothing archived).

import { archivedPaths } from '$lib/content';

/** `/Pricing/` and `/pricing?x#y` are the same page. Empty for anything that is not a site path. */
export function normalisePath(href: string | undefined | null): string {
	if (typeof href !== 'string') return '';
	const path = href.trim().split(/[?#]/)[0] ?? '';
	if (!path.startsWith('/') || path.startsWith('//')) return '';
	const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path;
	return trimmed.toLowerCase() || '/';
}

/** Home and /platform can never be archived, whatever a list says — they hold the site together. */
const NEVER = new Set(['/', '/platform']);

export function isArchivedIn(list: readonly unknown[] | undefined, href: string | undefined | null): boolean {
	const p = normalisePath(href);
	if (!p || NEVER.has(p) || !Array.isArray(list)) return false;
	return list.some((x) => typeof x === 'string' && normalisePath(x) === p);
}

/** Whether a link on the page points at an archived page. Read inside a component or load. */
export function isArchived(href: string | undefined | null): boolean {
	return isArchivedIn(archivedPaths, href);
}

/** The links whose target is still on the site. */
export function visibleLinks<T extends { href?: string }>(links: readonly T[]): T[] {
	return links.filter((l) => !isArchived(l.href));
}
