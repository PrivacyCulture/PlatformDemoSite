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

	const params = new URLSearchParams(search);
	const next: DemoUtm = {};
	for (const key of UTM_KEYS) {
		const value = params.get(key)?.trim();
		if (value) next[key] = value;
	}

	if (Object.keys(next).length > 0) {
		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			/* ignore quota / private mode */
		}
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
