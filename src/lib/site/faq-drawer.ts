/**
 * The FAQ drawer on the homepage (JourneyFaq.svelte): a round button bottom right and a sheet. Its words are edited in the
 * CMS (Globals → FAQ drawer) under `site.faqDrawer`; an ABSENT key is the default here, so
 * content served before the keys existed still draws the drawer. Keep in step with FAQ_DRAWER
 * in Sorted's platform-documents.ts.
 */
export const FAQ_DRAWER_DEFAULT = {
	show: 'on',
	openLabel: 'Open frequently asked questions',
	closeLabel: 'Close frequently asked questions',
	allLink: 'See every question'
} as const;

export type FaqDrawerLabels = Partial<Record<'openLabel' | 'closeLabel' | 'allLink', string>>;

export interface FaqDrawerCopy {
	show: boolean;
	openLabel: string;
	closeLabel: string;
	allLink: string;
}

/** Reads `site.faqDrawer` (any shape) into the drawer's settings. Blank = the default. */
export function faqDrawerCopy(raw: unknown): FaqDrawerCopy {
	const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
	const str = (k: keyof typeof FAQ_DRAWER_DEFAULT) => {
		const v = r[k];
		return typeof v === 'string' && v.trim() ? v.trim() : FAQ_DRAWER_DEFAULT[k];
	};
	return {
		show: str('show') !== 'off',
		openLabel: str('openLabel'),
		closeLabel: str('closeLabel'),
		allLink: str('allLink')
	};
}
