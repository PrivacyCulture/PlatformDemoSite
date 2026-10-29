/**
 * Pages built in Sorted's page builder, turned back into the content the routes already draw.
 *
 * Sorted serves `blockPages` (page key → block page) once a page has been converted there. Rather
 * than a second set of page components, each block page is written back over the page's own copy
 * — the hero's words, the "In the platform" picture, the cards — and anything the builder added
 * becomes one of the seven added-section templates, placed by the page's `layout`. So every route
 * draws a block page exactly as it draws the page today, and a page with no block page is never
 * touched.
 *
 * The rules, each asserted in scripts/test-block-pages.ts:
 * - A block page that has not been edited gives back the page exactly as it was.
 * - Only what a block says is written; every other key of the page is kept.
 * - A part of the page with no block is left off it (Sorted already removes hidden blocks).
 * - A block a page cannot draw (a second hero, a problems list on the FAQ) is skipped, never thrown.
 *
 * Keep in step with Sorted's src/lib/page-builder/platform-convert.ts, which is the inverse of this.
 * Pure: no $env, no server imports.
 */

type Rec = Record<string, unknown>;

const isRec = (v: unknown): v is Rec => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const rec = (v: unknown): Rec => (isRec(v) ? v : {});
const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

export interface BlockPageBlock {
	id: string;
	type: string;
	layout: string;
	swap: boolean;
	header: { heading: string; body: string; buttons: { label: string; url: string; style: string }[] };
	data: Rec;
}

export interface BlockPage {
	title: string;
	slug: string;
	summary: string;
	seo: { title: string; description: string; keywords: string };
	blocks: BlockPageBlock[];
}

/** One block page from Sorted, coerced field by field; null when it is not one. */
export function readBlockPage(v: unknown): BlockPage | null {
	if (!isRec(v) || v.v !== 2) return null;
	const seo = rec(v.seo);
	const blocks: BlockPageBlock[] = [];
	const seen = new Set<string>();
	for (const b of arr(v.blocks)) {
		if (!isRec(b) || b.hidden === true || typeof b.link === 'string') continue;
		const id = str(b.id);
		const type = str(b.type);
		if (!id || !type || seen.has(id)) continue;
		seen.add(id);
		const h = rec(b.header);
		blocks.push({
			id,
			type,
			layout: str(b.layout),
			swap: b.swap === true,
			header: {
				heading: str(h.heading),
				body: str(h.body),
				buttons: arr(h.buttons)
					.filter(isRec)
					.map((x) => ({ label: str(x.label), url: str(x.url), style: str(x.style) }))
			},
			data: rec(b.data)
		});
	}
	return { title: str(v.title), slug: str(v.slug), summary: str(v.summary), seo: { title: str(seo.title), description: str(seo.description), keywords: str(seo.keywords) }, blocks };
}

/** Every block page Sorted served, by page key. One bad page costs only that page. */
export function validBlockPages(v: unknown): Record<string, BlockPage> {
	const out: Record<string, BlockPage> = {};
	for (const [key, p] of Object.entries(rec(v))) {
		const page = readBlockPage(p);
		if (page && /^[a-z0-9-]+$/.test(key)) out[key] = page;
	}
	return out;
}

// ── small writers ───────────────────────────────────────────────────────────────────────────

/** A picture as the content file holds it, written over what was there so its other keys survive. */
function image(m: unknown, before: unknown): Rec | null {
	const r = rec(m);
	const url = str(r.url).trim();
	if (!url) return null;
	const out: Rec = isRec(before) ? clone(before) : {};
	out.src = url;
	if (str(r.webp)) out.webp = str(r.webp);
	else if (str(rec(before).src) !== url) delete out.webp;
	out.alt = str(r.alt);
	if (typeof r.width === 'number') out.width = r.width;
	if (typeof r.height === 'number') out.height = r.height;
	return out;
}

function lines(heading: string): string[] {
	return heading
		.split(/<br\s*\/?>/i)
		.map((s) => s.trim())
		.filter(Boolean);
}

/** A heading back into a part's `title` / `titleLines`, whichever the part already used. */
function writeHeading(target: Rec, heading: string): void {
	const ls = lines(heading);
	if (Array.isArray(target.titleLines) || ls.length > 1) {
		target.titleLines = ls;
		if ('title' in target && ls.length) target.title = target.title && ls.join(' ') === str(target.title) ? target.title : ls.join(' ');
	} else target.title = heading;
}

