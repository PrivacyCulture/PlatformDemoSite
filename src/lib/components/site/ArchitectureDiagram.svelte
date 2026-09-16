<script lang="ts">
	import UiChrome from './UiChrome.svelte';

	const modules = [
		{ title: 'ROPA & Data Flows', href: '#visual-ropa' },
		{ title: 'Vendors & Sub-processors', href: '#vendors' },
		{ title: 'DPIAs & Risk Assessments', href: '#assessments' },
		{ title: 'Incidents & DSARs', href: '#dsar-overload' }
	];
</script>

<UiChrome title="Module architecture" badge="Connected">
	<div class="space-y-4">
		<div
			class="rounded-xl border border-gold/35 bg-gradient-to-r from-gold/15 to-lens/10 px-4 py-4 text-center"
		>
			<p class="text-[11px] tracking-[0.22em] text-gold uppercase">Visual ROPA View</p>
			<p class="mt-1 text-[13px] font-light text-bone/70">
				Live map of data flows, processing activities, and system dependencies
			</p>
		</div>

		<div class="flex justify-center" aria-hidden="true">
			<div class="h-6 w-px bg-gradient-to-b from-gold/50 to-bone/20"></div>
		</div>

		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each modules as item (item.title)}
				<a
					href={item.href}
					class="rounded-xl border border-bone/10 bg-white/[0.03] px-3 py-4 text-center no-underline transition-colors hover:border-lens/40 hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens"
				>
					<p class="text-[13px] leading-snug font-semibold text-bone">{item.title}</p>
				</a>
			{/each}
		</div>

		<div class="flex justify-center" aria-hidden="true">
			<div class="h-6 w-px bg-gradient-to-b from-bone/20 to-lens/40"></div>
		</div>

		<div class="rounded-xl border border-lens/30 bg-lens/10 px-4 py-4 text-center">
			<p class="text-[11px] tracking-[0.22em] text-lens uppercase">Automated Task Routing</p>
			<p class="mt-1 text-[13px] font-light text-bone/70">& Board Governance</p>
		</div>
	</div>
</UiChrome>
