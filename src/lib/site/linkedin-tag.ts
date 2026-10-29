/**
 * The LinkedIn Insight Tag and its conversions, driven by the settings in Sorted
 * (see platform-tracking.ts and server/tracking-config.ts).
 *
 * Loaded from code rather than as a type="text/plain" tag in app.html, for two reasons: the
 * partner ID is runtime data from Sorted, and the dev (draft) site must get no tag at all — the
 * root layout only hands a config over on the live site. Consent is still Cookiebot's: the script
 * is only added once the visitor has accepted MARKETING cookies, and a conversion is only reported
 * while that is still true. With Cookiebot blocked or not yet answered, nothing loads.
 *
 * Page views after the first load are the tag's own: it follows the browser's history itself, so
 * nothing here re-fires on navigation (doing both would count every page twice).
 */
import { isDemoPath } from '../demo/utm';
import { linkedInConversionId, type PlatformTracking, type TrackingEventKey } from './platform-tracking';

const INSIGHT_SRC = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';

type LinkedInWindow = Window & {
	_linkedin_partner_id?: string;
	_linkedin_data_partner_ids?: string[];
	lintrk?: ((action: string, data?: Record<string, unknown>) => void) & { q?: unknown[] };
	Cookiebot?: { consent?: { marketing?: boolean } };
};

let config: PlatformTracking | null = null;
let loaded = false;

/** Whether the visitor has accepted Marketing cookies right now. Unknown is no. */
export function hasMarketingConsent(w: { Cookiebot?: { consent?: { marketing?: boolean } } }): boolean {
	return w.Cookiebot?.consent?.marketing === true;
}

/** Whether this page may load the tag: a partner ID from Sorted AND consent. */
export function shouldLoadTag(t: PlatformTracking | null, consent: boolean): boolean {
	return !!t && t.enabled && !!t.linkedin.partnerId && consent;
}

/** A click that counts as "clicked through to the demo page": to /demo, from anywhere but /demo. */
export function isDemoLinkClick(href: { origin: string; pathname: string }, here: { origin: string; pathname: string }): boolean {
	return href.origin === here.origin && isDemoPath(href.pathname) && !isDemoPath(here.pathname);
}

function loadTag(w: LinkedInWindow, partnerId: string) {
	if (loaded) return;
	loaded = true;
	w._linkedin_partner_id = partnerId;
	w._linkedin_data_partner_ids = w._linkedin_data_partner_ids || [];
	if (!w._linkedin_data_partner_ids.includes(partnerId)) w._linkedin_data_partner_ids.push(partnerId);
	if (!w.lintrk) {
		// LinkedIn's own queueing stub: calls made before the script arrives are replayed by it.
		const stub = ((action: string, data?: Record<string, unknown>) => {
			stub.q!.push([action, data]);
		}) as NonNullable<LinkedInWindow['lintrk']>;
		stub.q = [];
		w.lintrk = stub;
	}
	const script = document.createElement('script');
	script.async = true;
	script.src = INSIGHT_SRC;
	document.head.appendChild(script);
}

/**
 * Reports a conversion, if this event has a conversion ID in Sorted and the visitor has accepted
 * Marketing cookies. Otherwise does nothing — it never throws and never queues for later.
 */
export function trackConversion(event: TrackingEventKey): void {
	if (typeof window === 'undefined' || !config) return;
	const w = window as LinkedInWindow;
	if (!hasMarketingConsent(w)) return;
	const conversionId = linkedInConversionId(config, event);
	if (!conversionId) return;
	if (!loaded) loadTag(w, config.linkedin.partnerId);
	try {
		w.lintrk?.('track', { conversion_id: Number(conversionId) });
	} catch (err) {
		console.warn('[tracking] LinkedIn conversion not sent', err);
	}
}

/**
 * Starts tracking for this page load. Pass null on the dev site or when Sorted has it off.
 * Returns the function that removes the listeners.
 */
export function startLinkedInTag(tracking: PlatformTracking | null): () => void {
	config = tracking && tracking.enabled && tracking.linkedin.partnerId ? tracking : null;
	if (!config) return () => {};
	const w = window as LinkedInWindow;
	const partnerId = config.linkedin.partnerId;

	const tryLoad = () => {
		if (shouldLoadTag(config, hasMarketingConsent(w))) loadTag(w, partnerId);
	};
	tryLoad();
	// Cookiebot answers asynchronously, and the visitor may accept later from the banner.
	window.addEventListener('CookiebotOnConsentReady', tryLoad);
	window.addEventListener('CookiebotOnAccept', tryLoad);

	const onClick = (event: MouseEvent) => {
		if (!(event.target instanceof Element)) return;
		const anchor = event.target.closest('a[href]');
		if (!(anchor instanceof HTMLAnchorElement)) return;
		if (isDemoLinkClick(anchor, location)) trackConversion('demo_link_click');
	};
	document.addEventListener('click', onClick, true);

	return () => {
		window.removeEventListener('CookiebotOnConsentReady', tryLoad);
		window.removeEventListener('CookiebotOnAccept', tryLoad);
		document.removeEventListener('click', onClick, true);
	};
}