function items(v: unknown, keepIds = false, title = 'title', body = 'body'): Rec[] {
	return arr(v)
		.filter(isRec)
		.map((i) => {
			const out: Rec = {};
			if (keepIds && str(i.id)) out.id = str(i.id);
			out[title] = str(i.title);
			out[body] = str(i.body);
			return out;
		});
}

function button(b: { label: string; url: string } | undefined, before: unknown): Rec | undefined {
	if (!b) return undefined;
	const out: Rec = isRec(before) ? clone(before) : {};
	out.label = b.label;
	if (b.url || 'href' in out) out.href = b.url;
	return out;
}

function seo(target: Rec, page: BlockPage): void {
	const meta: Rec = isRec(target.meta) ? clone(target.meta) : {};
	meta.title = page.seo.title;
	meta.description = page.seo.description;
	if (page.seo.keywords || 'keywords' in meta) meta.keywords = page.seo.keywords;
	target.meta = meta;
}

/** The page's own explainer from the hero block; absent when nothing is set and nothing was there. */
function explainer(target: Rec, d: Rec): void {
	const before = rec(target.explainer);
	const src = str(rec(d.video).url);
	const poster = str(rec(d.poster).url);
	const captions = str(rec(d.captions).url);
	const label = str(d.videoLabel);
	const uploadDate = str(d.uploadDate);
	const duration = str(d.durationSeconds);
	if (!src && !poster && !captions && !label && !uploadDate && !duration && !isRec(target.explainer)) return;
	const out: Rec = clone(before);
	const set = (k: string, v: string) => {
		if (v || k in out) out[k] = v;
	};
	set('src', src);
	set('poster', poster);
	set('captions', captions);
	set('label', label);
	set('uploadDate', uploadDate);
	if (duration) out.durationSeconds = /^\d+(\.\d+)?$/.test(duration) && typeof before.durationSeconds === 'number' ? Number(duration) : duration;
	else if ('durationSeconds' in out) out.durationSeconds = typeof before.durationSeconds === 'number' ? before.durationSeconds : '';
	target.explainer = out;
}

/** A block the page has no part for, as an added section — or null when no template can draw it. */
function asSection(b: BlockPageBlock): Rec | null {
	const h = b.header;
	const d = b.data;
	switch (b.type) {
		case 'text':
			return { id: b.id, template: 'text', title: h.heading, body: h.body };
		case 'copy-image':
			return { id: b.id, template: 'copyImage', eyebrow: str(d.eyebrow), title: h.heading, body: h.body, image: image(d.media, null) ?? { src: '', alt: '' }, imageSide: b.swap ? 'left' : 'right' };
		case 'cards':
			return { id: b.id, template: 'cards', eyebrow: str(d.eyebrow), title: h.heading, body: h.body, items: items(d.items) };
		case 'quote':
			return { id: b.id, template: 'quote', title: h.heading, quote: str(d.quote), attribution: str(d.attribution) };
		case 'cta':
			return { id: b.id, template: 'cta', eyebrow: str(d.eyebrow), title: h.heading, body: h.body, label: h.buttons[0]?.label ?? '', href: h.buttons[0]?.url ?? '' };
		case 'image':
			return { id: b.id, template: 'image', title: h.heading, image: image(d.media, null) ?? { src: '', alt: '' }, caption: str(d.caption) };
		case 'foldout':
			return { id: b.id, template: 'foldout', title: h.heading, intro: h.body, items: items(d.items) };
	}
	return null;
}

/**
 * Writes a page's order: its own parts that have blocks, and the blocks it has no part for as
 * added sections. Leaves `layout` and `sections` out when they say no more than the defaults, so
 * an unedited page comes back exactly as it was.
 */
function writeLayout(target: Rec, page: BlockPage, own: Record<string, (b: BlockPageBlock) => boolean>, defaults: readonly string[], skip: Set<string>): void {
	const order: string[] = [];
	const sections: Rec[] = [];
	for (const b of page.blocks) {
		if (skip.has(b.id)) continue;
		if (own[b.id]?.(b)) {
			order.push(b.id);
			continue;
		}
		const s = asSection(b);
		if (s) {
			sections.push(s);
			order.push(b.id);
		}
	}
	const isDefault = !sections.length && order.length === defaults.length && order.every((id, i) => id === defaults[i]);
	if (isDefault && !Array.isArray(target.layout)) {
		if (Array.isArray(target.sections) && !target.sections.length) return;
		delete target.sections;
		return;
	}
	target.layout = order.map((id) => ({ id }));
	if (sections.length || Array.isArray(target.sections)) target.sections = sections;
}

const byId = (page: BlockPage, id: string, type: string) => page.blocks.find((b) => b.id === id && b.type === type);

