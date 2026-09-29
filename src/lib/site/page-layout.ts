/**
 * The order a page draws its blocks in, and the sections added to it in the CMS.
 *
 * Both keys are optional and read defensively: `layout` (`[{ id }]`) names the page's own blocks
 * and the added sections, in drawing order; `sections` holds the added sections themselves (see
 * added-sections.ts). No layout = the order the page always had, with nothing added. An id that
 * names neither a block nor an added section is skipped, as is a repeat — a repeated id is a
 * duplicate {#each} key, which throws during hydration and takes the client router down.
 *
 * Keep in step with the CMS: PLATFORM_LAYOUT_BLOCKS / PLATFORM_LAYOUT_DEFAULT and
 * PROBLEM_LAYOUT_BLOCKS in Sorted's platform-structure.ts. A block the site does not know is
 * skipped here, silently.
 */
import { addedSections, type AddedSection } from './added-sections';

export const PLATFORM_BLOCKS = ['fit', 'problems', 'pricing', 'cta', 'explainer', 'trusted'] as const;
export type PlatformBlockId = (typeof PLATFORM_BLOCKS)[number];
// `trusted` leads: first, it is drawn INSIDE the hero exactly as it always was (see
// logosInHero); moved anywhere else, it becomes a band of its own there.
export const PLATFORM_DEFAULT_LAYOUT: readonly PlatformBlockId[] = ['trusted', 'fit', 'problems', 'pricing', 'cta'];

export type LayoutEntry<B extends string> = { kind: 'block'; id: B } | { kind: 'section'; id: string; section: AddedSection };

export type PlatformEntry = LayoutEntry<PlatformBlockId>;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/**
 * A page's blocks and added sections in drawing order. `blocks` are the ids the page can draw;
 * `defaultLayout` is what it draws when the copy carries no `layout` at all.
 */
export function pageLayout<B extends string>(copy: unknown, blocks: readonly B[], defaultLayout: readonly B[]): LayoutEntry<B>[] {
	const rec = copy && typeof copy === 'object' ? (copy as Record<string, unknown>) : {};
	const added = addedSections(rec);
	const ids = Array.isArray(rec.layout)
		? rec.layout.map((e) => (e && typeof e === 'object' ? str((e as Record<string, unknown>).id) : ''))
		: [...defaultLayout];
	const seen = new Set<string>();
	const out: LayoutEntry<B>[] = [];
	for (const id of ids) {
		if (!id || seen.has(id)) continue;
		if ((blocks as readonly string[]).includes(id)) {
			seen.add(id);
			out.push({ kind: 'block', id: id as B });
		} else if (added.has(id)) {
			seen.add(id);
			out.push({ kind: 'section', id, section: added.get(id)! });
		}
	}
	return out;
}

export function platformLayout(copy: unknown): PlatformEntry[] {
	return pageLayout(copy, PLATFORM_BLOCKS, PLATFORM_DEFAULT_LAYOUT);
}

/** Whether the logo strip stays in the hero: only while it is the first block, as it always was. */
export function logosInHero(entries: readonly PlatformEntry[]): boolean {
	return entries[0]?.kind === 'block' && entries[0].id === 'trusted';
}
