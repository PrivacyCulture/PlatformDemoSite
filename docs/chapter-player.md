# Chapter player

A full-screen, chaptered explainer player: one film split into chapters, letterboxed on ink, with a
slim control bar and a progress bar in one segment per chapter.

| File | What it is |
|---|---|
| `src/lib/components/site/ChapterPlayer.svelte` | The player |
| `src/lib/site/chapter-player.ts` | Its rules, pure: reading chapters, current chapter, segment widths, times, previous/next, auto-hide |
| `src/routes/api/explainer-chapters/+server.ts` | Serves a chapter file named in the site's content, same-origin |
| `src/routes/chapter-player-demo/` | The demo page (404 on the live site) |
| `static/demo/chapter-player/` | The demo's placeholder film, chapters, thumbnails and captions |
| `scripts/test-chapter-player.ts` | Tests: `npx tsx scripts/test-chapter-player.ts` |

The `<video>` element's `currentTime` is the only source of truth. The current chapter, each
segment's fill, the numbered circles, the title, the time and the toast are all derived from it, so
nothing on screen can disagree with the picture.

## Where it is used

An explainer (`ExplainerVideo.svelte`) whose content carries a `chapters` file opens this player
instead of playing inline. In the CMS, choose a film from Sorted's Explainer Studio for a page's
explainer video (or the default in Site globals): Sorted copies the film into the media library,
makes a still per chapter and writes the chapter file, then fills the video, thumbnail, chapters,
length and date fields. Without a `chapters` value the explainer plays inline exactly as before.

A page edited in Sorted's page builder carries the same choice on its hero block (`data.chapters`), and
`applyBlockPages` (`src/lib/site/block-pages.ts`) writes it onto the page's `explainer.chapters` — and
clears it when the hero's video has no chapter file. Deploy this before Sorted, or a block page's
chapters are dropped on the way to the page (it still plays, inline).

The chapter file is on Azure blob storage, which a browser `fetch` cannot read across origins, so the
player reads it through `/api/explainer-chapters?url=…`. That route only serves an address the
site's own content names in a `chapters` field.

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `src` | string | — | The film |
| `chapters` | chapter file object or list | — | Chapters as data. Wins over `chaptersUrl` |
| `chaptersUrl` | string | `''` | A same-origin address answering with a chapter file |
| `poster` | string | `''` | Shown before the film starts |
| `captions` | string | `''` | A WebVTT file. Blank hides the captions button |
| `captionsLang`, `captionsLabel` | string | `en`, `English` | For the captions track |
| `title` | string | `Explainer video` | The dialog's accessible name |
| `autoplay` | boolean | `true` | Start on open. If the browser refuses, the paused screen shows |
| `startAt` | number | `0` | Seconds to start from |
| `contained` | boolean | `false` | Fill the parent box instead of the viewport (the demo frames) |
| `fullscreen` | boolean | `true` | Ask for real full screen on open (ignored when `contained`) |
| `onclose` | `() => void` | | Exit button, Escape, or leaving full screen |
| `onchapterchange` | `(detail) => void` | | See events |
| `onplay`, `onpause` | `() => void` | | See events |

With no chapters at all, the whole film is one chapter titled with `title`.

## Events

Each is a callback prop and also a `CustomEvent` that bubbles from the player's root element, for
code outside Svelte.

| Event | Detail | When |
|---|---|---|
| `chapterchange` | `{ index, chapter, previous }` | The current chapter changes — by playing on, seeking or jumping. Not on the first chapter shown |
| `play` | — | The film starts or resumes |
| `pause` | — | The film pauses (including at the end) |

## Keyboard

With focus anywhere in the player:

| Key | Does |
|---|---|
| Space, K | Play / pause (Space on a focused button presses that button) |
| ← / → | Back / forward 5 seconds |
| J / L | Back / forward 10 seconds |
| Shift+← / Shift+→, P / N, Page Up / Page Down | Previous / next chapter. Previous more than 3s into a chapter restarts it |
| 1–9, 0 | Chapters 1–9, and 10 |
| Home / End | Start of the film / start of the last chapter |
| C | Captions on / off |
| M | Mute |
| Esc | Close the preview card, else close the player |

