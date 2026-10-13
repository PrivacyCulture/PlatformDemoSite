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
	const pill =
		'inline-flex min-h-10 cursor-pointer items-center rounded-full border border-lens/40 bg-white px-4 text-[13px] font-semibold text-horizon no-underline transition-colors hover:border-lens hover:text-lens focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens';
</script>

<div class="flex flex-wrap items-center gap-3">
	<span class="mr-1 text-[11px] tracking-[0.2em] text-ink/55 uppercase">{label}</span>
	<a class={pill} href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
	<button type="button" class={pill} onclick={copy}>{copied ? copiedLabel : copyLabel}</button>
	<span class="sr-only" aria-live="polite">{copied ? copiedLabel : ''}</span>
</div>
