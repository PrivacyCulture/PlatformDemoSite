<!--
	A Download form from Sorted's page builder (added-sections.ts, 'download'): words about a file,
	a button, and a form for a name and an email address. The page never holds the file's address:
	the form goes to this site's /api/download-request, which asks Sorted, which records the request
	and answers with it. Then the download starts, with a link in case it does not.

	Defaults match Sorted's DOWNLOAD_FORM_DEFAULTS (src/lib/page-builder/download-form.ts).
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { SIZES, imageSize, responsive, sourceSrcset } from '$lib/site/images';
	import { asset } from '$lib/content/assets';
	import { rich } from '$lib/site/rich';
	import type { DownloadSection } from '$lib/site/added-sections';

	let { section }: { section: DownloadSection } = $props();

	const DEFAULTS = {
		buttonLabel: 'Download',
		consentLabel: 'Send me occasional updates from Privacy Culture. You can unsubscribe at any time.',
		thankYou: 'Thank you — your download has started. If it does not, use the link below.'
	};
	const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

	const label = $derived(section.buttonLabel.trim() || DEFAULTS.buttonLabel);
	let open = $state(false);
	const showForm = $derived(section.formOpen || open);
	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let consent = $state(false);
	let website = $state('');
	let errors = $state<Record<string, string>>({});
	let message = $state('');
	let sending = $state(false);
	let done = $state<{ url: string; fileName: string } | null>(null);
	let firstField = $state<HTMLInputElement | null>(null);
	let thanks = $state<HTMLElement | null>(null);

	const uid = $derived(`dl-${section.id}`);
	const fieldClass =
		'mt-1.5 min-h-11 w-full rounded-lg border border-ink/15 bg-white px-3 text-[16px] text-ink outline-none transition-colors focus:border-lens';
	const labelClass = 'block text-[13px] font-medium text-ink/75';
	const errorClass = 'mt-1 block text-[12px] text-red-600';

	async function reveal() {
		open = true;
		await tick();
		firstField?.focus();
	}

	function check(): Record<string, string> {
		const e: Record<string, string> = {};
		if (!firstName.trim()) e.firstName = 'Enter your first name.';
		if (!lastName.trim()) e.lastName = 'Enter your last name.';
		if (!email.trim()) e.email = 'Enter your email address.';
		else if (!EMAIL.test(email.trim())) e.email = 'Enter a valid email address.';
		return e;
	}

	function startDownload(url: string, fileName: string) {
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		a.rel = 'noopener';
		document.body.appendChild(a);
		a.click();
		a.remove();
	}

	async function submit(e: Event) {
		e.preventDefault();
		message = '';
		errors = check();
		if (Object.keys(errors).length) return;
		sending = true;
		try {
			const res = await fetch('/api/download-request', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					page: section.pageKey,
					blockId: section.id,
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					email: email.trim(),
					consent: section.askConsent && consent,
					website
				})
			});
			const answer = (await res.json().catch(() => null)) as { ok?: boolean; url?: string; fileName?: string; message?: string; errors?: Record<string, string> } | null;
			if (!res.ok || !answer?.ok || !answer.url) {
				if (answer?.errors) errors = answer.errors;
				message = answer?.message || 'Something went wrong. Please try again.';
				return;
			}
			done = { url: answer.url, fileName: answer.fileName || section.fileName || 'download' };
			startDownload(done.url, done.fileName);
			await tick();
			thanks?.focus();
		} catch {
			message = 'Something went wrong. Please check your connection and try again.';
		} finally {
			sending = false;
		}
	}
</script>

