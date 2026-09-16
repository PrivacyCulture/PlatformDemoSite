<script lang="ts">
	let {
		href,
		label,
		external = false
	}: {
		href: string;
		label: string;
		external?: boolean;
	} = $props();
</script>

<a
	{href}
	class="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-gold px-7 py-3 text-[14px] font-semibold tracking-wide text-gold-ink no-underline shadow-[0_0_0_1px_rgba(212,175,106,0.35),0_0_28px_rgba(212,175,106,0.28),0_10px_24px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#e0c07a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
>
	{label}
</a>
