<script lang="ts">
	import UiChrome from './UiChrome.svelte';
	import { panels } from '$lib/content';

	const panel = panels.sourceReconciliation;
	const tools = panel.tools;
	const rows = panel.rows;
	const resolved = panel.resolved;
	const missing = new Set<string>(panel.missingValues);
</script>

<UiChrome title={panel.title} badge={panel.badge}>
	<div class="grid gap-5 md:grid-cols-[1.25fr_1fr]">
		<div class="min-w-0">
			<p class="text-[11px] tracking-[0.18em] text-bone/50 uppercase">{panel.beforeEyebrow}</p>
			<p class="mt-1 text-[18px] font-bold tracking-tight text-bone/80">{panel.beforeTitle}</p>
			<div class="mt-4 overflow-x-auto">
				<table class="w-full min-w-[26rem] text-left text-[13px]">
					<thead>
						<tr class="text-[10px] tracking-[0.14em] text-bone/45 uppercase">
							<th class="pb-2 pr-3 font-normal">{panel.fieldColumn}</th>
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
										class="py-2.5 pr-3 {missing.has(value)
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
			<p class="text-[11px] tracking-[0.18em] text-lens uppercase">{panel.afterEyebrow}</p>
			<p class="mt-1 text-[18px] font-bold tracking-tight text-gold">{panel.afterTitle}</p>
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
