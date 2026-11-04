<!--
	The chapter player, on a placeholder film (static/demo/chapter-player/), at the two sizes it is
	designed for: a 1920×1080 desktop (drawn scaled to fit this column, laid out at full size) and a
	844×390 phone held landscape (drawn at its real size). "Open full screen" opens the real thing.
-->
<script lang="ts">
	import ChapterPlayer from '$lib/components/site/ChapterPlayer.svelte';

	const SRC = '/demo/chapter-player/placeholder.mp4';
	const POSTER = '/demo/chapter-player/poster.jpg';
	const CAPTIONS = '/demo/chapter-player/captions.vtt';
	const CHAPTERS = '/demo/chapter-player/chapters.json';

	let full = $state(false);
	let deskWidth = $state(960);
	const deskScale = $derived(Math.min(1, deskWidth / 1920));
	let resets = $state({ desk: 0, phone: 0 });
	let log = $state<string[]>([]);
	function note(line: string) {
		log = [`${new Date().toLocaleTimeString('en-GB')}  ${line}`, ...log].slice(0, 12);
	}
</script>

<svelte:head>
	<title>Chapter player demo</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="demo">
	<header class="head">
		<h1>Chapter player</h1>
		<p>A placeholder film of ten chapters of different lengths. Hover or focus a numbered circle for its preview; on a phone, tap and hold. Keyboard: Space plays, ← → move 5s, Shift+← → or P/N change chapter, 1–9 and 0 jump to a chapter, C captions, Esc closes.</p>
		<button type="button" class="open" onclick={() => (full = true)}>Open full screen</button>
	</header>

	<section>
		<h2>Desktop · 1920 × 1080</h2>
		<div class="desk" bind:clientWidth={deskWidth} style:height={`${1080 * deskScale}px`}>
			<div class="frame" style:width="1920px" style:height="1080px" style:transform={`scale(${deskScale})`}>
				{#key resets.desk}
					<ChapterPlayer
						contained
						autoplay={false}
						src={SRC}
						poster={POSTER}
						captions={CAPTIONS}
						chaptersUrl={CHAPTERS}
						title="Placeholder explainer"
						onclose={() => (resets.desk += 1)}
						onchapterchange={(d) => note(`desktop · chapterchange → ${d.index + 1} ${d.chapter.title}`)}
						onplay={() => note('desktop · play')}
						onpause={() => note('desktop · pause')}
					/>
				{/key}
			</div>
		</div>
	</section>

	<section>
		<h2>Phone landscape · 844 × 390</h2>
		<div class="phone">
			{#key resets.phone}
				<ChapterPlayer
					contained
					autoplay={false}
					src={SRC}
					poster={POSTER}
					captions={CAPTIONS}
					chaptersUrl={CHAPTERS}
					title="Placeholder explainer"
					onclose={() => (resets.phone += 1)}
					onchapterchange={(d) => note(`phone · chapterchange → ${d.index + 1} ${d.chapter.title}`)}
					onplay={() => note('phone · play')}
					onpause={() => note('phone · pause')}
				/>
			{/key}
		</div>
	</section>

	<section>
		<h2>Events</h2>
		<ol class="log">
			{#each log as line, i (i)}<li>{line}</li>{:else}<li class="muted">Nothing yet — play a film.</li>{/each}
		</ol>
	</section>
</main>

{#if full}
	<ChapterPlayer
		src={SRC}
		poster={POSTER}
		captions={CAPTIONS}
		chaptersUrl={CHAPTERS}
		title="Placeholder explainer"
		onclose={() => (full = false)}
		onchapterchange={(d) => note(`full screen · chapterchange → ${d.index + 1} ${d.chapter.title}`)}
		onplay={() => note('full screen · play')}
		onpause={() => note('full screen · pause')}
	/>
{/if}

<style>
	.demo {
		padding: 32px clamp(16px, 4vw, 48px) 64px;
		background: #f2f4f8;
		min-height: 100vh;
		color: #0b1220;
		display: flex;
		flex-direction: column;
		gap: 32px;
	}
	.head h1 {
		margin: 0;
		font-size: 28px;
		font-weight: 700;
	}
	.head p {
		max-width: 60rem;
		color: #3a4255;
	}
	h2 {
		margin: 0 0 12px;
		font-size: 15px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #263d86;
	}
	.open {
		min-height: 40px;
		padding: 0 18px;
		border: 0;
		border-radius: 999px;
		background: #263d86;
		color: #fff;
		font: 600 14px inherit;
		cursor: pointer;
	}
	.open:focus-visible {
		outline: 2px solid #d4af6a;
		outline-offset: 2px;
	}
	.desk {
		position: relative;
		width: 100%;
		overflow: hidden;
		border-radius: 12px;
		box-shadow: 0 8px 24px rgba(11, 18, 32, 0.15);
	}
	.frame {
		position: absolute;
		left: 0;
		top: 0;
		transform-origin: 0 0;
	}
	.phone {
		position: relative;
		width: 844px;
		max-width: 100%;
		height: 390px;
		overflow: hidden;
		border-radius: 28px;
		border: 10px solid #1b2232;
		box-sizing: content-box;
	}
	.log {
		margin: 0;
		padding: 12px 16px;
		background: #fff;
		border-radius: 12px;
		font: 12px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace;
		list-style: none;
	}
	.muted {
		color: #6b7280;
	}
</style>
