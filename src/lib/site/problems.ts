import { PROBLEM_BLOCKS, type ProblemBlockId, type ProblemItem } from '$lib/content';
import { live } from '$lib/content/runtime';
import { isArchived } from '$lib/site/archive';

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
 * The page's blocks in drawing order. Unknown ids and repeats are dropped — one bad entry must not
 * cost the page its layout, and a repeated id is a duplicate {#each} key, which throws during
 * hydration and takes the whole client router down.
 */
export function problemLayout(page: Pick<ProblemItem, 'layout'>): ProblemBlockId[] {
	if (!Array.isArray(page.layout)) return [...PROBLEM_BLOCKS];
	const seen = new Set<ProblemBlockId>();
	for (const entry of page.layout) {
		const id = entry && typeof entry === 'object' ? (entry as { id?: unknown }).id : undefined;
		if (typeof id === 'string' && (PROBLEM_BLOCKS as readonly string[]).includes(id)) seen.add(id as ProblemBlockId);
	}
	return [...seen];
}
