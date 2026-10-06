const STORAGE_KEY = 'pc_demo_utm';

export type DemoUtm = {
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	utm_term?: string;
	utm_content?: string;
};

const UTM_KEYS = [
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_term',
	'utm_content'
] as const;

/** Capture UTM params from the current URL into sessionStorage (first-touch wins). */
export function captureUtmsFromLocation(search = typeof location !== 'undefined' ? location.search : ''): DemoUtm {
	if (typeof sessionStorage === 'undefined') return {};

	const existing = readStoredUtms();
	if (Object.keys(existing).length > 0) return existing;

	const next = utmsFromSearch(search);

	if (Object.keys(next).length > 0) {
		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			/* ignore quota / private mode */
		}
	}
	return next;
}

/** The UTM params in a query string, as the demo page's own address carries them. */
export function utmsFromSearch(search: string): DemoUtm {
	const params = new URLSearchParams(search);
	const next: DemoUtm = {};
	for (const key of UTM_KEYS) {
		const value = params.get(key)?.trim();
		if (value) next[key] = value;
	}
	return next;
}

export function readStoredUtms(): DemoUtm {
	if (typeof sessionStorage === 'undefined') return {};
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as DemoUtm;
		return typeof parsed === 'object' && parsed ? parsed : {};
	} catch {
		return {};
	}
}

export function utmsFromUnknown(input: unknown): DemoUtm {
	if (!input || typeof input !== 'object') return {};
	const out: DemoUtm = {};
	const record = input as Record<string, unknown>;
	for (const key of UTM_KEYS) {
		const value = record[key];
		if (typeof value === 'string' && value.trim()) out[key] = value.trim();
	}
	return out;
}

// ── The Book a demo buttons ──────────────────────────────────────────────────
//
// Every button that leads to /demo is tagged at click time with the page it was clicked on,
// so a booking can say which page sent it. The page name is the whole UTM: utm_source=home,
// utm_source=platform, utm_source=pricing. A visitor who ARRIVED on a campaign keeps that
// campaign in HubSpot — first touch wins above — but the page still reaches the team in the
// booking notification, which reads the demo page's own address at the moment of booking.

/** A short name for a page from its path: "/" is home, "/pricing" is pricing. */
export function demoPageId(pathname: string): string {
	const trimmed = pathname.trim().replace(/^\/+|\/+$/g, '');
	if (!trimmed) return 'home';
	return trimmed
		.toLowerCase()
		.split('/')
		.map((part) => decodeURIComponent(part).replace(/[^a-z0-9._-]+/g, '-'))
		.filter(Boolean)
		.join('-');
}

/** True for a same-site link to the demo page itself, with or without a hash. */
export function isDemoPath(pathname: string): boolean {
	return pathname.replace(/\/+$/, '') === '/demo';
}

/**
 * The demo link with the page it sits on added as UTMs. A link that already carries any UTM
 * is left alone, so a hand-tagged campaign link in the CMS keeps its own values.
 */
export function withDemoLinkUtms(href: string, pageId: string, origin = 'https://example.invalid'): string {
	let url: URL;
	try {
		url = new URL(href, origin);
	} catch {
		return href;
	}
	// Only this site's own demo page; a link to another site is left as it is.
	if (url.origin !== new URL(origin).origin || !isDemoPath(url.pathname)) return href;
	for (const key of UTM_KEYS) if (url.searchParams.has(key)) return href;

	url.searchParams.set('utm_source', pageId);
	// Always relative out: the origin above is only there so the URL parses.
	return `${url.pathname}${url.search}${url.hash}`;
}
