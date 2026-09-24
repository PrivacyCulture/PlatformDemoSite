/**
 * The order /platform draws its blocks in, and the text sections written in the CMS.
 *
 * Both keys are optional and read defensively: `pages.platform.layout` (`[{ id }]`) and
 * `pages.platform.sections` (`[{ id, title, body }]`). No layout = the order the page always had.
 * An id that names neither a block nor a text section is skipped, as is a repeat — a repeated id
 * is a duplicate {#each} key, which throws during hydration and takes the client router down.
 *
 * Keep in step with the CMS: PLATFORM_LAYOUT_BLOCKS and PLATFORM_LAYOUT_DEFAULT in Sorted's
 * platform-structure.ts. A block the site does not know is skipped here, silently.
 */
export const PLATFORM_BLOCKS = ['fit', 'problems', 'pricing', 'cta', 'explainer', 'trusted'] as const;
export type PlatformBlockId = (typeof PLATFORM_BLOCKS)[number];
// `trusted` leads: first, it is drawn INSIDE the hero exactly as it always was (see
// logosInHero); moved anywhere else, it becomes a band of its own there.
export const PLATFORM_DEFAULT_LAYOUT: readonly PlatformBlockId[] = ['trusted', 'fit', 'problems', 'pricing', 'cta'];

export type PlatformEntry =
	| { kind: 'block'; id: PlatformBlockId }
	| { kind: 'text'; id: string; title: string; body: string };

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export function platformLayout(copy: unknown): PlatformEntry[] {
	const rec = copy && typeof copy === 'object' ? (copy as Record<string, unknown>) : {};
	const texts = new Map<string, { title: string; body: string }>();
	if (Array.isArray(rec.sections)) {
		for (const s of rec.sections) {
			if (!s || typeof s !== 'object') continue;
			const id = str((s as Record<string, unknown>).id);
			if (id) texts.set(id, { title: str((s as Record<string, unknown>).title), body: str((s as Record<string, unknown>).body) });
		}
	}
	const ids = Array.isArray(rec.layout)
		? rec.layout.map((e) => (e && typeof e === 'object' ? str((e as Record<string, unknown>).id) : ''))
		: [...PLATFORM_DEFAULT_LAYOUT];
	const seen = new Set<string>();
	const out: PlatformEntry[] = [];
	for (const id of ids) {
		if (!id || seen.has(id)) continue;
		if ((PLATFORM_BLOCKS as readonly string[]).includes(id)) {
			seen.add(id);
			out.push({ kind: 'block', id: id as PlatformBlockId });
		} else if (texts.has(id)) {
			seen.add(id);
			out.push({ kind: 'text', id, ...texts.get(id)! });
		}
	}
	return out;
}

/** Whether the logo strip stays in the hero: only while it is the first block, as it always was. */
export function logosInHero(entries: readonly PlatformEntry[]): boolean {
	return entries[0]?.kind === 'block' && entries[0].id === 'trusted';
}
