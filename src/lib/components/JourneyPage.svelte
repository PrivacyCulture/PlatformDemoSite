<script lang="ts">
	import { onMount } from 'svelte';
	import AdvanceButton from '$lib/components/AdvanceButton.svelte';
	import Beat from '$lib/components/Beat.svelte';
	import JourneyLoader from '$lib/components/JourneyLoader.svelte';
	import JourneyNav from '$lib/components/JourneyNav.svelte';
	import JourneyProgress from '$lib/components/JourneyProgress.svelte';
	import JourneyVideo from '$lib/components/JourneyVideo.svelte';
	import {
		BEAT_DEFS,
		initialActiveBeats,
		nextBeatProgress,
		type BeatId
	} from '$lib/journey/beats';

	let videoEl = $state<HTMLVideoElement | null>(null);
	let missing = $state(false);
	let scrollP = $state(0);
	let activeBeats = $state(initialActiveBeats());
	let reduced = $state(false);
	let loading = $state(true);
	let loadProgress = $state(0);

	function jumpTo(p: number) {
		if (loading) return;
		const max = document.documentElement.scrollHeight - window.innerHeight;
		window.scrollTo({ top: max * p, behavior: reduced ? 'auto' : 'smooth' });
	}

	function advance() {
		if (loading) return;
		const max = document.documentElement.scrollHeight - window.innerHeight;
		const cur = max > 0 ? window.scrollY / max : 0;
		jumpTo(nextBeatProgress(cur));
	}

	function setLoading(next: boolean) {
		loading = next;
		document.documentElement.classList.toggle('loading', next);
	}

	function bufferedRatio(video: HTMLVideoElement) {
		if (!video.duration || !Number.isFinite(video.duration)) return 0;
		if (!video.buffered.length) return 0;
		let end = 0;
		for (let i = 0; i < video.buffered.length; i++) {
			end = Math.max(end, video.buffered.end(i));
		}
		return Math.min(1, end / video.duration);
	}

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		setLoading(true);

		if (reduced) {
			activeBeats = initialActiveBeats(true);
			loadProgress = 1;
			setLoading(false);
			return;
		}

		let ready = false;
		let hasVideo = false;
		let easedT = 0;
		let lastSet = -1;
		let raf = 0;
		let localScrollP = 0;
		let finished = false;
		let pollId = 0;

		const finishLoading = async () => {
			if (finished) return;
			finished = true;
			ready = true;
			hasVideo = true;
			loadProgress = 1;

			try {
				await videoEl?.play();
				videoEl?.pause();
			} catch {
				/* autoplay may be blocked; scrubbing still works */
			}

			window.setTimeout(() => setLoading(false), 280);
		};

		const updateLoadProgress = () => {
			const video = videoEl;
			if (!video || finished) return;

			const buffered = bufferedRatio(video);
			const stateBoost = Math.min(1, video.readyState / 4);
			loadProgress = Math.max(loadProgress, buffered * 0.85 + stateBoost * 0.15);

			const enoughBuffered = buffered >= 0.35 || video.readyState >= 3;
			if (video.duration && enoughBuffered) {
				void finishLoading();
			}
		};

		const onScroll = () => {
			if (loading && !finished) return;
			const max = document.documentElement.scrollHeight - window.innerHeight;
			localScrollP = max > 0 ? window.scrollY / max : 0;
			localScrollP = Math.min(1, Math.max(0, localScrollP));
			scrollP = localScrollP;

			const next = {} as Record<BeatId, boolean>;
			for (const beat of BEAT_DEFS) {
				next[beat.id] = localScrollP >= beat.from && localScrollP <= beat.to;
			}
			activeBeats = next;
		};

		const frame = () => {
			const video = videoEl;
			if (ready && hasVideo && video && video.duration && video.readyState >= 2) {
				const dur = Math.max(0.001, video.duration - 0.05);
				const target = localScrollP * dur;
				easedT += (target - easedT) * 0.12;

				const shouldSeek =
					!video.seeking &&
					(lastSet < 0 || Math.abs(lastSet - easedT) > 1 / 30) &&
					Math.abs(video.currentTime - easedT) > 0.02;

				if (shouldSeek) {
					const clamped = Math.min(dur, Math.max(0, easedT));
					video.currentTime = clamped;
					lastSet = clamped;
				}
			}
			raf = requestAnimationFrame(frame);
		};

		const onMeta = () => {
			loadProgress = Math.max(loadProgress, 0.12);
			updateLoadProgress();
		};

		const onProgress = () => updateLoadProgress();
		const onCanPlay = () => updateLoadProgress();
		const onCanPlayThrough = () => {
			loadProgress = Math.max(loadProgress, 0.95);
			void finishLoading();
		};

		window.addEventListener('scroll', onScroll, { passive: true });

		const attach = () => {
			const video = videoEl;
			if (!video) return;

			video.addEventListener('loadedmetadata', onMeta);
			video.addEventListener('progress', onProgress);
			video.addEventListener('canplay', onCanPlay);
			video.addEventListener('canplaythrough', onCanPlayThrough);

			if (video.readyState >= 1) onMeta();
			updateLoadProgress();
		};

		attach();
		pollId = window.setInterval(updateLoadProgress, 200);

		// Don't trap visitors forever on slow connections.
		const timeout = window.setTimeout(() => {
			if (!finished) void finishLoading();
		}, 20000);

		onScroll();
		raf = requestAnimationFrame(frame);

		return () => {
			window.clearInterval(pollId);
			window.clearTimeout(timeout);
			window.removeEventListener('scroll', onScroll);
			videoEl?.removeEventListener('loadedmetadata', onMeta);
			videoEl?.removeEventListener('progress', onProgress);
			videoEl?.removeEventListener('canplay', onCanPlay);
			videoEl?.removeEventListener('canplaythrough', onCanPlayThrough);
			cancelAnimationFrame(raf);
			document.documentElement.classList.remove('loading');
		};
	});

	$effect(() => {
		if (missing && loading) {
			loadProgress = 1;
			document.documentElement.classList.remove('loading');
			loading = false;
		}
	});
