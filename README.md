# CultureLens Video Journey

SvelteKit 5 + Tailwind CSS site with scroll-scrubbed journey video, plus the Replicate clip generation toolchain.

## Website

```bash
npm install
npm run dev
```

Open the local URL Vite prints.

### Journey clips

Scene clips live in `src/lib/assets/clips/Mountain/` (`start.mp4` = hero loop, `shot-2.mp4` … `shot-8.mp4` = scenes) and are listed in `src/lib/journey/videos.ts`. They are imported rather than served from `static/` so Vite fingerprints the URLs and they ship with a one-year immutable cache header. To replace a clip, overwrite the file with the same name.

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
