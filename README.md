# CultureLens Video Journey

SvelteKit 5 + Tailwind CSS site with scroll-scrubbed journey video, plus the Replicate clip generation toolchain.

## Website

```bash
npm install
npm run dev
```

Open the local URL Vite prints. The journey video is served from `static/journey.mp4`.

Replace or re-encode that file for buttery scrubbing:

```bash
ffmpeg -i raw.mp4 -vf scale=1920:-2 -c:v libx264 -g 1 -crf 23 -an -movflags +faststart static/journey.mp4
```

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
