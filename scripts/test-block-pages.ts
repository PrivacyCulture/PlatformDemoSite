// Offline: block pages from Sorted's page builder, written back over the content the routes draw.
// Run: npx tsx scripts/test-block-pages.ts
//
// scripts/fixtures/block-pages.json is what Sorted serves for this site's own data/database.json
// with every page converted and nothing edited (regenerate it from Sorted when the converter
// changes). The round trip is the property that matters: converting must cost no page anything.
import { readFileSync } from 'node:fs';
import { applyBlockPages, validBlockPages, readBlockPage } from '../src/lib/site/block-pages';
import { readHeroSplit } from '../src/lib/site/split-hero';
import { addedSections } from '../src/lib/site/added-sections';

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
		const k = key === 'cookie-notice' ? 'cookieNotice' : key === 'privacy-policy' ? 'privacyPolicy' : key === 'not-found' ? 'notFound' : key;
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
	const d = edit('demo', (p) => {
		(block(p, 'hero').header as Rec).heading = 'Talk to us';
		(block(p, 'form').data as Rec)['steps.calendar.title'] = 'Choose a slot';
		(block(p, 'aside').data as Rec).items = [{ id: 'i1', title: 'One', body: 'Thing' }];
	});
	const demo = pagesOf(d).demo as Rec;
	check((demo.hero as Rec).title === 'Talk to us', 'the demo hero edit reaches the page');
	check(((demo.steps as Rec).calendar as Rec).title === 'Choose a slot' && ((demo.steps as Rec).calendar as Rec).intro === (((pagesOf(content).demo as Rec).steps as Rec).calendar as Rec).intro, 'a booking-form wording edit reaches its step, and the rest of the step is kept');
	check(canon((demo.aside as Rec).items) === canon([{ title: 'One', body: 'Thing' }]), 'the demo aside edit reaches the page');

	const b = edit('blog', (p) => {
		(block(p, 'index').data as Rec)['recent.title'] = 'Newest.';
		(block(p, 'article').data as Rec)['article.share'] = 'Pass it on';
	});
	const blog = pagesOf(b).blog as Rec;
	check((blog.recent as Rec).title === 'Newest.' && (blog.article as Rec).share === 'Pass it on', 'blog wording edits reach the page');

	const n = edit('not-found', (p) => {
		const hero = block(p, 'hero');
		(hero.header as Rec).buttons = [{ label: 'Home', url: '/', style: '' }];
		(hero.data as Rec).showExplainer = false;
		(block(p, 'whereNext').data as Rec).items = [{ id: 'i1', title: 'Trust', body: 'Security', buttonUrl: '/trust' }];
		(block(p, 'error').header as Rec).heading = 'Oops';
	});
	const nf = pagesOf(n).notFound as Rec;
	const nh = nf.hero as Rec;
	check((nh.primary as Rec).label === 'Home' && (nh.secondary as Rec).label === '' && nh.sharedElement === 'none', 'the error page hero: a removed button is left blank and the explainer can be switched off');
	check(canon((nf.whereNext as Rec).items) === canon([{ label: 'Trust', body: 'Security', href: '/trust' }]), 'link cards come back as the label, body and address the page reads');
	check((nf.error as Rec).title === 'Oops', 'the failure wording edit reaches the page');
}

