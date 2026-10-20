// The pricing cards, read off whatever content the CMS serves: run with `npx tsx scripts/test-pricing.ts`.
import { readFileSync } from 'node:fs';
import { featureParts, planPrice, pricingModules, pricingNotes, pricingPlans } from '../src/lib/site/pricing';

let failures = 0;
const check = (name: string, ok: boolean) => {
	if (!ok) failures++;
	console.log(`${ok ? '✓' : '✗'} ${name}`);
};

const file = JSON.parse(readFileSync(new URL('../data/database.json', import.meta.url), 'utf8'));

// The shipped file
const plans = pricingPlans(file.site.pricing);
check('the file has five plans', plans.length === 5);
check('exactly one featured plan', plans.filter((p) => p.style === 'featured').length === 1);
check('the last plan is enterprise', plans[4].style === 'enterprise');
check('features carry through', plans[0].features.length === 2 && plans[0].features[0] === '10 user accounts');
check('notes read', pricingNotes(file.pages.pricing.notes).length === 3);
check('modules read', pricingModules(file.pages.pricing.modules)?.items.length === 6);

// Content served before Sorted has the plans: the old tiers, drawn in the new shape
const legacy = {
	tiers: [
		{ band: '1,001–2,500 employees', rate: '£800', period: '/month', cta: 'Book a demo', href: '/demo', featured: true },
		{ band: 'Above 5,000', rate: 'Talk to us', period: '', cta: 'Talk to us', href: '/demo', featured: false }
	]
};
const fromTiers = pricingPlans(legacy);
check('legacy tiers are drawn when there are no plans', fromTiers.length === 2);
check('legacy featured flag becomes the featured style', fromTiers[0].style === 'featured' && fromTiers[1].style === 'standard');
check('legacy tiers have no features, lead or billed line', fromTiers[0].features.length === 0 && fromTiers[0].lead === '' && fromTiers[0].billed === '');
check('plans win over tiers', pricingPlans({ ...legacy, plans: file.site.pricing.plans }).length === 5);
check('an empty plans list falls back to tiers', pricingPlans({ ...legacy, plans: [] }).length === 2);

// Junk never throws and never draws a blank card
check('no pricing at all is no cards', pricingPlans(undefined).length === 0 && pricingPlans('x').length === 0);
check('a plan with no band and no price is dropped', pricingPlans({ plans: [{ cta: 'x' }, null, 4] }).length === 0);
check('an unknown style reads as standard', pricingPlans({ plans: [{ band: 'A', rate: '£1', style: 'gold' }] })[0].style === 'standard');
check('a missing button falls back to the demo', (() => {
	const [p] = pricingPlans({ plans: [{ band: 'A', rate: '£1' }] });
	return p.cta === 'Book a demo' && p.href === '/demo';
})());
check('blank and non-string features are dropped', pricingPlans({ plans: [{ band: 'A', rate: '£1', features: ['x', '', '  ', 7, null] }] })[0].features.join('|') === 'x|7');
check('notes: junk and empty rows dropped', pricingNotes([{ title: 'T', body: '' }, {}, null, 'x']).length === 1);
check('modules with no items is nothing', pricingModules({ title: 'M', items: [] }) === null && pricingModules(null) === null);
check('a module with no title is dropped', pricingModules({ items: [{ body: 'b' }, { title: 'Tasks' }] })?.items.length === 1);

// The leading figure is bolded; formatted or figure-less lines are left alone
check('"10 user accounts" splits', JSON.stringify(featureParts('10 user accounts')) === JSON.stringify({ figure: '10', rest: ' user accounts' }));
check('"1,000+ seats" splits', featureParts('1,000+ seats').figure === '1,000+');
check('a line with no figure is untouched', featureParts('All launch modules').figure === '');
check('a bare number is untouched', featureParts('25').figure === '');
check('an already formatted line is untouched', featureParts('<strong>10</strong> users').rest === '<strong>10</strong> users');
check('"3rd-party" is not a figure', featureParts('3rd-party vendors').figure === '');

// Structured data never publishes a guess
check('£1,667 → 1667', planPrice('£1,667') === '1667');
check('POA has no price', planPrice('POA') === '');
check('Talk to us has no price', planPrice('Talk to us') === '');

if (failures) {
	console.error(`\n${failures} failed`);
	process.exit(1);
}
console.log('\nAll pricing checks passed.');
