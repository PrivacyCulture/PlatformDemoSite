// Offline: copies of the one-of-a-kind pages (made in Sorted), written back from their block pages.
// Run: npx tsx scripts/test-page-copies.ts
import { readFileSync } from 'node:fs';
import { applyBlockPages, validBlockPages } from '../src/lib/site/block-pages';
import { PAGE_COPY_KINDS, PAGE_COPY_PAGES_KEY, pageCopyKind, withDefaults } from '../src/lib/site/page-copies';

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
const canon = (v: unknown): string =>
	JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x as Rec).sort(([a], [b]) => a.localeCompare(b))) : x));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const content = JSON.parse(readFileSync('data/database.json', 'utf8')) as Rec;
const served = JSON.parse(readFileSync('scripts/fixtures/block-pages.json', 'utf8')) as Rec;
const pages = content.pages as Rec;

check(pageCopyKind('faq') === 'faq' && pageCopyKind('blog') === null && pageCopyKind(3) === null, 'only the copyable kinds are kinds');
check(canon(withDefaults({ a: 1, b: { c: 2, d: 3 }, e: [1, 2] }, { b: { c: 9 }, e: [7] })) === canon({ a: 1, b: { c: 9, d: 3 }, e: [7] }), 'objects merge key by key, lists are the copy’s whole');
check(withDefaults({ a: 1 }, undefined).a === 1, 'no content: the original');

for (const kind of PAGE_COPY_KINDS) {
	const original = pages[PAGE_COPY_PAGES_KEY[kind]] as Rec;
	const slug = `${kind}-copy`;
	const item = { ...clone(original), slug, pageKind: kind };
	const withCopy = { ...clone(content), customPages: [item] } as Rec;
	const bp = clone(served[kind]) as Rec;
	check(!!bp, `${kind}: the fixture has its block page`);
	bp.slug = slug;
	bp.title = `Copy of ${kind}`;
	const after = applyBlockPages(withCopy, validBlockPages({ [`custom-${slug}`]: bp })) as Rec;
	const copied = ((after.customPages as Rec[])[0]) as Rec;
	const { slug: _s, pageKind: _k, ...body } = copied;
	// A copy of /platform always records its list's order (it does not set the problem pages'), so
	// it carries `problems.entries` naming each problem page in the order the original draws them.
	if (kind === 'platform') {
		const list = (body.problems ?? {}) as Rec;
		const slugs = ((list.entries as Rec[]) ?? []).map((e) => e.slug);
		check(canon(slugs) === canon(((content.problems as Rec).items as Rec[]).map((i) => i.slug)), 'platform: the copy lists the problem pages in the original order');
		delete list.entries;
	}
	check(canon(body) === canon(original), `${kind}: an unedited copy's block page gives back the copied page exactly`);
	check(canon((after.pages as Rec)[PAGE_COPY_PAGES_KEY[kind]]) === canon(original), `${kind}: the original page is untouched`);
	check(canon((after.problems as Rec).items) === canon((content.problems as Rec).items), `${kind}: the problem pages keep their order and lines`);
}

// An edit to a copy reaches the copy alone.
{
	const item = { ...clone(pages.faq as Rec), slug: 'faq-copy', pageKind: 'faq' };
	const bp = clone(served.faq) as Rec;
	bp.slug = 'faq-copy';
	const hero = (bp.blocks as Rec[]).find((b) => b.id === 'hero') as Rec;
	(hero.header as Rec).heading = 'A different heading';
	const after = applyBlockPages({ ...clone(content), customPages: [item] }, validBlockPages({ 'custom-faq-copy': bp })) as Rec;
	check(((after.customPages as Rec[])[0] as Rec).title === 'A different heading', 'an edited copy shows the edit');
	check(((after.pages as Rec).faq as Rec).title === (pages.faq as Rec).title, 'the original FAQ keeps its heading');
}

// A copy of /platform with its problems list reordered keeps its own order without moving the real one.
{
	const item = { ...clone(pages.platform as Rec), slug: 'platform-copy', pageKind: 'platform' };
	const bp = clone(served.platform) as Rec;
	bp.slug = 'platform-copy';
	const list = (bp.blocks as Rec[]).find((b) => b.id === 'problems') as Rec;
	const rows = ((list.data as Rec).items as Rec[]) ?? [];
	if (rows.length > 1) {
		(list.data as Rec).items = [...rows].reverse();
		const after = applyBlockPages({ ...clone(content), customPages: [item] }, validBlockPages({ 'custom-platform-copy': bp })) as Rec;
		check(canon((after.problems as Rec).items) === canon((content.problems as Rec).items), 'reordering a copy’s list leaves the problem pages’ own order alone');
		const entries = (((after.customPages as Rec[])[0] as Rec).problems as Rec).entries as Rec[];
		check(Array.isArray(entries) && entries.length > 1, 'the copy keeps its own list order');
	}
}

console.log(`test-page-copies: ${passes} passed, ${failures} failed`);
if (failures) process.exit(1);
