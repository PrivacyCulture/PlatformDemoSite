// A chapter file for the chapter player, read on the server and handed to the browser same-origin.
//
// Sorted stores the file in its public media container, which a browser's fetch cannot read across
// origins (no CORS on the storage account) — a <video> or <img> needs no CORS, a fetch does. So the
// browser asks here and this reads it. Only an address the site's OWN content names as a `chapters`
// field is read, so this cannot be used to fetch anything else.
//
// GET /api/explainer-chapters?url=<the chapters field's value> → { duration, chapters: PlayerChapter[] }
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { normaliseChapters } from '$lib/site/chapter-player';

const TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { body: unknown; at: number }>();
const named = new WeakMap<object, Set<string>>();

/** Every `chapters` value in the content, found once per content snapshot. */
function chapterUrlsIn(content: unknown): Set<string> {
	if (!content || typeof content !== 'object') return new Set();
	const hit = named.get(content as object);
	if (hit) return hit;
	const out = new Set<string>();
	const walk = (v: unknown, depth: number) => {
		if (!v || typeof v !== 'object' || depth > 12) return;
		if (Array.isArray(v)) return v.forEach((x) => walk(x, depth + 1));
		for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
			if (k === 'chapters' && typeof x === 'string' && x.trim()) out.add(x.trim());
			else walk(x, depth + 1);
		}
	};
	walk(content, 0);
	named.set(content as object, out);
	return out;
}

async function readChapterFile(url: string): Promise<unknown> {
	if (/^https:\/\//i.test(url)) {
		const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
		return res.ok ? await res.json() : null;
	}
	if (!url.startsWith('/') || url.startsWith('//') || url.includes('..')) return null;
	// Where the static files are: `static/` under vite dev, `build/client/` under adapter-node.
	for (const dir of ['static', join('build', 'client')]) {
		try {
			return JSON.parse(await readFile(join(process.cwd(), dir, url), 'utf8'));
		} catch {
			/* try the next */
		}
	}
	return null;
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const target = (url.searchParams.get('url') ?? '').trim();
	if (!target || !chapterUrlsIn(locals.content).has(target)) return json({ error: 'Unknown chapter file.' }, { status: 404 });
	const hit = cache.get(target);
	if (hit && Date.now() - hit.at < TTL_MS) return json(hit.body, { headers: { 'cache-control': 'public, max-age=300' } });
	let raw: unknown = null;
	try {
		raw = await readChapterFile(target);
	} catch {
		raw = null;
	}
	if (!raw) return json({ error: 'The chapter file could not be read.' }, { status: 502 });
	const duration = raw && typeof raw === 'object' && !Array.isArray(raw) ? Number((raw as { duration?: unknown }).duration) || 0 : 0;
	const body = { duration, chapters: normaliseChapters(raw, duration || null) };
	cache.set(target, { body, at: Date.now() });
	return json(body, { headers: { 'cache-control': 'public, max-age=300' } });
};