{
	// A page made in Sorted: removing its CTA block in the builder takes the Next step box off the page.
	const withCustom = { ...content, customPages: [{ slug: 'made-here', meta: { title: 'Made here', description: '' }, eyebrow: '', title: 'Made here', intro: '', sections: [], cta: { eyebrow: '', title: '', body: '', micro: '' } }] } as Rec;
	const base = JSON.parse(JSON.stringify(served.platform)) as Rec;
	const hero = JSON.parse(JSON.stringify(block(base, 'hero'))) as Rec;
	const ctaBlock = { ...JSON.parse(JSON.stringify(hero)), id: 'cta', type: 'cta', header: { ...(hero.header as Rec), heading: 'Talk to us', body: 'Soon', buttons: [] }, data: { eyebrow: 'Next', micro: '' } } as Rec;
	const page = (bs: Rec[]) => ({ ...base, slug: 'made-here', blocks: bs });
	const customOf = (c: Rec) => (c.customPages as Rec[]).find((p) => p.slug === 'made-here') as Rec;
	const without = customOf(applyBlockPages(withCustom, validBlockPages({ 'custom-made-here': page([hero]) })) as Rec);
	check(without.showCta === false, 'a page made in Sorted with its CTA block removed draws no CTA');
	const withCta = customOf(applyBlockPages(withCustom, validBlockPages({ 'custom-made-here': page([hero, ctaBlock]) })) as Rec);
	check(!('showCta' in withCta) && (withCta.cta as Rec).title === 'Talk to us', 'with the CTA block it draws the CTA, with its words');
	const videoHero = { ...hero, data: { ...(hero.data as Rec), showExplainer: true, video: { url: '/media/film.mp4', alt: '', mime: 'video/mp4', width: null, height: null, mediaId: null }, chapters: { url: '/media/c.json', alt: '', mime: 'application/json', width: null, height: null, mediaId: null } } };
	const withVideo = customOf(applyBlockPages(withCustom, validBlockPages({ 'custom-made-here': page([videoHero]) })) as Rec);
	check(((withVideo.explainer as Rec | undefined)?.src) === '/media/film.mp4' && (withVideo.explainer as Rec).chapters === '/media/c.json', 'the hero’s own video and chapters reach a page made in Sorted');
	const off = customOf(applyBlockPages(withCustom, validBlockPages({ 'custom-made-here': page([{ ...videoHero, data: { ...(videoHero.data as Rec), showExplainer: false } }]) })) as Rec);
	check(!((off.explainer as Rec | undefined)?.src), 'with the explainer switched off, the page shows no video');
	// Published from the builder before its own content area was ever approved: live has no entry for it.
	const fresh = applyBlockPages({ ...content, customPages: undefined } as Rec, validBlockPages({ 'custom-made-here': page([{ ...hero, header: { ...(hero.header as Rec), heading: 'Made here' } }]) })) as Rec;
	const made = customOf(fresh);
	check(!!made && made.title === 'Made here' && made.showCta === false, 'a page made in Sorted with no entry on the site is created from its block page');
}

