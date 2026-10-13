<!-- Share an article: LinkedIn's share page, and copying the address. No tracking scripts. -->
<script lang="ts">
	let { url, label = 'Share', copyLabel = 'Copy link', copiedLabel = 'Link copied' }: { url: string; label?: string; copyLabel?: string; copiedLabel?: string } = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 2500);
		} catch {
			// Clipboard refused (an insecure context, a denied permission): select-and-copy by hand
			// is still possible from the address bar, so there is nothing worth interrupting for.
		}
	}
	// Icon-only, so each carries its words in aria-label and title — an icon is not an accessible name.
	const icon =
		'inline-grid size-10 cursor-pointer place-items-center rounded-full border border-lens/40 bg-white text-horizon no-underline transition-colors hover:border-lens hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens';
</script>

<div class="flex flex-wrap items-center gap-3">
	<span class="mr-1 text-[11px] tracking-[0.2em] text-ink/55 uppercase">{label}</span>
	<a class={icon} href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" title="Share on LinkedIn">
		<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>
	</a>
	<button type="button" class={icon} onclick={copy} aria-label={copied ? copiedLabel : copyLabel} title={copied ? copiedLabel : copyLabel}>
		{#if copied}
			<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
		{:else}
			<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13.5a4.5 4.5 0 0 0 6.4.4l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4l-1.4 1.4" /><path d="M14 10.5a4.5 4.5 0 0 0-6.4-.4L5 12.7a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4" /></svg>
		{/if}
	</button>
	<span class="sr-only" aria-live="polite">{copied ? copiedLabel : ''}</span>
</div>
