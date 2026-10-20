import { demoFromSearch, demoPageId, utmsFromSearch, withDemoLinkFrom } from '../src/lib/demo/utm';
import {
	buildDemoNotification,
	bookingPageUrl,
	describeCampaign,
	describeFromPage,
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
ok('the demo link gets the page as from=', withDemoLinkFrom('/demo', 'home'), '/demo?from=home');
ok('a hash survives', withDemoLinkFrom('/demo#book', 'pricing'), '/demo?from=pricing#book');
ok('a link that is not the demo page is untouched', withDemoLinkFrom('/pricing', 'home'), '/pricing');
ok('a demo link already tagged keeps its own value', withDemoLinkFrom('/demo?from=webinar', 'home'), '/demo?from=webinar');
ok('a campaign link keeps its UTMs and gains the page', withDemoLinkFrom('/demo?utm_source=linkedin', 'home'), '/demo?utm_source=linkedin&from=home');
ok('an external link is untouched', withDemoLinkFrom('https://hubspot.com/demo', 'home'), 'https://hubspot.com/demo');
ok(
	'an absolute same-site link, with the site as base',
	withDemoLinkFrom('https://www.example.com/demo', 'faq', 'https://www.example.com'),
	'/demo?from=faq'
);

// ── what the demo page's address says at booking time ────────────────────────
ok('the page is read from from=', demoFromSearch('?from=home&x=1'), 'home');
ok('no from=, no page', demoFromSearch('?utm_source=home'), '');
ok(
	'the page UTMs are read from the query string',
	utmsFromSearch('?utm_source=linkedin&from=home'),
	{ utm_source: 'linkedin' }
);
ok('no query, no UTMs', utmsFromSearch(''), {});

// ── who is told ───────────────────────────────────────────────────────────────
ok('unset means nobody', parseRecipientList(undefined), []);
ok('empty means nobody', parseRecipientList('  '), []);
ok('commas', parseRecipientList('a@x.com,b@y.org'), ['a@x.com', 'b@y.org']);
ok('any separator, trimmed, deduped, non-addresses dropped', parseRecipientList(' a@x.com; B@y.org\n<a@X.com> nonsense c@z'), ['a@x.com', 'B@y.org']);

// ── the email ─────────────────────────────────────────────────────────────────
ok('the home button reads as the home page', describeFromPage('home'), 'Home page');
ok('another button shows its page', describeFromPage('pricing'), 'pricing');
ok('no from= says the page was opened directly', describeFromPage(undefined), 'None, the booking page was opened directly');
ok('a campaign is listed', describeCampaign({ utm_source: 'linkedin', utm_campaign: 'q4' }), 'linkedin / q4');
ok('no campaign is nothing', describeCampaign({}), '');
ok('booking page is a full address', bookingPageUrl('https://platform.example.com', '/demo'), 'https://platform.example.com/demo');

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
	from: 'pricing',
	pageUtms: {},
	routing: { slaTier: 'P2', isStranger: false },
	site: { name: 'Privacy Culture Platform website', origin: 'https://platform.example.com' },
	bookingPath: '/demo'
});
ok('subject names who, where and when in team time', mail.subject, 'Demo booked on platform.example.com: Ada Lovelace at Analytical <Engines>, Wednesday, 14 October 2026 at 10:00 BST');
ok('html escapes what the visitor typed', mail.html.includes('Analytical &lt;Engines&gt;') && !mail.html.includes('<Engines>'), true);
ok('both time zones', mail.text.includes('(America/New_York)') && mail.text.includes('Team time: Wednesday, 14 October 2026 at 10:00 BST'), true);
ok('says which page', mail.text.includes('Came from page: pricing'), true);
ok('says which website', mail.text.includes('Website: Privacy Culture Platform website (platform.example.com)'), true);
ok('says which booking page', mail.text.includes('Booking page: https://platform.example.com/demo'), true);
ok('keeps the first touch', mail.text.includes('First touch: utm_source=linkedin, utm_campaign=q4'), true);
ok('phone and ISO left out when blank', !mail.text.includes('Phone:') && !mail.text.includes('ISO / SOC'), true);

if (failures.length) {
	console.error(`${failures.length} failed, ${passed} passed\n\n  ${failures.join('\n\n  ')}`);
	process.exit(1);
}
console.log(`${passed} passed`);
