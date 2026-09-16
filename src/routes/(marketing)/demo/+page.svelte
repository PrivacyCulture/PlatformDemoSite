<script lang="ts">
	import { onMount } from 'svelte';
	import BookDemoCalendar from '$lib/components/BookDemoCalendar.svelte';
	import BookDemoForm from '$lib/components/BookDemoForm.svelte';
	import { emptyDemoForm, type DemoFormValues } from '$lib/demo/fields';
	import { captureUtmsFromLocation } from '$lib/demo/utm';
	import { site } from '$lib/site/content';

	type Step = 'qualify' | 'calendar' | 'confirm';

	let step = $state<Step>('qualify');
	let form = $state<DemoFormValues>(emptyDemoForm());
	let formEpoch = $state(0);
	let confirmation = $state<{
		start: string;
		end: string;
		timezone: string;
		isOffline: boolean;
	} | null>(null);

	onMount(() => {
		captureUtmsFromLocation();
	});

	function formatWhen(iso: string, tz: string) {
		return new Intl.DateTimeFormat(undefined, {
			timeZone: tz,
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			timeZoneName: 'short'
		}).format(new Date(iso));
	}

	const stepLabel = $derived(
		step === 'qualify' ? 'A few details' : step === 'calendar' ? 'Pick a time' : 'You’re booked'
	);
</script>

<svelte:head>
	<title>Book a conversation — {site.brand}</title>
	<meta
		name="description"
		content="Twenty-five minutes to see how privacy work can look when everything’s connected. Book a time that suits you."
	/>
</svelte:head>

<!-- One composition: brand + one idea + one sentence. Form is the action below. -->
<section class="demo-hero relative w-full pt-4 sm:pt-8">
	<p
		class="demo-reveal mb-5 text-[13px] font-semibold tracking-[0.02em] text-heading"
		style="animation-delay: 0ms"
	>
		{site.brand}
	</p>
	<h1
		class="demo-reveal max-w-[14ch] text-[clamp(2.4rem,6vw,4.25rem)] leading-[1.02] font-bold tracking-tight text-heading"
		style="animation-delay: 80ms"
	>
		Let’s look at the view together.
	</h1>
	<p
		class="demo-reveal mt-6 max-w-[38ch] text-[17px] leading-relaxed font-light text-ink/70 sm:text-[18px]"
		style="animation-delay: 160ms"
	>
		Not a product tour. A short conversation about how privacy work can feel when everything tells
		one story — and you can show the whole picture.
	</p>
</section>

<section
	id="book"
	class="demo-reveal relative mt-12 w-full sm:mt-16"
	style="animation-delay: 320ms"
	aria-labelledby="book-step-title"
>
	<div class="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(15rem,0.8fr)] lg:gap-14">
		<div
			class="rounded-2xl border border-ink/10 bg-white/80 p-5 shadow-[0_20px_60px_rgba(11,18,32,0.06)] backdrop-blur-sm sm:p-8"
		>
			<p class="text-[11px] tracking-[0.2em] text-lens uppercase">
				{step === 'confirm' ? 'Done' : step === 'qualify' ? 'Step 1 of 2' : 'Step 2 of 2'}
			</p>
			<h2 id="book-step-title" class="mt-2 text-[1.35rem] font-bold tracking-tight text-heading">
				{stepLabel}
			</h2>
			{#if step === 'qualify'}
				<p class="mt-2 mb-6 max-w-[42ch] text-[14px] leading-relaxed font-light text-ink/60">
					A little context helps us talk about your world, not a generic tour.
				</p>
				{#key formEpoch}
					<BookDemoForm
						seed={form}
						tone="light"
						onQualified={(values) => {
							form = values;
							step = 'calendar';
						}}
					/>
				{/key}
			{:else if step === 'calendar'}
				<p class="mt-2 mb-6 max-w-[42ch] text-[14px] leading-relaxed font-light text-ink/60">
					Choose a slot that works. We’ll send the invite straight away.
				</p>
				<BookDemoCalendar
					{form}
					tone="light"
					onBack={() => {
						step = 'qualify';
						formEpoch += 1;
					}}
					onBooked={(result) => {
						confirmation = result;
						step = 'confirm';
					}}
				/>
			{:else if confirmation}
				<div class="mt-6 rounded-2xl border border-gold/35 bg-gold/10 p-6">
					<p class="text-[12px] tracking-[0.18em] text-gold uppercase">In the diary</p>
					<p class="mt-3 text-[1.35rem] leading-snug font-semibold text-heading">
						{formatWhen(confirmation.start, confirmation.timezone)}
					</p>
					<p class="mt-3 max-w-[42ch] text-[15px] leading-relaxed font-light text-ink/70">
						{#if confirmation.isOffline}
							We’ve got your time. If the calendar invite needs a human nudge, we’ll follow up
							shortly.
						{:else}
							A calendar invite is on its way to
							<span class="font-medium text-ink">{form.email}</span>. Come as you are —
							curiosity beats preparation.
						{/if}
					</p>
					<a
						href="/"
						class="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-gold px-7 py-3 text-[14px] font-semibold tracking-wide text-gold-ink no-underline transition-all hover:-translate-y-0.5 hover:bg-[#e0c07a]"
					>
						Back to the story
					</a>
				</div>
			{/if}
		</div>

		<aside class="lg:pt-2">
			<p class="text-[11px] tracking-[0.2em] text-gold uppercase">What you’ll walk away with</p>
			<ul class="mt-5 space-y-5 text-[15px] leading-relaxed font-light text-ink/70">
				<li>
					<span class="block font-semibold text-heading">Clarity you can feel.</span>
					How privacy work looks when everything tells one story — a living ROPA, one answer for
					the board, vendors you can actually see.
				</li>
				<li>
					<span class="block font-semibold text-heading">A picture you can point at.</span>
					We’ll open a live view of how privacy looks when everything’s connected — using sample
					data, not your secrets.
				</li>
				<li>
					<span class="block font-semibold text-heading">Time well spent.</span>
					Twenty-five minutes. You’ll leave knowing whether this is the view you’ve been looking
					for.
				</li>
			</ul>
		</aside>
	</div>
</section>

<style>
	.demo-reveal {
		animation: demo-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes demo-rise {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.demo-reveal {
			animation: none;
		}
	}
</style>