// ── the pages ───────────────────────────────────────────────────────────────────────────────

const PLATFORM_DEFAULT = ['trusted', 'fit', 'problems', 'articles', 'pricing', 'cta'];
const PROBLEM_DEFAULT = ['quote', 'inPlatform', 'functionality', 'pricing', 'cta'];

function applyPlatform(copy: Rec, page: BlockPage, problemItems: unknown[]): void {
	seo(copy, page);
	const hero = byId(page, 'hero', 'hero');
	if (hero) {
		const h: Rec = clone(rec(copy.hero));
		h.eyebrow = str(hero.data.eyebrow);
		writeHeading(h, hero.header.heading);
		if (str(hero.data.plainTitle)) h.title = str(hero.data.plainTitle);
		h.body = hero.header.body;
		const [primary, secondary] = hero.header.buttons;
		if (primary) h.primary = button(primary, h.primary);
		if (secondary) h.secondary = { ...rec(h.secondary), label: secondary.label };
		copy.hero = h;
		explainer(copy, hero.data);
	}
	const fit = byId(page, 'fit', 'copy-image');
	if (fit) {
		const f: Rec = clone(rec(copy.fit));
		f.eyebrow = str(fit.data.eyebrow);
		writeHeading(f, fit.header.heading);
		f.body = fit.header.body;
		const img = image(fit.data.media, f.image);
		if (img) f.image = img;
		f.pillars = items(fit.data.items);
		copy.fit = f;
	}
	const problems = byId(page, 'problems', 'problems');
	if (problems) {
		copy.problems = { ...rec(copy.problems), eyebrow: str(problems.data.eyebrow), title: problems.header.heading };
		applyProblemRows(problemItems, problems.data.items);
	}
	const articles = byId(page, 'articles', 'articles');
	if (articles && (isRec(copy.articles) || articles.header.heading || str(articles.data.eyebrow) || str(articles.data.loadMore))) {
		const a: Rec = clone(rec(copy.articles));
		const set = (k: string, v: string) => {
			if (v || k in a) a[k] = v;
		};
		set('eyebrow', str(articles.data.eyebrow));
		set('title', articles.header.heading);
		set('loadMore', str(articles.data.loadMore));
		if (Object.keys(a).length) copy.articles = a;
	}
	writeLayout(
		copy,
		page,
		{
			trusted: (b) => b.type === 'logos',
			fit: (b) => b.type === 'copy-image',
			problems: (b) => b.type === 'problems',
			articles: (b) => b.type === 'articles',
			pricing: (b) => b.type === 'pricing',
			cta: (b) => b.type === 'cta'
		},
		PLATFORM_DEFAULT,
		new Set(['hero'])
	);
}

/**
 * The problems list owns the problem pages' order (the list and the pager follow it) and the line
 * under each. Sorted in place, so references to the items stay good. A problem page the list does
 * not name — added to the file after the list was last saved — keeps its place after the named ones.
 */
function applyProblemRows(problemItems: unknown[], rows: unknown): void {
	const list = arr(rows).filter(isRec);
	if (!list.length) return;
	const order = new Map(list.map((r, i) => [str(r.id), i]));
	const line = new Map(list.map((r) => [str(r.id), str(r.body)]));
	for (const item of problemItems) {
		if (isRec(item) && line.has(str(item.slug))) item.summary = line.get(str(item.slug));
	}
	const rank = (i: unknown) => order.get(str(rec(i).slug)) ?? Number.MAX_SAFE_INTEGER;
	const sorted = [...problemItems].map((v, i) => ({ v, i })).sort((a, b) => rank(a.v) - rank(b.v) || a.i - b.i).map((x) => x.v);
	problemItems.splice(0, problemItems.length, ...sorted);
}