<div class={['grid items-start gap-8 rounded-2xl border border-ink/10 bg-white/60 p-6 sm:p-10', section.image.src ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:gap-14' : '']}>
	<div class="min-w-0">
		{#if section.eyebrow}
			<p class="mb-3 text-[12px] tracking-[0.22em] text-lens uppercase">{section.eyebrow}</p>
		{/if}
		{#if section.title}
			<h2 class="max-w-[24ch] text-[clamp(1.5rem,3vw,2.1rem)] leading-tight font-bold tracking-tight">{@html rich(section.title)}</h2>
		{/if}
		{#if section.body}
			<p class="rt mt-4 max-w-[62ch] text-[15px] leading-relaxed font-light whitespace-pre-line text-ink/70">{@html rich(section.body)}</p>
		{/if}
		{#if section.fileKind}
			<p class="mt-4 font-mono text-[11px] tracking-[0.14em] text-ink/50 uppercase">{section.fileKind}</p>
		{/if}

		{#if !section.hasFile}
			<p class="mt-6 text-[14px] font-light text-ink/60">This download is not available yet.</p>
		{:else if done}
			<div bind:this={thanks} tabindex="-1" class="mt-8 max-w-[34rem] rounded-2xl border border-gold/35 bg-gold/10 p-5 outline-none" role="status">
				<p class="text-[15px] leading-relaxed text-ink/80">{section.thankYou.trim() || DEFAULTS.thankYou}</p>
				<a href={done.url} download={done.fileName} rel="noopener" class="mt-3 inline-flex items-center gap-2 text-[14px] font-semibold text-lens underline underline-offset-2 hover:text-heading">
					Download the file
				</a>
			</div>
		{:else if !showForm}
			<button
				type="button"
				onclick={reveal}
				aria-expanded="false"
				aria-controls={uid}
				class="mt-8 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-gold px-7 py-3 text-[14px] font-semibold tracking-wide text-gold-ink transition-all hover:-translate-y-0.5 hover:bg-[#e0c07a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
			>
				{label}
			</button>
		{:else}
			<form id={uid} onsubmit={submit} class="mt-8 flex max-w-[34rem] flex-col gap-4" novalidate>
				<div class="grid gap-4 sm:grid-cols-2">
					<label class={labelClass}>
						First name
						<input bind:this={firstField} class={fieldClass} autocomplete="given-name" bind:value={firstName} aria-invalid={Boolean(errors.firstName)} />
						{#if errors.firstName}<span class={errorClass}>{errors.firstName}</span>{/if}
					</label>
					<label class={labelClass}>
						Last name
						<input class={fieldClass} autocomplete="family-name" bind:value={lastName} aria-invalid={Boolean(errors.lastName)} />
						{#if errors.lastName}<span class={errorClass}>{errors.lastName}</span>{/if}
					</label>
				</div>
				<label class={labelClass}>
					Work email
					<input class={fieldClass} type="email" autocomplete="email" inputmode="email" bind:value={email} aria-invalid={Boolean(errors.email)} />
					{#if errors.email}<span class={errorClass}>{errors.email}</span>{/if}
				</label>
				<!-- Hidden from people; a bot fills every box. -->
				<label class="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
					Website
					<input tabindex="-1" autocomplete="off" bind:value={website} />
				</label>
				{#if section.askConsent}
					<label class="{labelClass} flex cursor-pointer items-start gap-2.5">
						<input type="checkbox" bind:checked={consent} class="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-lens" />
						<span class="font-light">{section.consentLabel.trim() || DEFAULTS.consentLabel}</span>
					</label>
				{/if}
				{#if message}<p class="text-[13px] text-red-600" role="alert">{message}</p>{/if}
				<button
					type="submit"
					disabled={sending}
					class="mt-1 inline-flex min-h-11 cursor-pointer items-center justify-center self-start rounded-full bg-gold px-7 py-3 text-[14px] font-semibold tracking-wide text-gold-ink transition-all hover:-translate-y-0.5 hover:bg-[#e0c07a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-70"
				>
					{sending ? 'Sending…' : label}
				</button>
			</form>
		{/if}
	</div>
	{#if section.image.src}
		<figure class="m-0 min-w-0 max-w-[16rem] lg:max-w-none">
			<picture>
				{#if section.image.webp}
					<source srcset={sourceSrcset(asset(section.image.webp))} sizes={SIZES.half} type="image/webp" />
				{/if}
				<img
					src={asset(section.image.src)}
					{...responsive(asset(section.image.src), SIZES.half)}
					alt={section.image.alt}
					{...imageSize(section.image)}
					class="block h-auto w-full rounded-xl drop-shadow-[0_24px_60px_rgba(11,18,32,0.14)]"
					loading="lazy"
					decoding="async"
				/>
			</picture>
		</figure>
	{/if}
</div>
