import { demoPageId, utmsFromSearch, withDemoLinkUtms } from '../src/lib/demo/utm';
import {
	buildDemoNotification,
	describeOrigin,
	parseRecipientList
} from '../src/lib/demo/notification';

let passed = 0;
const failures: string[] = [];
function ok(label: string, actual: unknown, expected: unknown) {
	if (JSON.stringify(actual) === JSON.stringify(expected)) passed++;
	else failures.push(`${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`);
}

// ── which page the button sits on ────────────────────────────────────────────
ok('home is "/"', demoPageId('/'), 'home');
ok('a trailing slash is still home', demoPageId(''), 'home');
ok('pricing', demoPageId('/pricing'), 'pricing');
ok('a problem page', demoPageId('/dsar-overload/'), 'dsar-overload');
ok('a nested path joins with dashes', demoPageId('/platform/Visual%20ROPA'), 'platform-visual-ropa');

// ── the link ──────────────────────────────────────────────────────────────────
ok('the demo link gets the page as its source', withDemoLinkUtms('/demo', 'home'), '/demo?utm_source=home');
ok('a hash survives', withDemoLinkUtms('/demo#book', 'pricing'), '/demo?utm_source=pricing#book');
ok('a link that is not the demo page is untouched', withDemoLinkUtms('/pricing', 'home'), '/pricing');
ok('a demo link already tagged keeps its own values', withDemoLinkUtms('/demo?utm_source=linkedin', 'home'), '/demo?utm_source=linkedin');
ok('an external link is untouched', withDemoLinkUtms('https://hubspot.com/demo', 'home'), 'https://hubspot.com/demo');
ok(
	'an absolute same-site link, with the site as base',
	withDemoLinkUtms('https://www.example.com/demo', 'faq', 'https://www.example.com'),
	'/demo?utm_source=faq'
);

// ── what the demo page's address says at booking time ────────────────────────
ok(
	'the page UTMs are read from the query string',
	utmsFromSearch('?utm_source=home&x=1'),
	{ utm_source: 'home' }
);
ok('no query, no UTMs', utmsFromSearch(''), {});

// ── who is told ───────────────────────────────────────────────────────────────
ok('unset means nobody', parseRecipientList(undefined), []);
ok('empty means nobody', parseRecipientList('  '), []);
ok('commas', parseRecipientList('a@x.com,b@y.org'), ['a@x.com', 'b@y.org']);
ok('any separator, trimmed, deduped, non-addresses dropped', parseRecipientList(' a@x.com; B@y.org\n<a@X.com> nonsense c@z'), ['a@x.com', 'B@y.org']);

// ── the email ─────────────────────────────────────────────────────────────────
ok('the button shows its page', describeOrigin({ utm_source: 'home' }), 'home');
ok('a campaign is listed', describeOrigin({ utm_source: 'linkedin', utm_campaign: 'q4' }), 'linkedin / q4');
ok('nothing is nothing', describeOrigin({}), '');

const mail = buildDemoNotification({
	form: {
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		company: 'Analytical <Engines>',
		role: 'DPO',
		employeeBand: '1,000–2,500',
		tooling: 'spreadsheets',
		timing: 'next 3 months',
		isoGate: '',
		improve: 'ROPA upkeep',
		phone: ''
	},
	start: '2026-10-14T09:00:00.000Z',
	end: '2026-10-14T09:25:00.000Z',
	timezone: 'America/New_York',
	isOffline: false,
	subject: 'Discovery demo',
	location: null,
	contactId: '123',
	utms: { utm_source: 'linkedin', utm_campaign: 'q4' },
	pageUtms: { utm_source: 'pricing' },
	routing: { slaTier: 'P2', isStranger: false }
});
ok('subject names who, where and when in team time', mail.subject, 'Demo booked: Ada Lovelace at Analytical <Engines>, Wednesday, 14 October 2026 at 10:00 BST');
ok('html escapes what the visitor typed', mail.html.includes('Analytical &lt;Engines&gt;') && !mail.html.includes('<Engines>'), true);
ok('both time zones', mail.text.includes('(America/New_York)') && mail.text.includes('Team time: Wednesday, 14 October 2026 at 10:00 BST'), true);
ok('says which page', mail.text.includes('Booked from: pricing'), true);
ok('keeps the first touch', mail.text.includes('First touch: utm_source=linkedin, utm_campaign=q4'), true);
ok('phone and ISO left out when blank', !mail.text.includes('Phone:') && !mail.text.includes('ISO / SOC'), true);

if (failures.length) {
	console.error(`${failures.length} failed, ${passed} passed\n\n  ${failures.join('\n\n  ')}`);
	process.exit(1);
}
console.log(`${passed} passed`);
