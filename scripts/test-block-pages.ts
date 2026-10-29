// Offline: block pages from Sorted's page builder, written back over the content the routes draw.
// Run: npx tsx scripts/test-block-pages.ts
//
// scripts/fixtures/block-pages.json is what Sorted serves for this site's own data/database.json
// with every page converted and nothing edited (regenerate it from Sorted when the converter
// changes). The round trip is the property that matters: converting must cost no page anything.
import { readFileSync } from 'node:fs';
import { applyBlockPages, validBlockPages, readBlockPage } from '../src/lib/site/block-pages';

let failures = 0;
let passes = 0;
function check(cond: unknown, msg: string) {
	if (cond) passes++;
	else {
		failures++;
		console.error('✗', msg);
	}
}

type Rec = Record<string, unknown>;
/** JSON with keys sorted, so two objects with the same content compare equal whatever their key order. */
function canon(v: unknown): string {
	return JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x as Rec).sort(([a], [b]) => a.localeCompare(b))) : x));
}

const content = JSON.parse(readFileSync('data/database.json', 'utf8')) as Rec;
const served = JSON.parse(readFileSync('scripts/fixtures/block-pages.json', 'utf8')) as Rec;
const blockPages = validBlockPages(served);
check(Object.keys(blockPages).length === Object.keys(served).length, 'every served block page reads');

// ── the round trip: an unedited block page gives back the page exactly ──
const pagesOf = (c: Rec) => c.pages as Rec;
const problemOf = (c: Rec, slug: string) => ((c.problems as Rec).items as Rec[]).find((i) => i.slug === slug);
for (const key of Object.keys(blockPages)) {
	const after = applyBlockPages(content, { [key]: blockPages[key] }) as Rec;
	const pick = (c: Rec) => {
		if (key.startsWith('problem-')) return problemOf(c, key.slice('problem-'.length));
		const k = key === 'cookie-notice' ? 'cookieNotice' : key === 'privacy-policy' ? 'privacyPolicy' : key;
		return pagesOf(c)[k];
	};
	const a = canon(pick(content));
	const b = canon(pick(after));
	if (a !== b) {
		const ka = Object.keys(pick(content) as Rec);
		const diff = ka.filter((k) => canon((pick(content) as Rec)[k]) !== canon((pick(after) as Rec)[k]));
		console.error(`  ${key} differs in: ${diff.join(', ')}`);
	}
	check(a === b, `${key}: an unedited block page gives back the page exactly`);
	check(canon(after) === canon(applyBlockPages(content, { [key]: blockPages[key] })), `${key}: writing back twice gives the same content`);
}
{
	const all = applyBlockPages(content, blockPages) as Rec;
	check(canon(all) === canon(content), 'every page converted and unedited: the whole content file comes back unchanged');
	check(applyBlockPages(content, {}) === content, 'no block pages: the content is returned untouched, not copied');
}

