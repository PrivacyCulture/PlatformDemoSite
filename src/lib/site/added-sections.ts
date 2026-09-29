/**
 * Sections added to a page in the CMS, each made from a template. Drawn by AddedSection.svelte;
 * placed by a page's layout list (page-layout.ts) or, on a page created in the CMS, in order.
 *
 * Keep in step with SECTION_TEMPLATES in Sorted's platform-structure.ts: the ids, and the shape
 * each template's element takes. A template this file does not know is dropped by `addedSection`
 * — silently, so the CMS must never offer one before the site draws it.
 *
 * Coerced item by item, never validated as a whole: the CMS can send a section mid-edit (an
 * image with no file yet, a card with no words), and one thin section must cost only that
 * section, never the page.
 */

export const SECTION_TEMPLATE_IDS = ['text', 'copyImage', 'cards', 'quote', 'cta', 'image'] as const;
export type SectionTemplateId = (typeof SECTION_TEMPLATE_IDS)[number];

/** An image as an added section holds it. `src` blank = no image is drawn. */
export type AddedImage = { src: string; webp: string; alt: string; width: number; height: number };

export type AddedSection =
	| { template: 'text'; id: string; title: string; body: string }
	| { template: 'copyImage'; id: string; eyebrow: string; title: string; body: string; image: AddedImage; imageSide: 'left' | 'right' }
	| { template: 'cards'; id: string; eyebrow: string; title: string; body: string; items: { title: string; body: string }[] }
	| { template: 'quote'; id: string; title: string; quote: string; attribution: string }
	| { template: 'cta'; id: string; eyebrow: string; title: string; body: string; label: string; href: string }
	| { template: 'image'; id: string; title: string; image: AddedImage; caption: string };

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : 0);
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function image(v: unknown): AddedImage {
	const r = isObject(v) ? v : {};
	return { src: str(r.src).trim(), webp: str(r.webp).trim(), alt: str(r.alt), width: num(r.width), height: num(r.height) };
}

/** Only an address a page may safely link to — never javascript: or a protocol-relative //. */
export function safeHref(v: string): string {
	const s = v.trim();
	return /^(\/(?!\/)|https?:\/\/|mailto:|tel:|#)/i.test(s) ? s : '';
}

/**
 * One section, or null when it is not one. A section written before templates existed has no
 * `template` and is text — the shape it always had.
 */
export function addedSection(v: unknown): AddedSection | null {
	if (!isObject(v)) return null;
	const id = str(v.id).trim();
	if (!id) return null;
	const template = str(v.template) || 'text';
	const title = str(v.title);
	switch (template) {
		case 'text':
			return { template, id, title, body: str(v.body) };
		case 'copyImage':
			return {
				template,
				id,
				eyebrow: str(v.eyebrow),
				title,
				body: str(v.body),
				image: image(v.image),
				imageSide: v.imageSide === 'left' ? 'left' : 'right'
			};
		case 'cards': {
			const items = Array.isArray(v.items) ? v.items.filter(isObject).map((it) => ({ title: str(it.title), body: str(it.body) })) : [];
			return { template, id, eyebrow: str(v.eyebrow), title, body: str(v.body), items };
		}
		case 'quote':
			return { template, id, title, quote: str(v.quote), attribution: str(v.attribution) };
		case 'cta':
			return { template, id, eyebrow: str(v.eyebrow), title, body: str(v.body), label: str(v.label), href: safeHref(str(v.href)) };
		case 'image':
			return { template, id, title, image: image(v.image), caption: str(v.caption) };
		default:
			return null;
	}
}

/**
 * Every added section under a page's `sections` key, by id. Ids are each-keys on the page, so a
 * repeat keeps the first — a duplicate key throws during hydration and takes the router down.
 */
export function addedSections(copy: unknown): Map<string, AddedSection> {
	const out = new Map<string, AddedSection>();
	const list = isObject(copy) ? copy.sections : undefined;
	if (!Array.isArray(list)) return out;
	for (const raw of list) {
		const s = addedSection(raw);
		if (s && !out.has(s.id)) out.set(s.id, s);
	}
	return out;
}
