/**
 * The ad tracking settings Sorted owns (Settings → APIs → Platform site → Ads & conversion
 * tracking): the LinkedIn partner ID and a conversion ID per event. Read from Sorted's
 * /api/platform-tracking-config so a new ad account or conversion needs no deploy.
 *
 * Cached for five minutes; Sorted's refresh ping clears it, so a change there lands at once.
 * Fails soft to "no tracking" — an unreachable Sorted must never hold a page up or invent an ID —
 * and a failure is remembered for a minute, so a Sorted outage costs one slow request a minute
 * rather than one on every page.
 */
import { env } from '$env/dynamic/private';
import { normalisePlatformTracking, EMPTY_PLATFORM_TRACKING, type PlatformTracking } from '$lib/site/platform-tracking';

const OK_TTL_MS = 5 * 60_000;
const FAILED_TTL_MS = 60_000;

let cached: { value: PlatformTracking; expiresAtMs: number } | null = null;
let inFlight: Promise<PlatformTracking> | null = null;

export function clearTrackingConfigCache(): void {
	cached = null;
}

async function fetchTrackingConfig(): Promise<PlatformTracking> {
	const base = (env.SORTED_API_URL || env.CONTENT_API_URL)?.trim().replace(/\/$/, '');
	const secret = env.CONTENT_API_TOKEN?.trim();
	if (!base || !secret) {
		cached = { value: EMPTY_PLATFORM_TRACKING, expiresAtMs: Date.now() + OK_TTL_MS };
		return EMPTY_PLATFORM_TRACKING;
	}
	try {
		const res = await fetch(`${base}/api/platform-tracking-config`, {
			headers: { Authorization: `Bearer ${secret}` },
			signal: AbortSignal.timeout(3000)
		});
		// An older Sorted without this endpoint answers 404 — the same as "no tracking".
		if (res.status === 404) {
			cached = { value: EMPTY_PLATFORM_TRACKING, expiresAtMs: Date.now() + OK_TTL_MS };
			return EMPTY_PLATFORM_TRACKING;
		}
		if (!res.ok) throw new Error(`status ${res.status}`);
		const value = normalisePlatformTracking(await res.json());
		cached = { value, expiresAtMs: Date.now() + OK_TTL_MS };
		return value;
	} catch (err) {
		console.error('[tracking] could not read ad tracking settings from Sorted, loading no tag', err);
		const value = cached?.value ?? EMPTY_PLATFORM_TRACKING;
		cached = { value, expiresAtMs: Date.now() + FAILED_TTL_MS };
		return value;
	}
}

export async function getTrackingConfig(): Promise<PlatformTracking> {
	if (cached && Date.now() < cached.expiresAtMs) return cached.value;
	inFlight ??= fetchTrackingConfig().finally(() => {
		inFlight = null;
	});
	return inFlight;
}

/** What /api/content/status reports, so Sorted's Check can show what the site has picked up. */
export function trackingStatusSummary(t: PlatformTracking): { linkedinPartnerId: string; events: string[] } {
	if (!t.enabled || !t.linkedin.partnerId) return { linkedinPartnerId: '', events: [] };
	return { linkedinPartnerId: t.linkedin.partnerId, events: Object.keys(t.linkedin.conversions) };
}
