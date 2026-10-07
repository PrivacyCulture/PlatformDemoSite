// Where the Features menu sits: an entry marked `menu: 'features'` in the main navigation list.
// npx tsx scripts/test-features-position.ts
import { splitAtFeatures, featuresMenuFrom, isFeaturesEntry } from '../src/lib/site/features-position.ts';

let failures = 0;
function check(name: string, cond: boolean) {
	console.log(`  ${cond ? '✓' : '✗'} ${name}`);
	if (!cond) failures++;
}

const platform = { label: 'The Platform', href: '/platform' };
const pricing = { label: 'Pricing', href: '/platform#pricing' };
const entry = { label: 'Features', href: '/platform', menu: 'features' as const };
const menu = { label: 'Features', allLabel: 'See the whole platform', allHref: '/platform', items: [] };
const names = (xs: { label: string }[]) => xs.map((x) => x.label).join(',');

check('the marked entry is recognised; a plain link is not', isFeaturesEntry(entry) && !isFeaturesEntry(platform) && !isFeaturesEntry(null));
const mid = splitAtFeatures([platform, entry, pricing]);
check('placed second → The Platform, Features, Pricing', names(mid.before) === 'The Platform' && names(mid.after) === 'Pricing' && mid.entry === entry);
const last = splitAtFeatures([platform, pricing, entry]);
check('placed last → the menu after every link', names(last.before) === 'The Platform,Pricing' && last.after.length === 0);
const none = splitAtFeatures([platform, pricing]);
check('no entry → the menu first, where it sat before the entry existed', none.before.length === 0 && names(none.after) === 'The Platform,Pricing' && none.entry === null);
check('the entry is never drawn as a plain link', ![...mid.before, ...mid.after].some(isFeaturesEntry));
const two = splitAtFeatures([entry, platform, { ...entry, label: 'Again' }]);
check('a second marked entry is dropped, not drawn as a link', two.entry === entry && names(two.after) === 'The Platform');
check('the entry’s label names the menu', featuresMenuFrom(menu, { ...entry, label: 'Product' }).label === 'Product');
check('the entry’s link is the see-all link', featuresMenuFrom(menu, { ...entry, href: '/tour' }).allHref === '/tour');
check('blank entry fields fall back to the menu’s own', featuresMenuFrom(menu, { ...entry, label: ' ', href: '' }).label === 'Features' && featuresMenuFrom(menu, { ...entry, href: '' }).allHref === '/platform');
check('no entry → the menu exactly as stored', featuresMenuFrom(menu, null) === menu);

console.log(failures ? `\n${failures} failed` : '\nAll passed');
process.exit(failures ? 1 : 0);
