// What a page view sends to Sorted: an address, a referring host, whether it started a visit.
// npx tsx scripts/test-page-view.ts
import { isLikelyRobot, pageViewBody, pageViewPath, referrerHost } from '../src/lib/site/page-view.ts';

let failures = 0;
function check(name: string, cond: boolean) {
	console.log(`  ${cond ? '✓' : '✗'} ${name}`);
	if (!cond) failures++;
}

check('root kept', pageViewPath('/') === '/');
check('query and fragment dropped', pageViewPath('/blog?q=dpo#top') === '/blog');
check('trailing slash dropped', pageViewPath('/pricing/') === '/pricing');
check('api not a page', pageViewPath('/api/page-view') === null);
check('framework not a page', pageViewPath('/_app/x.js') === null);

check('no referrer', referrerHost('', 'platform.example') === '');
check('only the host leaves the browser', referrerHost('https://www.linkedin.com/in/someone?email=a@b.com', 'platform.example') === 'www.linkedin.com');
check('own site is no referrer', referrerHost('https://platform.example/pricing', 'platform.example') === '');
check('own site with www is no referrer', referrerHost('https://www.platform.example/', 'platform.example') === '');
check('unreadable referrer', referrerHost('not a url', 'platform.example') === '');

check('a normal browser is not a robot', !isLikelyRobot('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'));
check('Googlebot is', isLikelyRobot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'));
check('a headless browser is', isLikelyRobot('Mozilla/5.0 HeadlessChrome/120.0'));
check('Lighthouse is', isLikelyRobot('Mozilla/5.0 Chrome-Lighthouse'));
check('an empty user agent is not', !isLikelyRobot(''));
check('a phone named CUBOT is not', !isLikelyRobot('Mozilla/5.0 (Linux; Android 10; CUBOT_X19) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'));

check('an error page is not counted', pageViewBody({ pathname: '/nope', status: 404, entry: true, referrer: '' }) === null);
const body = pageViewBody({ pathname: '/faq?x=1', status: 200, entry: true, referrer: 'google.com' });
check('a page is counted with exactly three fields', JSON.stringify(body) === JSON.stringify({ path: '/faq', referrer: 'google.com', entry: true }));

console.log(failures ? `\n${failures} failed` : '\nAll passed');
process.exit(failures ? 1 : 0);
