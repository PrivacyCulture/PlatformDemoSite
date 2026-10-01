// The words of the default explainer's captions, for the VideoObject's `transcript`. A captions
// file is site-relative (served from static/) or an absolute Platform media URL; either is read
// once and kept for an hour, so a page costs nothing after the first.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { vttTranscript } from '$lib/site/schema';

const TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { text: string; at: number }>();

async function readVtt(url: string): Promise<string> {
	if (/^https?:\/\//i.test(url)) {
		const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
		return res.ok ? await res.text() : '';
	}
	if (!url.startsWith('/') || url.startsWith('//') || url.includes('..')) return '';
	// Where the static files are: `static/` under vite dev, `build/client/` under adapter-node.
	for (const dir of ['static', join('build', 'client')]) {
		try {
			return await readFile(join(process.cwd(), dir, url), 'utf8');
		} catch {
			/* try the next */
		}
	}
	return '';
}

/** Plain transcript text, or '' when there is no captions file or it cannot be read. */
export async function transcriptFor(captionsUrl: string | null | undefined): Promise<string> {
	const url = (captionsUrl ?? '').trim();
	if (!url) return '';
	const hit = cache.get(url);
	if (hit && Date.now() - hit.at < TTL_MS) return hit.text;
	let text = '';
	try {
		text = vttTranscript(await readVtt(url));
	} catch {
		text = '';
	}
	cache.set(url, { text, at: Date.now() });
	return text;
}