{
	// A film from the Explainer Studio: the hero's chapter file reaches the page's explainer, and goes with it.
	const withFilm = edit('platform', (p) => {
		const d = block(p, 'hero').data as Rec;
		d.showExplainer = true;
		d.video = { url: '/media/film.mp4', alt: '', mime: 'video/mp4', width: null, height: null, mediaId: null };
		d.chapters = { url: '/media/film-chapters.json', alt: '', mime: 'application/json', width: null, height: null, mediaId: null };
	});
	const e1 = (pagesOf(withFilm).platform as Rec).explainer as Rec;
	check(e1.src === '/media/film.mp4' && e1.chapters === '/media/film-chapters.json', 'a hero film with chapters writes both onto the page’s explainer');
	const without = edit('platform', (p) => {
		const d = block(p, 'hero').data as Rec;
		d.showExplainer = true;
		d.video = { url: '/media/other.mp4', alt: '', mime: 'video/mp4', width: null, height: null, mediaId: null };
		d.chapters = { url: '/media/film-chapters.json', alt: '', mime: 'application/json', width: null, height: null, mediaId: null };
	});
	const cleared = edit('platform', (p) => {
		const d = block(p, 'hero').data as Rec;
		d.showExplainer = true;
		d.video = { url: '/media/other.mp4', alt: '', mime: 'video/mp4', width: null, height: null, mediaId: null };
		d.chapters = null;
	});
	check(!!((pagesOf(without).platform as Rec).explainer as Rec).chapters, 'sanity: the chapters are written while set');
	check(!(((pagesOf(cleared).platform as Rec).explainer as Rec).chapters), 'no chapter file is left on a video that has none');
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

{
	// Other pages in the list, and a problem page made in the page builder.
	const c = applyBlockPages(content, validBlockPages({
		platform: (() => {
			const p = JSON.parse(JSON.stringify(served.platform)) as Rec;
			const rows = (block(p, 'problems').data as Rec).items as Rec[];
			(block(p, 'problems').data as Rec).items = [{ id: 'made', ref: 'problem-records-nobody-owns', title: 'Records nobody owns', body: 'Nobody knows who keeps it', buttonUrl: '/records-nobody-owns' }, ...rows, { id: 'lnk', title: 'Trust and security', body: 'How we keep it safe', buttonUrl: '/trust' }];
			return p;
		})(),
		'problem-records-nobody-owns': { v: 2, title: 'Records nobody owns', slug: 'records-nobody-owns', seo: { title: 'Records', description: 'D', keywords: '' }, blocks: [
			{ id: 'hero', type: 'hero', layout: 'default', swap: false, header: { heading: 'Who keeps the record?', body: '<p>Body</p>', buttons: [] }, data: { showExplainer: false, showPager: true } },
			{ id: 'inPlatform', type: 'copy-image', layout: 'below', swap: false, header: { heading: 'In', body: 'B', buttons: [] }, data: { media: null } },
			{ id: 'functionality', type: 'cards', layout: 'default', swap: false, header: { heading: 'Fn', body: '', buttons: [] }, data: { items: [{ id: 'i1', title: 'One', body: 'First' }] } },
			{ id: 'cta', type: 'cta', layout: 'default', swap: false, header: { heading: '', body: '', buttons: [] }, data: {} }
		] }
	})) as Rec;
	const after = (c.problems as Rec).items as Rec[];
	const made = after.find((i) => i.slug === 'records-nobody-owns');
	check(!!made && made.href === '/records-nobody-owns' && made.title === 'Records nobody owns' && (made.hero as Rec).title === 'Who keeps the record?', 'a problem page made in the builder is created with its words');
	check(after[0].slug === 'records-nobody-owns' && made!.summary === 'Nobody knows who keeps it', 'it takes its place and line in the list');
	check(!('image' in (made!.inPlatform as Rec)), 'with no picture yet, In the platform has none (the page draws the words alone)');
	check(canon(made!.layout) === canon([{ id: 'inPlatform' }, { id: 'functionality' }, { id: 'cta' }]), 'its own parts are laid out in order, the plans left off when it has none');
	const entries = ((pagesOf(c).platform as Rec).problems as Rec).entries as Rec[];
	check(canon(entries[0]) === canon({ slug: 'records-nobody-owns' }) && canon(entries[entries.length - 1]) === canon({ href: '/trust', title: 'Trust and security', summary: 'How we keep it safe' }), 'the list carries a link row in its place, beside the problem pages');
	const plain = applyBlockPages(content, validBlockPages({ platform: served.platform })) as Rec;
	check(!('entries' in ((pagesOf(plain).platform as Rec).problems as Rec)), 'a list of only problem pages writes no entries (drawn exactly as before)');
}

{
	// The Book a demo form beside the hero's copy, on the three pages that draw it.
	const slug = ((content.problems as Rec).items as Rec[])[0].slug as string;
	const key = `problem-${slug}`;
	const formOn = (p: Rec) => {
		((block(p, 'hero').data as Rec).showDemoForm = true);
	};
	const pOn = problemOf(edit(key, formOn), slug)!;
	check((pOn.hero as Rec).sharedElement === 'demo-form', 'problem page: the form switched on reaches the hero');
	const pBoth = problemOf(edit(key, (p) => {
		formOn(p);
		(block(p, 'hero').data as Rec).showExplainer = true;
	}), slug)!;
	check((pBoth.hero as Rec).sharedElement === 'demo-form', 'problem page: with the explainer on too, the form wins');
	// Switched off again, from content that had it on: the explainer switch decides as before.
	const hadForm = JSON.parse(JSON.stringify(content)) as Rec;
	(problemOf(hadForm, slug)!.hero as Rec).sharedElement = 'demo-form';
	const offWithVideo = (p: Rec) => {
		(block(p, 'hero').data as Rec).showDemoForm = false;
		(block(p, 'hero').data as Rec).showExplainer = true;
	};
	const pp = JSON.parse(JSON.stringify(served[key])) as Rec;
	offWithVideo(pp);
	const pOff = problemOf(applyBlockPages(hadForm, validBlockPages({ [key]: pp })) as Rec, slug)!;
	check((pOff.hero as Rec).sharedElement === 'explainer-video', 'problem page: the form switched off gives the hero back to the explainer');

	const platOn = pagesOf(edit('platform', formOn)).platform as Rec;
	check((platOn.hero as Rec).sharedElement === 'demo-form', '/platform: the form switched on reaches the hero');
	const hadPlat = JSON.parse(JSON.stringify(content)) as Rec;
	((pagesOf(hadPlat).platform as Rec).hero as Rec).sharedElement = 'demo-form';
	const platOff = pagesOf(applyBlockPages(hadPlat, validBlockPages({ platform: served.platform })) as Rec).platform as Rec;
	check(!('sharedElement' in (platOff.hero as Rec)), '/platform: switched off, the key goes and the explainer is back');

	const withCustom = { ...content, customPages: [{ slug: 'made-here', meta: { title: 'Made here', description: '' }, eyebrow: '', title: 'Made here', intro: '', sections: [], cta: { eyebrow: '', title: '', body: '', micro: '' } }] } as Rec;
	const base = JSON.parse(JSON.stringify(served.platform)) as Rec;
	const hero = JSON.parse(JSON.stringify(block(base, 'hero'))) as Rec;
	const customOf = (c: Rec) => (c.customPages as Rec[]).find((x) => x.slug === 'made-here') as Rec;
	const page = (h: Rec) => ({ ...base, slug: 'made-here', blocks: [h] });
	const cOn = customOf(applyBlockPages(withCustom, validBlockPages({ 'custom-made-here': page({ ...hero, data: { ...(hero.data as Rec), showDemoForm: true } }) })) as Rec);
	check(cOn.sharedElement === 'demo-form', 'a page made in Sorted: the form switched on reaches the page');
	const cOff = customOf(applyBlockPages({ ...withCustom, customPages: [{ ...(withCustom.customPages as Rec[])[0], sharedElement: 'demo-form' }] } as Rec, validBlockPages({ 'custom-made-here': page({ ...hero, data: { ...(hero.data as Rec), showDemoForm: false } }) })) as Rec);
	check(!('sharedElement' in cOff), 'a page made in Sorted: switched off, the key goes');
}

{
	// The split hero: the Hero block's "Split: pitch and services" layout, written as `split`.
	const splitData = {
		background: { url: '/Images/network.webp', alt: 'A network', mime: 'image/webp', width: 1920, height: 1080 },
		stats: [{ id: 's1', title: 'Simple', body: 'Live in weeks' }, { id: 's2', title: 'Visual', body: 'See the blast radius' }],
		ctaNote: 'From £800 a month.',
		pitchOverlay: '#0B1F5C',
		pitchOpacity: 70,
		pitchTone: 'light',
		servicesEyebrow: 'Privacy services',
		servicesHeading: 'Expert help',
		servicesBody: 'Our specialists take on the day to day.',
		services: [{ id: 'v1', title: 'DPO as a Service', buttonUrl: '/dpo', icon: 'adviser' }, { id: 'v2', title: 'Privacy Training', buttonUrl: '', icon: 'presentation' }],
		servicesButtonText: 'Start a conversation',
		servicesButtonUrl: '/demo',
		servicesOverlay: '#f3f5fa',
		servicesOpacity: 95,
		servicesTone: 'dark'
	};
	const toSplit = (swap: boolean) => (p: Rec) => {
		const h = block(p, 'hero');
		h.layout = 'split';
		h.swap = swap;
		Object.assign(h.data as Rec, splitData);
	};
	const plat = (pagesOf(edit('platform', toSplit(false))).platform as Rec).hero as Rec;
	const s = readHeroSplit(plat.split)!;
	check(!!s, '/platform: the split layout reaches the hero as `split`');
	check(s.swap === false && s.background?.src === '/Images/network.webp' && s.background.width === 1920 && s.video === '', '/platform: the shared background picture comes through');
	check(s.pitch.overlay === '#0b1f5c' && s.pitch.opacity === 70 && s.pitch.tone === 'light', '/platform: the pitch overlay, opacity and tone come through');
	check(s.pitch.stats.length === 2 && s.pitch.stats[0].title === 'Simple' && s.pitch.ctaNote === 'From £800 a month.', '/platform: the stats and the card line come through');
	check(s.cta.label === ((block(served.platform as Rec, 'hero').header as Rec).buttons as Rec[])[0].label, "/platform: the card is the hero block's first button");
	check(s.services.links.length === 2 && s.services.links[0].icon === 'adviser' && s.services.links[0].href === '/dpo', '/platform: the services and their icons come through');
	check(s.services.button.label === 'Start a conversation' && s.services.heading === 'Expert help', "/platform: the services panel's words and button come through");
	check(readHeroSplit(((pagesOf(edit('platform', toSplit(true))).platform as Rec).hero as Rec).split)!.swap, '/platform: swap comes through');

	const slug = ((content.problems as Rec).items as Rec[])[0].slug as string;
	const pOn = problemOf(edit(`problem-${slug}`, (p) => {
		toSplit(false)(p);
		(block(p, 'hero').data as Rec).showDemoForm = true;
	}), slug)!;
	check(!!readHeroSplit((pOn.hero as Rec).split), 'problem page: the split layout reaches the hero');
	check(!!readHeroSplit((pagesOf(edit('faq', toSplit(false))).faq as Rec).split), 'FAQ: the split layout is written beside its top-level words');
	check(!!readHeroSplit(((pagesOf(edit('trust', toSplit(false))).trust as Rec).hero as Rec).split), 'Trust: the split layout reaches the hero');
	check(!!readHeroSplit(((pagesOf(edit('not-found', toSplit(false))).notFound as Rec).hero as Rec).split), 'Page not found: the split layout reaches the hero');

	const vid = readHeroSplit(((pagesOf(edit('platform', (p) => {
		toSplit(false)(p);
		(block(p, 'hero').data as Rec).background = { url: '/media/loop.mp4', alt: '', mime: 'video/mp4' };
	})).platform as Rec).hero as Rec).split)!;
	check(vid.video === '/media/loop.mp4' && vid.background === null, 'a video background is carried as the video, not as a picture');

	// Back to the ordinary layout, from content that had it split: the key goes.
	const hadSplit = JSON.parse(JSON.stringify(content)) as Rec;
	((pagesOf(hadSplit).platform as Rec).hero as Rec).split = { swap: true };
	const back = pagesOf(applyBlockPages(hadSplit, validBlockPages({ platform: served.platform })) as Rec).platform as Rec;
	check(!('split' in (back.hero as Rec)), 'the ordinary layout again: `split` goes from the hero');

	// Coerced before it is drawn.
	const bad = readHeroSplit({ pitch: { overlay: 'red', opacity: 140 }, services: { overlay: '#ABC', opacity: '-5', tone: 'neon', links: [{ label: '', href: '/x' }, { label: 'Kept', icon: 'not-an-icon' }] } })!;
	check(bad.pitch.overlay === '' && bad.pitch.opacity === 100, 'an overlay that is not a hex colour is none; an opacity over 100 is 100');
	check(bad.services.overlay === '#aabbcc' && bad.services.opacity === 0 && bad.services.tone === 'dark', 'a short hex colour is widened; a negative opacity is 0; an unknown tone is the default');
	check(bad.services.links.length === 1 && bad.services.links[0].icon === '', 'a link with no label is dropped; an unknown icon is none');
	check(readHeroSplit(undefined) === null && readHeroSplit('split') === null, 'no split is null');
}

// ── a Download form: written as a 'download' section naming its page, never its file ──
{
	const dl = { id: 'report', type: 'download-form', layout: 'default', swap: false, header: { heading: 'Our report', body: 'Read it.', buttons: [] }, data: { eyebrow: 'Free', file: null, hasFile: true, fileName: 'report.pdf', fileKind: 'PDF', buttonLabel: 'Get it', formOpen: false, askConsent: true, consentLabel: '', thankYou: '' } };
	const pages = validBlockPages({ 'custom-guide': { v: 2, title: 'Guide', slug: 'guide', seo: {}, blocks: [dl] } });
	check(pages['custom-guide'].key === 'custom-guide', 'a block page knows the key it was served under');
	const out = applyBlockPages({ ...(content as Rec), customPages: [{ slug: 'guide', title: 'Guide', sections: [] }] }, pages) as Rec;
	const page = (out.customPages as Rec[]).find((p) => p.slug === 'guide') as Rec;
	const s = addedSections(page).get('report');
	check(s?.template === 'download', 'the block becomes a download section');
	check(s?.template === 'download' && s.pageKey === 'custom-guide' && s.fileName === 'report.pdf' && s.buttonLabel === 'Get it' && s.hasFile, 'it carries the page key, the file name and the button');
	check(!JSON.stringify(page).includes('"url"'), 'no file address is written into the page');
	check(addedSections({ sections: [{ id: 'x', template: 'download', pageKey: '' }] }).size === 0, 'a download section with no page key is not drawn');
	check(addedSections({ sections: [{ id: 'x', template: 'download', pageKey: 'platform' }] }).get('x')?.template === 'download', 'one with a page key is');
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