function applyProblem(item: Rec, page: BlockPage): void {
	seo(item, page);
	if (page.title) item.title = page.title;
	// The line under it in the problems list is /platform's to edit (applyProblemRows), not this page's.
	const hero = byId(page, 'hero', 'hero');
	if (hero) {
		const h: Rec = clone(rec(item.hero));
		h.title = hero.header.heading;
		h.body = hero.header.body;
		const show = hero.data.showExplainer === true;
		const own = !!str(rec(hero.data.video).url) || !!str(rec(hero.data.poster).url);
		// Off = nothing beside the hero. The page's own video would show regardless (the site reads
		// one as the request), so the served copy leaves it out; Sorted still keeps it.
		// On = the page's own video when it has one, else the shared one.
		if (!show) h.sharedElement = 'none';
		else if (!own) h.sharedElement = 'explainer-video';
		else if (!('sharedElement' in h)) h.sharedElement = 'none';
		item.hero = h;
		explainer(item, show ? hero.data : { ...hero.data, video: null, poster: null });
	}
	const quote = byId(page, 'quote', 'quote');
	if (quote) item.quote = str(quote.data.quote);
	const inP = byId(page, 'inPlatform', 'copy-image');
	if (inP) {
		const panel = str(inP.data.panel);
		if (panel && !isRec(item.inPlatform)) item.panel = panel;
		else {
			const p: Rec = clone(rec(item.inPlatform));
			p.title = inP.header.heading;
			p.body = inP.header.body;
			const img = image(inP.data.media, p.image);
			if (img) p.image = img;
			item.inPlatform = p;
		}
	}
	const fn = byId(page, 'functionality', 'cards');
	if (fn) item.functionality = { ...rec(item.functionality), title: fn.header.heading, items: items(fn.data.items) };
	const cta = byId(page, 'cta', 'cta');
	if (cta) {
		const c: Rec = clone(rec(item.cta));
		c.title = cta.header.heading;
		c.body = cta.header.body;
		if (str(cta.data.eyebrow) || 'eyebrow' in c) c.eyebrow = str(cta.data.eyebrow);
		if (str(cta.data.micro) || 'micro' in c) c.micro = str(cta.data.micro);
		item.cta = c;
	}
	writeLayout(
		item,
		page,
		{
			quote: (b) => b.type === 'quote',
			inPlatform: (b) => b.type === 'copy-image',
			functionality: (b) => b.type === 'cards',
			pricing: (b) => b.type === 'pricing',
			cta: (b) => b.type === 'cta'
		},
		PROBLEM_DEFAULT.filter((id) => id !== 'quote' || !!item.quote),
		new Set(['hero'])
	);
}

function applyFaq(copy: Rec, page: BlockPage): void {
	seo(copy, page);
	const hero = byId(page, 'hero', 'hero');
	if (hero) {
		copy.eyebrow = str(hero.data.eyebrow);
		copy.title = hero.header.heading;
		copy.intro = hero.header.body;
	}
	const q = byId(page, 'questions', 'faq');
	if (q) {
		copy.items = items(q.data.items, false, 'q', 'a');
		if (str(q.data.countLabel) || 'countLabel' in copy) copy.countLabel = str(q.data.countLabel);
		const pack: Rec = clone(rec(copy.securityPack));
		const map: [string, string][] = [['lead', 'packLead'], ['trustLabel', 'packTrustLabel'], ['trustHref', 'packTrustHref'], ['or', 'packOr'], ['demoLabel', 'packDemoLabel'], ['demoHref', 'packDemoHref']];
		for (const [k, from] of map) pack[k] = str(q.data[from]);
		copy.securityPack = pack;
	}
	const cta = byId(page, 'cta', 'cta');
	if (cta) copy.cta = { ...rec(copy.cta), eyebrow: str(cta.data.eyebrow), title: cta.header.heading, body: cta.header.body, micro: str(cta.data.micro) };
	writeLayout(copy, page, { questions: (b) => b.type === 'faq', cta: (b) => b.type === 'cta' }, ['questions', 'cta'], new Set(['hero']));
}

function applyPricing(copy: Rec, page: BlockPage): void {
	seo(copy, page);
	const plans = byId(page, 'plans', 'pricing');
	if (plans && (Array.isArray(copy.notes) || arr(plans.data.notes).length)) copy.notes = items(plans.data.notes);
	const modules = byId(page, 'modules', 'foldout');
	if (modules) {
		const m: Rec = clone(rec(copy.modules));
		m.title = modules.header.heading;
		m.intro = modules.header.body;
		if (str(modules.data.eyebrow) || 'eyebrow' in m) m.eyebrow = str(modules.data.eyebrow);
		m.items = items(modules.data.items);
		copy.modules = m;
	}
	writeLayout(copy, page, { modules: (b) => b.type === 'foldout' && isRec(copy.modules), cta: (b) => b.type === 'cta' }, isRec(copy.modules) ? ['modules', 'cta'] : ['cta'], new Set(['plans']));
}

