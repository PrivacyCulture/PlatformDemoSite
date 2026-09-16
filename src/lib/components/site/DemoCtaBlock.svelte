<script lang="ts">
	import GoldCta from './GoldCta.svelte';
	import { site } from '$lib/site/content';

	let {
		title = 'See your privacy estate differently.',
		body = 'Book a 25-minute demo to see the Visual ROPA View and connected workflows in action.'
	}: {
		title?: string;
		body?: string;
	} = $props();
</script>

<section
	class="on-ink w-full rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-bone sm:p-10"
>
	<h2 class="max-w-[16ch] text-[clamp(1.6rem,3.2vw,2.4rem)] leading-tight font-bold tracking-tight text-bone">
		{title}
	</h2>
	<p class="mt-3 max-w-[48ch] text-[15px] leading-relaxed font-light text-bone/75">{body}</p>
	<div class="mt-6">
		<GoldCta href={site.demoHref} label="Book a demo" />
	</div>
</section>
