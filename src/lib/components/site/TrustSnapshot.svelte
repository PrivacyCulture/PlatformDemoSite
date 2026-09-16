<script lang="ts">
	import UiChrome from './UiChrome.svelte';

	const rows = [
		{ label: 'Certifications', value: 'Cyber Essentials (UK)' },
		{ label: 'Penetration testing', value: 'Annual 3rd-party pen test (executive summary under NDA)' },
		{ label: 'Data residency', value: 'United Kingdom (AWS UK Region)' },
		{ label: 'Encryption', value: 'AES-256 at rest · TLS 1.3 in transit' },
		{ label: 'Governance', value: 'Standard DPA · Published sub-processor list' }
	];
</script>

<UiChrome title="Trust & Security Overview" badge="Public">
	<dl class="divide-y divide-bone/10 border-y border-bone/10">
		{#each rows as row (row.label)}
			<div class="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6">
				<dt class="text-[12px] tracking-[0.16em] text-gold uppercase">{row.label}</dt>
				<dd class="text-[14px] leading-relaxed text-bone/85">{row.value}</dd>
			</div>
		{/each}
	</dl>
</UiChrome>