Every control is a real `<button>` with an `aria-label`. The progress bar is a native range input
(`aria-label="Seek"`, its value read as "1:05 of 5:12, chapter 3: …"). The numbered circles are an
ordered list; the current one has `aria-current="step"`. Chapter changes are announced through a
polite live region.

## Touch

A tap on the picture shows or hides the controls (a click plays or pauses with a mouse). A tap on a
numbered circle jumps to that chapter; tap and hold (`--cp-hold-delay`) opens a preview card with
the chapter's still, title and a Play button instead.

## Tokens

All set on `.cp` and overridable by a page. Times are read once on open.

| Token | Default | |
|---|---|---|
| `--cp-bg` | `--color-ink` (#0b1220) | Background and letterbox |
| `--cp-fg`, `--cp-fg-dim` | `--color-bone`, `--color-bone-dim` | Text and icons |
| `--cp-accent` | `--color-lens` (#009bcc) | Progress, current chapter |
| `--cp-focus` | `--color-gold` (#d4af6a) | Focus outline |
| `--cp-track`, `--cp-track-hot`, `--cp-done` | translucent bone | Unplayed segment, hovered segment, chapters already watched |
| `--cp-scrim`, `--cp-surface`, `--cp-surface-border`, `--cp-btn-hover` | | Bar gradient, tooltip/toast/card surfaces |
| `--cp-progress-height` | `3px` | The visible bar |
| `--cp-progress-hit` | `20px` | Its pointer target |
| `--cp-segment-gap` | `2px` | Between segments |
| `--cp-strip-height` | `64px` (`52px` ≤ 900px wide) | The control bar |
| `--cp-strip-pad-x` | `20px` (`14px`) | |
| `--cp-btn-size`, `--cp-icon-size` | `40px`, `22px` (`36px`, `20px`) | |
| `--cp-dot-size`, `--cp-dot-gap`, `--cp-dot-font` | `26px`, `8px`, `11px` (`22px`, `6px`, `10px`) | Chapter circles |
| `--cp-bigplay-size` | `88px` (`72px`) | Paused-state play button |
| `--cp-tip-width`, `--cp-preview-width`, `--cp-radius` | `224px`, `320px`, `10px` | Tooltip, phone card |
| `--cp-fade` | `200ms` | Every transition |
| `--cp-autohide-delay` | `3s` | Controls hide this long after the last activity, while playing |
| `--cp-toast-duration` | `2.4s` | Chapter-change toast |
| `--cp-hold-delay` | `450ms` | Tap-and-hold for the preview card |

`prefers-reduced-motion: reduce` removes every transition and animation: controls, toast and
tooltips show and hide instantly.

## Chapter file

Written by Sorted (`src/lib/explainer-chapters.ts` in pcl-abm — keep the two in step):

```json
{
  "version": 1,
  "duration": 70,
  "chapters": [
    { "title": "Why privacy culture matters", "start": 0, "end": 6, "thumbnail": "/demo/chapter-player/thumb-1.jpg" }
  ]
}
```

`normaliseChapters` also takes a bare list. `end` is optional (the next start, or the film's length);
starts are sorted, a frame-apart duplicate is merged, anything unreadable is dropped, a thumbnail
must be site-relative or `https:`, and at most 40 chapters are kept. Once the video has loaded,
`fitToDuration` closes the last chapter at the film's real length.

## Auto-hide

Controls show on any pointer move, tap or key, and hide `--cp-autohide-delay` after the last one —
only while playing. They never hide while paused, while the pointer is over the bar, while a
control has keyboard focus, while the seek bar is being dragged, or while the phone preview card is
open. The cursor hides with them.

## Demo

`/chapter-player-demo` on the dev site (404 on live): the placeholder film in a 1920×1080 frame
(scaled to fit, laid out at full size), in an 844×390 phone frame, and full screen. An event log
shows `chapterchange`, `play` and `pause`.