</script>

<JourneyLoader progress={loadProgress} visible={loading} />
<JourneyVideo bind:videoEl bind:missing />
<div id="scrim"></div>

{#if !loading}
	<JourneyNav onJump={jumpTo} />
	<JourneyProgress progress={scrollP} />

	<Beat id="beat-hero" active={activeBeats['beat-hero']} label="Introduction">
	<div class="mb-5 text-xs tracking-[0.28em] text-lens uppercase">The privacy platform</div>
	<h1
		class="text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.02] font-semibold tracking-tight [text-shadow:0_2px_30px_rgba(4,6,10,0.6)]"
	>
		From clutter<br />to <em class="font-medium text-lens not-italic">clarity</em>
	</h1>
	<p
		class="mx-auto mt-5 max-w-[44ch] text-[17px] leading-relaxed font-light text-bone-dim [text-shadow:0_1px_16px_rgba(4,6,10,0.7)]"
	>
		You can't fix what you can't see. Move forward and watch the noise your business lives in resolve
		into a clear picture.
	</p>
	<button
		type="button"
		onclick={advance}
		aria-label="Move to the next section"
		class="hint mx-auto mt-6 flex cursor-pointer items-center justify-center gap-2.5 rounded border-0 bg-transparent text-xs tracking-[0.22em] text-bone-dim uppercase transition-colors hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
	>
		<span class="dot relative h-2.5 w-1.5 rounded-md border border-bone-dim" aria-hidden="true"
		></span>
		Scroll to move forward
	</button>
</Beat>

<!-- The clutter: five blind spots that fly past on the way through -->

<Beat
	id="beat-clutter-1"
	active={activeBeats['beat-clutter-1']}
	label="Blind spot: what people know"
	class="clutter from-left"
	style="top:42%"
>
	<div class="mb-3 text-[11px] tracking-[0.28em] text-ember uppercase">The noise</div>
	<p
		class="text-[clamp(1.6rem,4.4vw,3rem)] leading-[1.1] font-semibold tracking-tight [text-shadow:0_2px_24px_rgba(4,6,10,0.75)]"
	>
		No real idea what your<br />people actually <em class="text-ember not-italic">know</em>.
	</p>
	<AdvanceButton class="mt-5" label="Next section" onclick={advance} />
</Beat>

<Beat
	id="beat-clutter-2"
	active={activeBeats['beat-clutter-2']}
	label="Blind spot: breach impact"
	class="clutter from-right"
	style="top:58%"
>
	<div class="mb-3 text-[11px] tracking-[0.28em] text-ember uppercase">The noise</div>
	<p
		class="text-[clamp(1.6rem,4.4vw,3rem)] leading-[1.1] font-semibold tracking-tight [text-shadow:0_2px_24px_rgba(4,6,10,0.75)]"
	>
		No idea how badly a<br />breach would actually <em class="text-ember not-italic">hurt</em>.
	</p>
	<AdvanceButton class="mt-5 ml-auto" label="Next section" onclick={advance} />
</Beat>

<Beat
	id="beat-clutter-3"
	active={activeBeats['beat-clutter-3']}
	label="Blind spot: unchecked AI tools"
	class="clutter from-left"
	style="top:38%"
>
	<div class="mb-3 text-[11px] tracking-[0.28em] text-ember uppercase">The noise</div>
	<p
		class="text-[clamp(1.6rem,4.4vw,3rem)] leading-[1.1] font-semibold tracking-tight [text-shadow:0_2px_24px_rgba(4,6,10,0.75)]"
	>
		A new AI tool went live.<br /><em class="text-ember not-italic">Nobody checked it.</em>
	</p>
	<AdvanceButton class="mt-5" label="Next section" onclick={advance} />
</Beat>

<Beat
	id="beat-clutter-4"
	active={activeBeats['beat-clutter-4']}
	label="Blind spot: unchecked suppliers"
	class="clutter from-right"
	style="top:60%"
>
	<div class="mb-3 text-[11px] tracking-[0.28em] text-ember uppercase">The noise</div>
	<p
		class="text-[clamp(1.6rem,4.4vw,3rem)] leading-[1.1] font-semibold tracking-tight [text-shadow:0_2px_24px_rgba(4,6,10,0.75)]"
	>
		You signed the supplier.<br /><em class="text-ember not-italic">Nobody checked their privacy.</em>
	</p>
	<AdvanceButton class="mt-5 ml-auto" label="Next section" onclick={advance} />
</Beat>

<Beat
	id="beat-clutter-5"
	active={activeBeats['beat-clutter-5']}
	label="Blind spot: no single view"
	class="clutter from-left"
	style="top:50%"
>
	<div class="mb-3 text-[11px] tracking-[0.28em] text-ember uppercase">And underneath it all</div>
	<p
		class="text-[clamp(1.7rem,4.8vw,3.2rem)] leading-[1.1] font-semibold tracking-tight [text-shadow:0_2px_24px_rgba(4,6,10,0.75)]"
	>
		It's all in ten places<br />and <em class="text-ember not-italic">one person's head</em>.
	</p>
	<AdvanceButton class="mt-5" label="Next: CultureLens" onclick={advance} />
</Beat>

<Beat id="beat-free" active={activeBeats['beat-free']} label="CultureLens free">
	<div class="mb-5 text-xs tracking-[0.28em] text-lens uppercase">Act one · CultureLens</div>
	<h2
		class="text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.02] font-semibold tracking-tight [text-shadow:0_2px_30px_rgba(4,6,10,0.6)]"
	>
		See your culture.<br /><em class="font-medium text-lens not-italic">Free. Forever.</em>
	</h2>
	<p
		class="mx-auto mt-5 max-w-[44ch] text-[17px] leading-relaxed font-light text-bone-dim [text-shadow:0_1px_16px_rgba(4,6,10,0.7)]"
	>
		A real, effective culture survey with clear highlights of what your business needs. No credit
		card. No trial clock. No catch waiting at the end.
	</p>
	<div class="mt-7 flex flex-wrap justify-center gap-3.5">
		<a
			class="inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-bone/35 bg-ink/45 px-6 py-3.5 text-sm font-medium tracking-wide text-bone no-underline backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
			href="#signup"
		>
			Create your free login
		</a>
	</div>
	<AdvanceButton class="mx-auto mt-7" label="Next: pass through the lens" onclick={advance} />
</Beat>

<Beat
	id="beat-lens"
	active={activeBeats['beat-lens']}
	label="Through the lens"
	class="w-full max-w-3xl px-6 text-center"
>
	<div class="mb-5 text-xs tracking-[0.28em] text-lens uppercase">Pass through the lens</div>
	<h2
		class="text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.02] font-semibold tracking-tight [text-shadow:0_2px_30px_rgba(4,6,10,0.6)]"
	>
		Everything looks different<br />from <em class="font-medium text-lens not-italic">here</em>
	</h2>
	<AdvanceButton class="mx-auto mt-7" label="Next: the platform" onclick={advance} />
</Beat>

<Beat id="beat-platform" active={activeBeats['beat-platform']} label="The platform">
	<div class="mb-5 text-xs tracking-[0.28em] text-lens uppercase">Act two · The platform</div>
	<h2
		class="text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.02] font-semibold tracking-tight [text-shadow:0_2px_30px_rgba(4,6,10,0.6)]"
	>
		Clarity you<br />can <em class="font-medium text-lens not-italic">see</em>
	</h2>
	<p
		class="mx-auto mt-5 max-w-[44ch] text-[17px] leading-relaxed font-light text-bone-dim [text-shadow:0_1px_16px_rgba(4,6,10,0.7)]"
	>
		Dashboards, diagrams and visual screens — not walls of tables and forms. Your privacy posture,
		mapped so anyone in the room understands it in seconds.
	</p>
	<AdvanceButton class="mx-auto mt-7" label="Next: three ways in" onclick={advance} />
</Beat>

<Beat
	id="beat-doors"
	active={activeBeats['beat-doors']}
	label="Three ways in"
	class="w-full max-w-4xl px-6 text-center"
>
	<div class="mb-5 text-xs tracking-[0.28em] text-lens uppercase">You've arrived</div>
	<h2
		class="text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.02] font-semibold tracking-tight [text-shadow:0_2px_30px_rgba(4,6,10,0.6)]"
	>
		Three ways <em class="font-medium text-lens not-italic">in</em>
	</h2>
	<p
		class="mx-auto mt-5 max-w-[44ch] text-[17px] leading-relaxed font-light text-bone-dim [text-shadow:0_1px_16px_rgba(4,6,10,0.7)]"
	>
		Start free, play with a full sandbox, or talk to us properly. Pick your door.
	</p>
	<div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
		<a
			id="signup"
			class="door block cursor-pointer rounded-[18px] border border-bone/15 bg-ink/65 p-6 text-left text-bone no-underline backdrop-blur-md transition-all hover:-translate-y-1.5 hover:border-lens focus-visible:-translate-y-1.5 focus-visible:border-lens focus-visible:outline-none"
			href="#signup"
		>
			<div class="mb-3 text-[11px] tracking-[0.24em] text-lens uppercase">Free</div>
			<h3 class="mb-2.5 text-[23px] leading-tight font-semibold">CultureLens login</h3>
			<p class="m-0 text-[13.5px] leading-relaxed font-light text-bone-dim">
				Run your first culture survey today. Free forever, no credit card.
			</p>
			<span class="mt-4 inline-flex items-center gap-2 text-[13px] text-lens">Create login →</span>
		</a>
		<a
			class="door block cursor-pointer rounded-[18px] border border-lens/55 bg-ink/65 p-6 text-left text-bone no-underline backdrop-blur-md transition-all hover:-translate-y-1.5 hover:border-lens focus-visible:-translate-y-1.5 focus-visible:border-lens focus-visible:outline-none"
			href="#sandbox"
		>
			<div class="mb-3 text-[11px] tracking-[0.24em] text-lens uppercase">Explore</div>
			<h3 class="mb-2.5 text-[23px] leading-tight font-semibold">Platform sandbox</h3>
			<p class="m-0 text-[13.5px] leading-relaxed font-light text-bone-dim">
				A data-filled demo environment. Open real reports, dashboards and diagrams — play freely.
			</p>
			<span class="mt-4 inline-flex items-center gap-2 text-[13px] text-lens">Enter sandbox →</span>
		</a>
		<a
			class="door block cursor-pointer rounded-[18px] border border-bone/15 bg-ink/65 p-6 text-left text-bone no-underline backdrop-blur-md transition-all hover:-translate-y-1.5 hover:border-lens focus-visible:-translate-y-1.5 focus-visible:border-lens focus-visible:outline-none"
			href="#demo"
		>
			<div class="mb-3 text-[11px] tracking-[0.24em] text-lens uppercase">Enterprise</div>
			<h3 class="mb-2.5 text-[23px] leading-tight font-semibold">One-to-one demo</h3>
			<p class="m-0 text-[13.5px] leading-relaxed font-light text-bone-dim">
				A guided walkthrough plus the conversation about our service wrapper around the platform.
			</p>
			<span class="mt-4 inline-flex items-center gap-2 text-[13px] text-lens">Book a demo →</span>
		</a>
	</div>
</Beat>

{/if}

<div id="scroll-space" aria-hidden="true"></div>
