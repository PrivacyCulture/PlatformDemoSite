import { safeHref } from './added-sections';

/**
 * One entry in the "Trusted by" strip. The content file started as a list of names; an entry
 * may now also be `{ name, src, href, width, height }`, so a logo and a link can be added one
 * organisation at a time. Both forms are read, and any extra may be blank.
 */
export interface TrustedEntry {
	name: string;
	/** A logo image. Blank = the name is set in type, as it always was. */
	src: string;
	/** Where the entry links to. Blank = not a link. */
	href: string;
	/** The logo's size in pixels, which Sorted fills in when a logo is picked. 0 = not known. */
	width: number;
	height: number;
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');
/** Sorted writes the size as text (the extras are text fields), so a number in either form. */
const size = (v: unknown) => {
	const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
	return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

function safeSrc(v: string): string {
	const s = v.trim();
	return /^(\/(?!\/)|https?:\/\/)/i.test(s) ? s : '';
}

/** The entries to draw, in order. An entry with neither a name nor a logo is skipped. */
export function trustedEntries(list: unknown): TrustedEntry[] {
	if (!Array.isArray(list)) return [];
	const out: TrustedEntry[] = [];
	for (const v of list) {
		if (typeof v === 'string') {
			if (v.trim()) out.push({ name: v.trim(), src: '', href: '', width: 0, height: 0 });
			continue;
		}
		if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
		const rec = v as Record<string, unknown>;
		const src = safeSrc(str(rec.src));
		// A size means nothing without a logo, and half a size holds no space.
		const sized = !!src && size(rec.width) > 0 && size(rec.height) > 0;
		const entry = {
			name: str(rec.name).trim(),
			src,
			href: safeHref(str(rec.href)),
			width: sized ? size(rec.width) : 0,
			height: sized ? size(rec.height) : 0
		};
		if (entry.name || entry.src) out.push(entry);
	}
	return out;
}

/** Whether a link leaves this site, so it opens in a new tab. */
export function isExternal(href: string): boolean {
	return /^https?:\/\//i.test(href);
}
