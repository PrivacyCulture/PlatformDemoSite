<!--
	The Book a demo form beside a hero's copy, in place of the explainer. Switched on in Sorted's
	page builder ("Show the Book a demo form beside the copy" on the hero block), which writes the
	page's `sharedElement: 'demo-form'`.

	It asks exactly the /demo form's questions, through the same BookDemoForm, over three views in
	one card: about you, your organisation (the rest of the questions, Sorted's extras among them),
	then a time from the same calendar. Its own wording is `demoForm.heroForm`, edited in Sorted
	under Website → Platform → Demo form; the questions, options and messages are the form's.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { pushState } from '$app/navigation';
	import BookDemoCalendar from '$lib/components/BookDemoCalendar.svelte';
	import BookDemoForm from '$lib/components/BookDemoForm.svelte';
	import { demoForm } from '$lib/content';
	import { emptyDemoForm, validateDemoForm, type DemoFormValues } from '$lib/demo/fields';
	import { firstStepWithErrors } from '$lib/demo/steps';
	import { demoPageId } from '$lib/demo/utm';
	import { trackConversion } from '$lib/site/linkedin-tag';
	import { safeHref } from '$lib/site/added-sections';

	type View = 'about' | 'organisation' | 'calendar' | 'done';

	const W = $derived(demoForm.heroForm);
	// The privacy notice link after the line about saving details; drawn only with words and a usable address.
	const privacyLink = $derived(W.about.privacyLinkLabel?.trim() ? safeHref(W.about.privacyLinkHref) : '');

	let view = $state<View>('about');
	let form = $state<DemoFormValues>(emptyDemoForm());
	let confirmation = $state<{ start: string; timezone: string; isOffline: boolean } | null>(null);
	let heading = $state<HTMLHeadingElement | null>(null);

	const copy = $derived(
		view === 'about' ? W.about : view === 'organisation' ? W.organisation : view === 'calendar' ? W.calendar : W.done
	);

	/** A new view, with focus on its heading so a keyboard or screen reader follows the move. */
	async function go(next: View) {
		view = next;
		await tick();
		heading?.focus({ preventScroll: true });
		heading?.closest('[data-hero-demo-form]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}

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
</script>

<div
	data-hero-demo-form
	class="w-full rounded-[1.25rem] bg-white p-6 shadow-[0_24px_70px_rgba(11,18,32,0.12)] ring-1 ring-ink/5 sm:p-8"
>
	<p class="text-[11px] tracking-[0.2em] text-lens uppercase">{copy.eyebrow}</p>
	<h2
		bind:this={heading}
		tabindex="-1"
		class="mt-2 text-[1.35rem] leading-snug font-bold tracking-tight text-heading outline-none sm:text-[1.5rem]"
	>
		{copy.title}
	</h2>

	<div class="mt-5">
		{#if view === 'about'}
			<BookDemoForm
				seed={form}
				part="about"
				submitLabel={W.about.submit}
				onQualified={(values) => {
					form = values;
					go('organisation');
				}}
			/>
			{#if W.about.note}
				<p class="mt-4 text-[13px] leading-relaxed font-light text-ink/60">{W.about.note}</p>
			{/if}
			{#if W.about.privacy || privacyLink}
				<p class="mt-4 border-t border-ink/10 pt-4 text-[12px] leading-relaxed font-light text-ink/55">
					{W.about.privacy}
					{#if privacyLink}
						<a href={privacyLink} class="text-lens underline underline-offset-2 hover:text-heading">{W.about.privacyLinkLabel}</a>
					{/if}
				</p>
			{/if}
		{:else if view === 'organisation'}
			<BookDemoForm
				seed={form}
				part="organisation"
				submitLabel={W.organisation.submit}
				backLabel={W.organisation.back}
				onBack={(values) => {
					form = values;
					go('about');
				}}
				onQualified={(values) => {
					form = values;
					// The whole form, as /demo checks it: a first-view answer the content has since
					// ruled out (a role taken off the list) sends the visitor back to it.
					if (firstStepWithErrors(validateDemoForm(values)) === 'about') return go('about');
					trackConversion('demo_qualified');
					go('calendar');
				}}
			/>
		{:else if view === 'calendar'}
			{#if W.calendar.intro}
				<p class="mb-5 text-[14px] leading-relaxed font-light text-ink/60">{W.calendar.intro}</p>
			{/if}
			<BookDemoCalendar
				{form}
				from={demoPageId(location.pathname)}
				onBack={() => go('organisation')}
				onBooked={(result) => {
					confirmation = result;
					go('done');
					trackConversion('demo_booked');
					// As on /demo: an address of its own, so analytics can count completed bookings.
					pushState('/demo-booked', {});
				}}
			/>
		{:else if confirmation}
			<div class="rounded-2xl border border-gold/35 bg-gold/10 p-5">
				<p class="text-[1.2rem] leading-snug font-semibold text-heading">
					{formatWhen(confirmation.start, confirmation.timezone)}
				</p>
				<p class="mt-3 text-[15px] leading-relaxed font-light text-ink/70">
					{#if confirmation.isOffline}
						{W.done.offline}
					{:else}
						{W.done.onlineBefore}
						<span class="font-medium text-ink">{form.email}</span>{W.done.onlineAfter}
					{/if}
				</p>
			</div>
		{/if}
	</div>
</div>
