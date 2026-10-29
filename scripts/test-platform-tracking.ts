// Ad tracking: the settings shared with Sorted, and when the LinkedIn tag may load or report.
// npx tsx scripts/test-platform-tracking.ts
//
// src/lib/site/platform-tracking.ts is a byte-for-byte copy of Sorted's src/lib/platform-tracking.ts.
// Both repos assert MODULE_SHA256; copy the file across and update both tests — never edit one side.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { normalisePlatformTracking, trackingForSite, linkedInConversionId } from '../src/lib/site/platform-tracking.ts';
import { hasMarketingConsent, shouldLoadTag, isDemoLinkClick } from '../src/lib/site/linkedin-tag.ts';

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
	console.log(`  ${cond ? '✓' : '✗'} ${name}${cond || !detail ? '' : `\n      ${detail}`}`);
	if (!cond) failures++;
}

const MODULE_SHA256 = '5a4b590155a3ffecc578506f908c53a3cffa5d7b8c7728279c34ca561c4b049f';
const sha = createHash('sha256').update(readFileSync(new URL('../src/lib/site/platform-tracking.ts', import.meta.url), 'utf8')).digest('hex');
check('platform-tracking.ts is the same file Sorted has', sha === MODULE_SHA256, `now ${sha}`);

const on = normalisePlatformTracking({ enabled: true, linkedin: { partnerId: '123', conversions: { demo_booked: '456' } } });
const off = normalisePlatformTracking({ enabled: false, linkedin: { partnerId: '123', conversions: { demo_booked: '456' } } });

check('consent: accepted Marketing', hasMarketingConsent({ Cookiebot: { consent: { marketing: true } } }));
check('consent: declined', !hasMarketingConsent({ Cookiebot: { consent: { marketing: false } } }));
check('consent: Cookiebot not loaded is no', !hasMarketingConsent({}));

check('loads with config and consent', shouldLoadTag(on, true));
check('never without consent', !shouldLoadTag(on, false));
check('never with no config (the dev site)', !shouldLoadTag(null, true));
check('never when Sorted has it off', !shouldLoadTag(off, true));
check('never with no partner ID', !shouldLoadTag(normalisePlatformTracking({ enabled: true }), true));
check('a config switched off is served as nothing', JSON.stringify(trackingForSite(off).linkedin.conversions) === '{}');

check('a mapped event has its ID', linkedInConversionId(on, 'demo_booked') === '456');
check('an unmapped event is not reported', linkedInConversionId(on, 'demo_qualified') === '');

const here = { origin: 'https://platform.example', pathname: '/pricing' };
check('a link to /demo counts', isDemoLinkClick({ origin: here.origin, pathname: '/demo' }, here));
check('with a trailing slash', isDemoLinkClick({ origin: here.origin, pathname: '/demo/' }, here));
check('another page does not', !isDemoLinkClick({ origin: here.origin, pathname: '/faq' }, here));
check('/demo-booked does not', !isDemoLinkClick({ origin: here.origin, pathname: '/demo-booked' }, here));
check('another site does not', !isDemoLinkClick({ origin: 'https://other.example', pathname: '/demo' }, here));
check('a link on the demo page itself does not', !isDemoLinkClick({ origin: here.origin, pathname: '/demo' }, { ...here, pathname: '/demo' }));

console.log(failures ? `\n${failures} failed` : '\nAll passed');
if (failures) process.exit(1);
