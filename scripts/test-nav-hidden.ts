// Offline: which pages hide the header's menu links (set per page in Sorted's page builder).
// Run: npx tsx scripts/test-nav-hidden.ts
import { blockPagePath, navHiddenPathsOf, isNavHiddenIn } from '../src/lib/site/nav-hidden';
import { readBlockPage } from '../src/lib/site/block-pages';

let passes = 0;
let failures = 0;
const check = (c: unknown, m: string) => (c ? passes++ : (failures++, console.error('✗', m)));

check(blockPagePath('custom-insurers') === '/insurers', 'a page added here is at its slug');
check(blockPagePath('problem-dsar-overload') === '/dsar-overload', 'a problem page is at its slug');
check(blockPagePath('pricing') === '/pricing' && blockPagePath('cookie-notice') === '/cookie-notice', 'a built-in page is at its key');
check(blockPagePath('not-found') === null && blockPagePath('../x') === null, 'no address for the error page or a bad key');

check(JSON.stringify(navHiddenPathsOf({ 'custom-a': { hideNavigation: true }, pricing: { hideNavigation: false }, 'problem-b': {}, faq: { hideNavigation: true } })) === JSON.stringify(['/a', '/faq']), 'only the pages set to hide are listed');
check(isNavHiddenIn(['/a'], '/a') && isNavHiddenIn(['/a'], '/A/') && isNavHiddenIn(['/a'], '/a?x=1#y'), 'matched as a path, however written');
check(!isNavHiddenIn(['/a'], '/ab') && !isNavHiddenIn(['/a'], '/') && !isNavHiddenIn(undefined, '/a'), 'nothing else is hidden');

const v2 = (extra: Record<string, unknown>) => ({ v: 2, title: 'T', slug: 's', seo: {}, blocks: [], ...extra });
check(readBlockPage(v2({ hideNavigation: true }))?.hideNavigation === true, 'the setting is read from the block page');
check(readBlockPage(v2({}))?.hideNavigation === undefined && readBlockPage(v2({ hideNavigation: 'yes' }))?.hideNavigation === undefined, 'only a real true hides');

console.log(`test-nav-hidden: ${passes} passed, ${failures} failed`);
if (failures) process.exit(1);
