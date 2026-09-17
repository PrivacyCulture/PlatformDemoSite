<script lang="ts">
	import UiChrome from './UiChrome.svelte';

	const vendors = [
		{ name: 'CloudCRM Inc', role: 'Processor · CRM', attested: '12 Aug 2026', subs: 14, status: 'Current', tone: 'live' },
		{ name: 'Helpdesk.io', role: 'Processor · Support', attested: '20 May 2026', subs: 9, status: 'Sub-processor changed', tone: 'stale' },
		{ name: 'PayCo Ltd', role: 'Processor · Payroll', attested: '3 Feb 2025', subs: 3, status: 'Re-attest due', tone: 'stale' },
		{ name: 'MailBlast', role: 'Processor · Marketing', attested: '9 Jul 2024', subs: 6, status: 'Overdue', tone: 'fail' }
	] as const;
</script>

<UiChrome title="Processors · attestation watch" badge="Continuous">
	<ul class="divide-y divide-bone/10 border-y border-bone/10">
		{#each vendors as vendor (vendor.name)}
			<li class="grid gap-x-4 gap-y-1 py-3 sm:grid-cols-[1.3fr_1fr_auto_auto] sm:items-center">
				<div class="min-w-0">
					<p class="truncate text-[14px] text-bone/85">{vendor.name}</p>
					<p class="text-[12px] text-bone/45">{vendor.role}</p>
				</div>
				<p class="text-[12px] text-bone/55">
					<span class="text-bone/40">Attested</span>
					{vendor.attested}
				</p>
				<p class="text-[12px] text-bone/55 tabular-nums">
					{vendor.subs} <span class="text-bone/40">sub-processors</span>
				</p>
				<span
					class="w-fit rounded-full px-2.5 py-1 text-[11px] tracking-[0.12em] uppercase
					{vendor.tone === 'live'
						? 'border border-lens/35 bg-lens/10 text-lens'
						: vendor.tone === 'stale'
							? 'border border-gold/40 bg-gold/10 text-gold'
							: 'border border-red-400/35 bg-red-400/10 text-red-300'}"
				>
					{vendor.status}
				</span>
			</li>
		{/each}
	</ul>
	<p class="mt-4 rounded-lg border border-gold/30 bg-gold/[0.08] px-3 py-2 text-[12px] text-gold/90">
		Helpdesk.io moved ticket storage from eu-west-2 to us-east-1 on 2 Sep. Three processing
		activities affected, transfer review task raised.
	</p>
</UiChrome>
