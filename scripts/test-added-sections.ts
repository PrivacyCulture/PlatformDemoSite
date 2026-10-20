// Sections added to a page in the CMS: the coercion and the layout that places them.
// Run: npx tsx scripts/test-added-sections.ts
//
// Both directions matter. A section the coercion drops is a change somebody made in the CMS that
// never shows; a section it lets through in the wrong shape is a page that reads a property off
// undefined and 500s — on the live site, from content nobody here can see.
import { addedSection, addedSections, safeHref, SECTION_TEMPLATE_IDS } from '../src/lib/site/added-sections';
import { pageLayout, platformLayout, faqLayout, pricingLayout, PLATFORM_DEFAULT_LAYOUT } from '../src/lib/site/page-layout';

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
	console.log(`  ${cond ? '✓' : '✗'} ${name}${cond || !detail ? '' : ` — ${detail}`}`);
	if (!cond) failures++;
}

console.log('\nCoercion');
check('a section with no template is text — the shape it always had', addedSection({ id: 'text-a', title: 'A', body: 'b' })?.template === 'text');
const ci = addedSection({ id: 'sec-x', template: 'copyImage', title: 'X', image: { src: '/i.png', width: '1200', height: 800 }, imageSide: 'left' });
check('copy and image keeps its image and side', ci?.template === 'copyImage' && ci.image.src === '/i.png' && ci.image.width === 1200 && ci.image.height === 800 && ci.imageSide === 'left');
check('an unknown side is right, never a third value', (addedSection({ id: 'y', template: 'copyImage', imageSide: 'top' }) as { imageSide: string }).imageSide === 'right');
check('a missing image is a blank image, not a crash', (addedSection({ id: 'y', template: 'copyImage' }) as { image: { src: string } }).image.src === '');
check('a card row with no items is an empty row', (addedSection({ id: 'c', template: 'cards' }) as { items: unknown[] }).items.length === 0);
check('a card row keeps blank cards — the page decides what to draw', (addedSection({ id: 'c', template: 'cards', items: [{ title: '' }, 'junk', { body: 'b' }] }) as { items: unknown[] }).items.length === 2);
check('a call to action with a javascript: address gets no address', (addedSection({ id: 'k', template: 'cta', label: 'Go', href: 'javascript:alert(1)' }) as { href: string }).href === '');
check('a protocol-relative address is refused too', safeHref('//evil.example') === '');
check('a page, an https address, mailto and tel pass', ['/pricing', 'https://x.y', 'mailto:a@b.c', 'tel:+44'].every((h) => safeHref(h) === h));
check('a template the site does not draw is dropped', addedSection({ id: 'z', template: 'carousel', title: 'Z' }) === null);
check('no id, no section', addedSection({ template: 'text', title: 'Z' }) === null);
check('the seven templates the CMS offers', SECTION_TEMPLATE_IDS.join() === 'text,copyImage,cards,quote,cta,image,foldout');
const fo = addedSection({ id: 'sec-m', template: 'foldout', title: 'Modules', intro: 'All six', items: [{ title: 'Tasks', body: 'b' }, 'junk', { title: 'ROPA' }] });
check('a fold-out list keeps its heading, intro and items', fo?.template === 'foldout' && fo.intro === 'All six' && fo.items.length === 2 && fo.items[1].body === '');
check('a fold-out list with no items is an empty list, not a crash', (addedSection({ id: 'f', template: 'foldout' }) as { items: unknown[] }).items.length === 0);
check('a library link that reached the site unexpanded is not drawn', addedSection({ id: 'sec-l', link: 'abc' }) === null);
check('a repeated id keeps the first — ids are each-keys', addedSections({ sections: [{ id: 'a', title: '1' }, { id: 'a', title: '2' }] }).get('a')?.title === '1');

console.log('\nLayout');
const copy = {
	layout: [{ id: 'quote' }, { id: 'sec-log' }, { id: 'cta' }, { id: 'carousel' }, { id: 'quote' }, { id: 'sec-missing' }],
	sections: [{ id: 'sec-log', template: 'copyImage', title: 'Log' }]
};
const entries = pageLayout(copy, ['quote', 'inPlatform', 'functionality', 'pricing', 'cta'], ['quote', 'inPlatform', 'functionality', 'pricing', 'cta']);
check('blocks and added sections come out in the list’s order', entries.map((e) => e.id).join() === 'quote,sec-log,cta', entries.map((e) => e.id).join());
check('an added section carries its coerced content', entries[1]?.kind === 'section' && entries[1].section.template === 'copyImage');
check('an unknown id, a repeat and a section the list names but the page lacks are all skipped', entries.length === 3);
check('no layout at all is the default order with nothing added', pageLayout({ sections: copy.sections }, ['a', 'b'], ['b', 'a']).map((e) => e.id).join() === 'b,a');
check('/platform keeps its own default', platformLayout({}).map((e) => e.id).join() === PLATFORM_DEFAULT_LAYOUT.join());
check('/faq with no layout is the questions then the call to action', faqLayout({}).map((e) => e.id).join() === 'questions,cta');
check('/faq draws its own order, with an added section between', faqLayout({ layout: [{ id: 'cta' }, { id: 'sec-a' }, { id: 'questions' }], sections: [{ id: 'sec-a', template: 'text', title: 'A' }] }).map((e) => e.id).join() === 'cta,sec-a,questions');
check('/pricing with no layout is the launch modules then the call to action', pricingLayout({}).map((e) => e.id).join() === 'modules,cta');
check('/pricing can drop the launch modules and add a section', pricingLayout({ layout: [{ id: 'sec-a' }, { id: 'cta' }], sections: [{ id: 'sec-a', template: 'foldout', title: 'A' }] }).map((e) => e.id).join() === 'sec-a,cta');
check('/pricing never treats the plans as a block', pricingLayout({ layout: [{ id: 'plans' }, { id: 'cta' }] }).map((e) => e.id).join() === 'cta');
check('/faq can drop a block', faqLayout({ layout: [{ id: 'questions' }] }).map((e) => e.id).join() === 'questions');

console.log(failures ? `\n${failures} failed` : '\nAll passed');
process.exit(failures ? 1 : 0);
