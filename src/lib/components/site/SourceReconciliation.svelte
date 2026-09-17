<script lang="ts">
	import UiChrome from './UiChrome.svelte';

	const tools = ['ROPA sheet', 'Vendor tracker', 'DPIA register'];

	const rows = [
		{ field: 'Retention', values: ['6 years', 'Not recorded', '7 years'] },
		{ field: 'Processor', values: ['PayCo Ltd', 'PayCo (via reseller)', 'PayCo Ltd'] },
		{ field: 'Lawful basis', values: ['Contract', 'Not recorded', 'Legal obligation'] },
		{ field: 'Owner', values: ['HR', 'Finance', 'Blank'] }
	];

	const resolved = [
		{ field: 'Retention', value: '6 years after employment ends' },
		{ field: 'Processor', value: 'PayCo Ltd (UK), sub-processors listed' },
		{ field: 'Lawful basis', value: 'Contract, legal obligation' },
		{ field: 'Owner', value: 'Head of People, confirmed 3 Sep' }
	];
</script>

<UiChrome title="Payroll processing · sources compared" badge="Reconciled">
	<div class="grid gap-5 md:grid-cols-[1.25fr_1fr]">
		<div class="min-w-0">
			<p class="text-[11px] tracking-[0.18em] text-bone/50 uppercase">Before · three tools</p>
			<p class="mt-1 text-[18px] font-bold tracking-tight text-bone/80">Four fields, no agreement</p>
			<div class="mt-4 overflow-x-auto">
				<table class="w-full min-w-[26rem] text-left text-[13px]">
					<thead>
						<tr class="text-[10px] tracking-[0.14em] text-bone/45 uppercase">
							<th class="pb-2 pr-3 font-normal">Field</th>
							{#each tools as tool (tool)}
								<th class="pb-2 pr-3 font-normal">{tool}</th>
							{/each}
						</tr>
					</thead>
					<tbody class="divide-y divide-bone/10">
						{#each rows as row (row.field)}
							<tr>
								<td class="py-2.5 pr-3 text-bone/60">{row.field}</td>
								{#each row.values as value, i (i)}
									<td
										class="py-2.5 pr-3 {value === 'Not recorded' || value === 'Blank'
											? 'text-red-300/80 italic'
											: 'text-gold/90'}"
									>
										{value}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
		<div class="rounded-xl border border-lens/30 bg-lens/[0.07] p-4 sm:p-5">
			<p class="text-[11px] tracking-[0.18em] text-lens uppercase">After · one record</p>
			<p class="mt-1 text-[18px] font-bold tracking-tight text-gold">One answer per field</p>
			<dl class="mt-4 space-y-3">
				{#each resolved as item (item.field)}
					<div>
						<dt class="text-[11px] tracking-wide text-bone/45">{item.field}</dt>
						<dd class="text-[13px] leading-snug text-bone/85">{item.value}</dd>
					</div>
				{/each}
			</dl>
		</div>
	</div>
</UiChrome>
