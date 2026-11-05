// Pages whose header shows no menu links — only the logo and the Book a demo button. Set per page
// in Sorted's page builder (Page details → "Hide the menu links"), for a landing page that should
// lead to one thing. Sorted serves it on the page's block page; the site lists the addresses as
// `navHiddenPaths`. Pure apart from the live() list; absent = every page has its menu.

import { navHiddenPaths } from '$lib/content';
import { normalisePath } from './archive';

/** The address a block page's key draws at; null for one with no address of its own. */
export function blockPagePath(key: string): string | null {
	if (!/^[a-z0-9-]+$/.test(key) || key === 'not-found') return null;
	const m = /^(?:problem|custom)-(.+)$/.exec(key);
	return `/${m ? m[1] : key}`;
}

/** The addresses of the block pages that hide their menu links. */
export function navHiddenPathsOf(pages: Record<string, { hideNavigation?: boolean }>): string[] {
	const out: string[] = [];
	for (const [key, page] of Object.entries(pages)) {
		const path = page.hideNavigation === true ? blockPagePath(key) : null;
		if (path && !out.includes(path)) out.push(path);
	}
	return out.sort();
}

export function isNavHiddenIn(list: readonly unknown[] | undefined, pathname: string | undefined | null): boolean {
	const p = normalisePath(pathname);
	if (!p || !Array.isArray(list)) return false;
	return list.some((x) => typeof x === 'string' && normalisePath(x) === p);
}

/** Whether the page at this address hides its menu links. Read inside a component. */
export function isNavHidden(pathname: string | undefined | null): boolean {
	return isNavHiddenIn(navHiddenPaths, pathname);
}
