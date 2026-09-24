/**
 * Server-side cache of the site content.
 *
 * With CONTENT_API_URL + CONTENT_API_TOKEN set, content is fetched from the CMS
 * (`GET /api/platform-content?channel=…`) and revalidated on a short TTL with
 * stale-while-revalidate; the CMS pushes `POST /api/content/refresh` when it
 * changes. With them unset, or until the first fetch succeeds, the site runs
 * from `data/database.json`. A body that fails validation never replaces the
 * last good snapshot.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import type { CustomPage, SiteContent } from '$lib/content';
import { hasBundledAsset } from '$lib/content/assets';
import { installContentResolver, setContent } from '$lib/content/runtime';
import database from '../../../data/database.json';

export type ContentChannel = 'live' | 'draft';
export type ContentSource = 'cms' | 'fallback';

export type ContentSnapshot = {
	content: SiteContent;
	source: ContentSource;
	fetchedAt: string | null;
};

const fallback = database as unknown as SiteContent;

/**
 * The content file this build was deployed with, as the CMS reads it to sync. Serialised once:
 * JSON.stringify of the parsed file, which is also exactly what the CMS hashes, so the two
 * fingerprints compare equal whenever the content is the same regardless of the file's layout.
 */
export const sourceText = JSON.stringify(database);
export const sourceSha256 = createHash('sha256').update(sourceText).digest('hex');

const als = new AsyncLocalStorage<SiteContent>();
installContentResolver(() => als.getStore());
setContent(fallback);

export function runWithContent<T>(content: SiteContent, fn: () => T): T {
	return als.run(content, fn);
}

function config() {
	const url = (env.CONTENT_API_URL ?? '').trim().replace(/\/+$/, '');
	const token = (env.CONTENT_API_TOKEN ?? '').trim();
	const channel: ContentChannel = env.CONTENT_CHANNEL?.trim() === 'draft' ? 'draft' : 'live';
	const override = Number(env.CONTENT_CACHE_SECONDS);
	const ttlSeconds =
		env.CONTENT_CACHE_SECONDS && Number.isFinite(override) && override >= 0
			? override
			: channel === 'draft'
				? 5
				: 300;
	return { url, token, channel, ttlSeconds, configured: Boolean(url && token) };
}

let snapshot: ContentSnapshot = { content: fallback, source: 'fallback', fetchedAt: null };
let etag: string | null = null;
let freshUntil = 0;
let lastError: string | null = null;
let inflight: Promise<void> | null = null;

const COLD_START_WAIT_MS = 3_000;
const FETCH_TIMEOUT_MS = 5_000;
const ERROR_BACKOFF_MAX_S = 15;

function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null;
}

/** Throws with a readable reason when `body` is not usable site content. */
export function validateContent(body: unknown): SiteContent {
	if (!isObject(body)) throw new Error('Content is not a JSON object');
	for (const key of Object.keys(fallback)) {
		if (!isObject(body[key])) throw new Error(`Content is missing "${key}"`);
	}
	const c = body as unknown as SiteContent;
	if (typeof c.site.brand !== 'string') throw new Error('Content has no site.brand');
	if (!Array.isArray(c.journey.scenes)) throw new Error('journey.scenes is not an array');
	if (!isObject(c.problems) || !Array.isArray(c.problems.items)) {
		throw new Error('problems.items is not an array');
	}
	const clips = (c.journey as { clips?: unknown }).clips;
	if (
		!isObject(clips) ||
		!Array.isArray(clips.scenes) ||
		clips.scenes.length === 0 ||
		!clips.scenes.every((s) => typeof s === 'string')
	) {
		throw new Error('journey.clips.scenes must be a non-empty array of strings');
	}
	return { ...c, customPages: validCustomPages((body as Record<string, unknown>).customPages) };
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

function uniqueIds<T extends { id: string }>(items: T[]): T[] {
	const used = new Set<string>();
	return items.map((it) => {
		let id = it.id;
		for (let n = 2; used.has(id); n++) id = `${it.id}-${n}`;
		used.add(id);
		return { ...it, id };
	});
}

/**
 * Pages created in the CMS. Coerced item by item rather than validated as a whole: one malformed
 * page must cost only that page, never the rest of the site's fresh content.
 */
function validCustomPages(v: unknown): CustomPage[] {
	if (!Array.isArray(v)) return [];
	const out: CustomPage[] = [];
	const seen = new Set<string>();
	for (const p of v) {
		if (!isObject(p)) continue;
		const slug = str(p.slug);
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || seen.has(slug)) continue;
		seen.add(slug);
		const meta = isObject(p.meta) ? p.meta : {};
		const cta = isObject(p.cta) ? p.cta : {};
		const sections = Array.isArray(p.sections) ? p.sections.filter(isObject) : [];
		out.push({
			slug,
			meta: { title: str(meta.title) || str(p.title), description: str(meta.description) },
			eyebrow: str(p.eyebrow),
			title: str(p.title),
			intro: str(p.intro),
			// Ids are the page's anchors AND the render's each-keys, so they are made unique here:
			// a repeated key would throw during hydration and take the site's router down with it.
			sections: uniqueIds(sections.map((s, i) => ({ id: str(s.id) || `section-${i + 1}`, title: str(s.title), body: str(s.body) }))),
			cta: { eyebrow: str(cta.eyebrow), title: str(cta.title), body: str(cta.body), micro: str(cta.micro) }
		});
	}
	return out;
}