function applyTrust(copy: Rec, page: BlockPage): void {
	seo(copy, page);
	const hero = byId(page, 'hero', 'hero');
	if (hero) {
		const h: Rec = clone(rec(copy.hero));
		h.eyebrow = str(hero.data.eyebrow);
		h.title = hero.header.heading;
		h.body = hero.header.body;
		const [primary, secondary] = hero.header.buttons;
		if (primary) h.primary = button(primary, h.primary);
		if (secondary) h.secondary = button(secondary, h.secondary);
		copy.hero = h;
	}
	const pillars = byId(page, 'pillars', 'cards');
	if (pillars) {
		copy.pillarsEyebrow = str(pillars.data.eyebrow);
		copy.pillars = items(pillars.data.items, true);
		const ctas: Rec = clone(rec(copy.ctas));
		const keys = Object.keys(ctas);
		pillars.header.buttons.forEach((b, i) => {
			const k = keys[i] ?? `cta${i + 1}`;
			ctas[k] = button(b, ctas[k]);
		});
		copy.ctas = ctas;
	}
}

const LEGAL_HEAD = ['meta', 'eyebrow', 'title', 'dateline', 'contentsLabel', 'printLabel', 'cta'];

function applyLegal(copy: Rec, page: BlockPage): void {
	seo(copy, page);
	const doc = byId(page, 'document', 'legal');
	if (doc) {
		copy.title = doc.header.heading;
		for (const k of ['eyebrow', 'dateline', 'contentsLabel', 'printLabel']) if (str(doc.data[k]) || k in copy) copy[k] = str(doc.data[k]);
		let body: unknown = null;
		try {
			body = JSON.parse(str(doc.data.document) || '{}');
		} catch {
			body = null;
		}
		// A document that no longer reads as JSON keeps what the page had: losing the policy text
		// to a typo would be worse than an edit that does not show.
		if (isRec(body)) for (const [k, v] of Object.entries(body)) if (!LEGAL_HEAD.includes(k)) copy[k] = v;
	}
	const cta = byId(page, 'cta', 'cta');
	if (cta && isRec(copy.cta)) copy.cta = { ...rec(copy.cta), eyebrow: str(cta.data.eyebrow), title: cta.header.heading, body: cta.header.body, micro: str(cta.data.micro) };
}

function applyCustom(copy: Rec, page: BlockPage): void {
	seo(copy, page);
	if (page.title) copy.title = page.title;
	const hero = byId(page, 'hero', 'hero');
	if (hero) {
		copy.eyebrow = str(hero.data.eyebrow);
		copy.title = hero.header.heading || str(copy.title);
		copy.intro = hero.header.body;
	}
	const sections: Rec[] = [];
	for (const b of page.blocks) {
		if (b.id === 'hero' || (b.id === 'cta' && b.type === 'cta')) continue;
		const s = asSection(b);
		if (s) sections.push(s);
	}
	copy.sections = sections;
	const cta = byId(page, 'cta', 'cta');
	if (cta) copy.cta = { ...rec(copy.cta), eyebrow: str(cta.data.eyebrow), title: cta.header.heading, body: cta.header.body, micro: str(cta.data.micro) };
}

/**
 * The content with every block page written over its page. Returns the same object untouched when
 * there are none — the site with no block pages renders exactly as it always has.
 */
export function applyBlockPages<T>(content: T, blockPages: Record<string, BlockPage>): T {
	const keys = Object.keys(blockPages);
	if (!keys.length) return content;
	const out = clone(content) as unknown as Rec;
	const pages = rec(out.pages);
	const problemItems = arr(rec(out.problems).items);
	const custom = arr(out.customPages);
	for (const key of keys) {
		const page = blockPages[key];
		try {
			if (key === 'platform' && isRec(pages.platform)) applyPlatform(pages.platform, page, problemItems);
			else if (key.startsWith('problem-')) {
				const item = problemItems.find((i) => `problem-${str(rec(i).slug)}` === key);
				if (isRec(item)) applyProblem(item, page);
			} else if (key.startsWith('custom-')) {
				const item = custom.find((i) => `custom-${str(rec(i).slug)}` === key);
				if (isRec(item)) applyCustom(item, page);
			} else if (key === 'faq' && isRec(pages.faq)) applyFaq(pages.faq, page);
			else if (key === 'pricing' && isRec(pages.pricing)) applyPricing(pages.pricing, page);
			else if (key === 'trust' && isRec(pages.trust)) applyTrust(pages.trust, page);
			else if (key === 'dpa' && isRec(pages.dpa)) applyLegal(pages.dpa, page);
			else if (key === 'cookie-notice' && isRec(pages.cookieNotice)) applyLegal(pages.cookieNotice, page);
			else if (key === 'privacy-policy' && isRec(pages.privacyPolicy)) applyLegal(pages.privacyPolicy, page);
		} catch (e) {
			// One page that cannot be written back costs only that page: it is drawn as it was.
			console.error(`[block-pages] could not draw ${key} from its block page`, e);
		}
	}
	return out as unknown as T;
}
