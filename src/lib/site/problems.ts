import { PROBLEM_BLOCKS, type ProblemBlockId, type ProblemItem } from '$lib/content';
import { live } from '$lib/content/runtime';
import { isArchived } from '$lib/site/archive';
import { safeHref } from '$lib/site/added-sections';
import { pageLayout, type LayoutEntry } from '$lib/site/page-layout';

/** The pain points in the order they appear on /platform. Each has its own page. */
export const problems: readonly ProblemItem[] = live((c) => c.problems.items, 'array');

/** Shared labels used by every problem page (eyebrows, CTAs, pager). */
export const problemCommon = live((c) => c.problems.common);

export type Problem = ProblemItem;

export function problemByHref(href: string): Problem {
	const item = problems.find((p) => p.href === href);
	if (!item) throw new Error(`Unknown problem page: ${href}`);
	return item;
}

/** The problems still on the site — an archived one is left out of the list and the pager. */
export function visibleProblems(): Problem[] {
	return problems.filter((p) => !isArchived(p.href));
}

/**
 * Previous and next problem relative to `href`, wrapping at both ends so both links always exist.
 * Archived problems are skipped; with no other page left, both are null and the pager draws nothing.
 */
export function problemNeighbours(href: string): { previous: Problem | null; next: Problem | null } {
	const list = visibleProblems();
	const i = list.findIndex((p) => p.href === href);
	if (i === -1) throw new Error(`Unknown problem page: ${href}`);
	const n = list.length;
	if (n < 2) return { previous: null, next: null };
	return { previous: list[(i - 1 + n) % n]!, next: list[(i + 1) % n]! };
}

/**
 * The page's blocks and added sections in drawing order. Unknown ids and repeats are dropped —
 * one bad entry must not cost the page its layout, and a repeated id is a duplicate {#each} key,
 * which throws during hydration and takes the whole client router down.
 */
export function problemLayout(page: Pick<ProblemItem, 'layout' | 'sections'>): LayoutEntry<ProblemBlockId>[] {
	return pageLayout(page, PROBLEM_BLOCKS, PROBLEM_BLOCKS);
}

/** One row of the /platform problems list: a problem page, or another page Sorted's list links to. */
export type ProblemListEntry = { href: string; title: string; summary: string };

/**
 * The /platform problems list in order. With no `entries` (the list holds only problem pages) it
 * is the problem pages still on the site, as it always was. With entries, each names a problem by
 * slug or another page by address with its own words; an archived or unknown page is skipped, a
 * repeated address drawn once (it keys the list), and a problem the entries do not name — added to
 * the file since the list was saved — follows at the end.
 */
export function problemListEntries(list: unknown): ProblemListEntry[] {
	const raw = list && typeof list === 'object' ? (list as { entries?: unknown }).entries : undefined;
	const visible = visibleProblems();
	const asEntry = (p: Problem): ProblemListEntry => ({ href: p.href, title: p.title, summary: p.summary });
	if (!Array.isArray(raw)) return visible.map(asEntry);
	const out: ProblemListEntry[] = [];
	const seen = new Set<string>();
	const push = (e: ProblemListEntry) => {
		if (!e.href || seen.has(e.href) || isArchived(e.href)) return;
		seen.add(e.href);
		out.push(e);
	};
	for (const e of raw) {
		if (!e || typeof e !== 'object') continue;
		const r = e as Record<string, unknown>;
		if (typeof r.slug === 'string') {
			const p = visible.find((x) => x.slug === r.slug);
			if (p) push(asEntry(p));
		} else if (typeof r.href === 'string' && typeof r.title === 'string' && r.title.trim()) {
			const href = safeHref(r.href);
			if (href) push({ href, title: r.title, summary: typeof r.summary === 'string' ? r.summary : '' });
		}
	}
	for (const p of visible) push(asEntry(p));
	return out;
}