/** A JSON object, excluding arrays. */
function isPlainObject(v: unknown): v is Record<string, unknown> {
	return isObject(v) && !Array.isArray(v);
}

/**
 * Fills anything the CMS leaves out from `data/database.json`, the shape every content type
 * is derived from and therefore the contract a payload has to meet. `validateContent` only
 * proves the top level is there, so a payload could drop a subtree — `pages.faq.cta`, say —
 * and still be accepted, leaving a page to read a property off undefined and 500. Missing
 * copy now falls back to the build's own and the rest of the fresh content is kept, on the
 * same reasoning as `withBundledClips`: one gap must cost only that gap.
 *
 * Arrays are taken from the payload whole; the CMS owns how many items a list has.
 */
function withFallbackDefaults(c: SiteContent): SiteContent {
	const filled: string[] = [];
	const fill = (value: unknown, base: unknown, path: string): unknown => {
		if (value === undefined) {
			filled.push(path);
			return base;
		}
		if (!isPlainObject(base) || !isPlainObject(value)) return value;
		const out: Record<string, unknown> = { ...value };
		for (const [k, b] of Object.entries(base)) {
			out[k] = fill(value[k], b, path ? `${path}.${k}` : k);
		}
		return out;
	};
	const out = fill(c, fallback, '') as SiteContent;
	if (filled.length > 0) {
		console.warn(
			`[content] CMS content is missing ${filled.length} value(s); using the build's own for ` +
				`${filled.join(', ')}.`
		);
	}
	return out;
}

/**
 * Clips are bundled into the build, so the CMS cannot introduce new ones. When
 * it names one the build does not have, keep the build's own clip list.
 */
function withBundledClips(c: SiteContent): SiteContent {
	const { hero, scenes } = c.journey.clips;
	const bad = [hero, ...scenes].filter(
		(p) => typeof p !== 'string' || (p.startsWith('/src/') && !hasBundledAsset(p))
	);
	if (bad.length === 0) return c;
	console.warn(
		`[content] CMS names clips this build does not bundle (${bad.join(', ')}); using the bundled clip list.`
	);
	return { ...c, journey: { ...c.journey, clips: fallback.journey.clips } };
}

async function fetchContent(): Promise<void> {
	const cfg = config();
	try {
		const headers: Record<string, string> = {
			authorization: `Bearer ${cfg.token}`,
			accept: 'application/json'
		};
		if (etag) headers['if-none-match'] = etag;
		const res = await fetch(`${cfg.url}/api/platform-content?channel=${cfg.channel}`, {
			headers,
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
		});
		if (res.status === 304) {
			snapshot = { ...snapshot, fetchedAt: new Date().toISOString() };
			freshUntil = Date.now() + cfg.ttlSeconds * 1000;
			lastError = null;
			return;
		}
		if (!res.ok) throw new Error(`CMS responded ${res.status} ${res.statusText}`.trim());
		const body: unknown = await res.json();
		const content = withBundledClips(withFallbackDefaults(validateContent(body)));
		snapshot = { content, source: 'cms', fetchedAt: new Date().toISOString() };
		etag = res.headers.get('etag');
		freshUntil = Date.now() + cfg.ttlSeconds * 1000;
		lastError = null;
	} catch (err) {
		lastError = err instanceof Error ? err.message : String(err);
		freshUntil = Date.now() + Math.min(cfg.ttlSeconds, ERROR_BACKOFF_MAX_S) * 1000;
		console.error(`[content] Could not load content from the CMS: ${lastError}`);
	}
}

function revalidate(): Promise<void> {
	inflight ??= fetchContent().finally(() => {
		inflight = null;
	});
	return inflight;
}

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function get(): Promise<ContentSnapshot> {
	if (!config().configured || Date.now() < freshUntil) return snapshot;
	const pending = revalidate();
	// Cold start: give the CMS a moment rather than serving the fallback, but
	// never hold a request longer than that.
	if (snapshot.source === 'fallback') await Promise.race([pending, wait(COLD_START_WAIT_MS)]);
	return snapshot;
}

/** Fetch now, ignoring the TTL. Waits out any fetch already in flight first, since it may predate the change. */
async function refresh(): Promise<ContentSnapshot> {
	if (!config().configured) return snapshot;
	if (inflight) await inflight;
	await revalidate();
	return snapshot;
}

function invalidate(): void {
	freshUntil = 0;
}

function status() {
	const cfg = config();
	return {
		channel: cfg.channel,
		source: snapshot.source,
		configured: cfg.configured,
		fetchedAt: snapshot.fetchedAt,
		lastError,
		ttlSeconds: cfg.ttlSeconds,
		// Fingerprint of the content file built into this deployment. Not a secret: the CMS
		// compares it with what it last synced, to say "the site has a newer content file".
		sourceSha256
	};
}

export const contentStore = {
	get,
	refresh,
	invalidate,
	status,
	channel: () => config().channel
};

/** True when `header` is `Bearer <CONTENT_API_TOKEN>`. Always false when no token is set. */
export function isAuthorised(header: string | null): boolean {
	const token = (env.CONTENT_API_TOKEN ?? '').trim();
	if (!token || !header?.startsWith('Bearer ')) return false;
	const given = Buffer.from(header.slice('Bearer '.length).trim());
	const expected = Buffer.from(token);
	return given.length === expected.length && timingSafeEqual(given, expected);
}

if (config().configured) void revalidate();
