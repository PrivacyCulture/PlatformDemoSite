# CultureLens Video Journey

SvelteKit 5 + Tailwind CSS site with scroll-scrubbed journey video, plus the Replicate clip generation toolchain.

## Website

```bash
npm install
npm run dev
```

Open the local URL Vite prints.

### Copy and assets

Every piece of text on the site, and every image, video and brand asset URL, is served by the CMS at run time (see **Content (CMS)** below), with `data/database.json` as the fallback and the shape the types are derived from. Pages and components read it through `src/lib/content/index.ts` (which adds the TypeScript types) rather than carrying their own strings. To change wording, a screenshot, alt text or a link, edit it in the CMS (or the JSON when running without one); no component needs touching.

Content paths that start with `/src/lib/assets/` are bundled by Vite (fingerprinted, immutable cache) via `src/lib/content/assets.ts`. Every other path is served straight from `static/`.

### Content (CMS)

With `CONTENT_API_URL` and `CONTENT_API_TOKEN` set, the server fetches content from `GET {CONTENT_API_URL}/api/platform-content?channel=…` (Bearer token, ETag-revalidated) and caches it for `CONTENT_CACHE_SECONDS` (300 live, 5 draft by default). Unset, it runs from `data/database.json`. A response that fails validation never replaces the last good content. Pages render per request, so nothing is prerendered.

Deploy as two Railway services from the same repo:

- **live** — `CONTENT_CHANNEL=live`, the public site.
- **preview** — `CONTENT_CHANNEL=draft`, unpublished content, sent with `cache-control: no-store`.

Both need `CONTENT_API_URL`, `CONTENT_API_TOKEN` and `ORIGIN` (their own public URL).

Endpoints:

- `POST /api/content/refresh` — the CMS calls this with `Authorization: Bearer <CONTENT_API_TOKEN>` and `{ channel, reason, docKey? }` when content changes; returns `{ ok, channel, fetchedAt, source }`. 401 on a bad token, 409 when `channel` is not the one this service serves.
- `GET /api/content/source` — the CMS calls this with the same Bearer token to **sync** the content file this build was deployed with (`data/database.json`), so a change made in this repository reaches Sorted without anyone downloading and uploading a file. Returns the file as JSON with an `x-content-sha256` header.
- `GET /api/content/status` — unauthenticated health read: `{ channel, source, configured, fetchedAt, lastError, ttlSeconds, sourceSha256 }`. `sourceSha256` fingerprints the built-in content file (sha256 of `JSON.stringify` of it — the same rule Sorted uses), so Sorted can say when a deploy has brought a file it has not synced.

### Journey clips

Scene clips live in `src/lib/assets/clips/Mountain/` (`start.mp4` = hero loop, `shot-2.mp4` … `shot-8.mp4` = scenes) and are listed in the content under `journey.clips`. Because clips are bundled at build time, the CMS cannot add new ones: if it names a clip this build does not have, the site keeps the build's own clip list. They are imported rather than served from `static/` so Vite fingerprints the URLs and they ship with a one-year immutable cache header. To replace a clip, overwrite the file with the same name.

Encode scene clips from the masters with a short GOP (cheap seeks for reverse scrub), no B-frames, no audio, and the `moov` atom up front:

```bash
ffmpeg -i master.mp4 -an -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
  -g 12 -keyint_min 12 -sc_threshold 0 -bf 0 -movflags +faststart shot-5.mp4
```

The hero loop (`start.mp4`) is never scrubbed, so a normal GOP is fine:

```bash
ffmpeg -i master.mp4 -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
  -g 48 -movflags +faststart start.mp4
```

Target roughly 3 Mbps at 1280×720 (about 2 MB per 5 s clip).

## Video tooling (Replicate)

Generate 5–10s AI video clips on Replicate from `videoai.shots.json`, stitch them, then re-encode an all-keyframe MP4.

### Prereqs

- Node.js 20+
- `ffmpeg` on PATH
- A Replicate API token and model version that returns an MP4

### Setup

```bash
cp .env.example .env
```

Set `REPLICATE_API_TOKEN` and `REPLICATE_MODEL` (`owner/name:version`).

### Commands

```bash
npm run generate      # output/clips/01-….mp4 …
npm run stitch        # output/master.mp4
npm run encode:scrub  # output/master.scrub.mp4
```