// ── edits come through ──
const edit = (key: string, fn: (p: Rec) => void): Rec => {
	const p = JSON.parse(JSON.stringify(served[key])) as Rec;
	fn(p);
	return applyBlockPages(content, validBlockPages({ [key]: p })) as Rec;
};
const blocks = (p: Rec) => p.blocks as Rec[];
const block = (p: Rec, id: string) => blocks(p).find((b) => b.id === id) as Rec;
{
	const slug = ((content.problems as Rec).items as Rec[])[0].slug as string;
	const key = `problem-${slug}`;
	const c = edit(key, (p) => {
		(block(p, 'hero').header as Rec).heading = 'A new hero';
		(block(p, 'functionality').data as Rec).items = [{ id: 'i1', title: 'Only card', body: 'Its body' }];
	});
	const item = problemOf(c, slug)!;
	check((item.hero as Rec).title === 'A new hero', 'a hero heading edit reaches the page');
	check(canon((item.functionality as Rec).items) === canon([{ title: 'Only card', body: 'Its body' }]), 'cards edits reach the page');

	const moved = edit(key, (p) => {
		const bs = blocks(p);
		const cta = bs.find((b) => b.id === 'cta')!;
		p.blocks = [bs[0], cta, ...bs.slice(1).filter((b) => b !== cta)].filter((b) => b.id !== 'pricing');
		(p.blocks as Rec[]).push({ v: 2, id: 'sec-extra', type: 'text', layout: 'default', swap: false, header: { heading: 'Added', body: '<p>New</p>', buttons: [] }, data: {} });
	});
	const m = problemOf(moved, slug)!;
	const order = (m.layout as Rec[]).map((e) => e.id).join();
	check(order.startsWith('cta,') && !order.includes('pricing') && order.endsWith('sec-extra'), `order, removal and an added block come through as the layout (${order})`);
	check(canon(m.sections) === canon([{ id: 'sec-extra', template: 'text', title: 'Added', body: '<p>New</p>' }]), 'a block the page has no part for becomes an added section');
}
{
	const c = edit('platform', (p) => {
		(block(p, 'hero').header as Rec).heading = 'One<br>Two';
		const fit = block(p, 'fit');
		fit.swap = true;
		(fit.data as Rec).media = { url: '/Images/new.png', alt: 'New', mime: 'image/png', width: 10, height: 5, mediaId: null };
	});
	const plat = pagesOf(c).platform as Rec;
	check(canon((plat.hero as Rec).titleLines) === canon(['One', 'Two']), 'heading lines come back as title lines');
	const img = (plat.fit as Rec).image as Rec;
	check(img.src === '/Images/new.png' && img.alt === 'New' && !('webp' in img), 'a new picture replaces the old one and drops its stale WebP twin');
}
{
	const c = edit('dpa', (p) => {
		(block(p, 'document').data as Rec).document = '{ not json';
	});
	check(canon(pagesOf(c).dpa) === canon(pagesOf(content).dpa), 'a legal document that no longer reads as JSON keeps what the page had');
	const t = edit('trust', (p) => {
		(block(p, 'pillars').data as Rec).items = [{ id: 'iso', title: 'ISO', body: 'Certified' }];
	});
	check(canon((pagesOf(t).trust as Rec).pillars) === canon([{ id: 'iso', title: 'ISO', body: 'Certified' }]), 'trust pillars keep their ids (they key the list)');
}

{
	// The problems list owns the order of the problem pages and the line under each.
	const items = (content.problems as Rec).items as Rec[];
	const [first, second] = items.map((i) => i.slug as string);
	const c = edit('platform', (p) => {
		const rows = (block(p, 'problems').data as Rec).items as Rec[];
		const moved = [rows[1], rows[0], ...rows.slice(2)];
		moved[0] = { ...moved[0], body: 'A new line under it' };
		(block(p, 'problems').data as Rec).items = moved.slice(0, -1);
	});
	const after = (c.problems as Rec).items as Rec[];
	check(after[0].slug === second && after[1].slug === first, 'reordering the list reorders the problem pages (the pager follows)');
	check(after[0].summary === 'A new line under it', 'a line edited in the list reaches that problem');
	check(after[after.length - 1].slug === items[items.length - 1].slug, 'a problem the list does not name keeps its place after the named ones');
	check(after.length === items.length, 'no problem page is lost');
}

// ── what is refused ──
check(readBlockPage({ blocks: [] }) === null && readBlockPage(null) === null, 'something that is not a block page is refused');
const hiddenEtc = readBlockPage({ v: 2, blocks: [{ id: 'a', type: 'text' }, { id: 'a', type: 'text' }, { id: 'h', type: 'text', hidden: true }, { id: 'l', type: 'text', link: 's1' }, { type: 'text' }] })!;
check(hiddenEtc.blocks.length === 1, 'hidden, linked, repeated and id-less blocks are not drawn');
check(Object.keys(validBlockPages({ 'Bad Key': { v: 2, blocks: [] }, ok: { v: 2, blocks: [] }, x: 4 })).join() === 'ok', 'one bad page costs only that page');
{
	const c = applyBlockPages(content, { faq: { title: '', slug: '', summary: '', seo: { title: 'T', description: '', keywords: '' }, blocks: [{ id: 'z', type: 'problems', layout: '', swap: false, header: { heading: 'X', body: '', buttons: [] }, data: {} }] } }) as Rec;
	check(!(pagesOf(c).faq as Rec).sections || ((pagesOf(c).faq as Rec).sections as unknown[]).length === 0, 'a block the page cannot draw is skipped, not drawn as something else');
}

console.log(failures ? `\n${failures} failed, ${passes} passed` : `\nAll ${passes} checks passed`);
process.exit(failures ? 1 : 0);
