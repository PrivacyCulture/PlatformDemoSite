import { safeHref } from './added-sections';

/**
 * One entry in the "Trusted by" strip. The content file started as a list of names; an entry
 * may now also be `{ name, src, href }`, so a logo and a link can be added one organisation at
 * a time. Both forms are read, and either extra may be blank.
 */
export interface TrustedEntry {
	name: string;
	/** A logo image. Blank = the name is set in type, as it always was. */
	src: string;
	/** Where the entry links to. Blank = not a link. */
	href: string;
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');

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
			if (v.trim()) out.push({ name: v.trim(), src: '', href: '' });
			continue;
		}
		if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
		const rec = v as Record<string, unknown>;
		const entry = { name: str(rec.name).trim(), src: safeSrc(str(rec.src)), href: safeHref(str(rec.href)) };
		if (entry.name || entry.src) out.push(entry);
	}
	return out;
}

/** Whether a link leaves this site, so it opens in a new tab. */
export function isExternal(href: string): boolean {
	return /^https?:\/\//i.test(href);
}
