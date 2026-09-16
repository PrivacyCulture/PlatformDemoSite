<script lang="ts">
	import { onMount } from 'svelte';
	import {
		BEAT_LABELS,
		isBeatActive,
		joinMinSec,
		progressToSeconds,
		secondsToProgress,
		splitMinSec,
		type BeatDef,
		type BeatId
	} from '$lib/journey/beats';

	const PANEL_STORAGE_KEY = 'journey-section-panel-open';

	let {
		beats,
		duration = 0,
		currentProgress = 0,
		onChange,
		onJump
	}: {
		beats: BeatDef[];
		duration?: number;
		currentProgress?: number;
		onChange: (beats: BeatDef[]) => void;
		onJump: (progress: number) => void;
	} = $props();

	let open = $state(true);

	onMount(() => {
		try {
			const saved = localStorage.getItem(PANEL_STORAGE_KEY);
			if (saved === '0') open = false;
		} catch {
			/* ignore */
		}
	});

	function setOpen(next: boolean) {
		open = next;
		try {
			localStorage.setItem(PANEL_STORAGE_KEY, next ? '1' : '0');
		} catch {
			/* ignore */
		}
	}

	function setAtMinSec(id: BeatId, minRaw: string, secRaw: string) {
		if (!duration) return;
		const min = Number.parseFloat(minRaw);
		const sec = Number.parseFloat(secRaw);
		if (!Number.isFinite(min) || !Number.isFinite(sec)) return;
		const total = joinMinSec(min, sec);
		const at = Math.min(1, secondsToProgress(total, duration));
		onChange(beats.map((b) => (b.id === id ? { ...b, at } : b)));
	}

	function markHere(id: BeatId) {
		onChange(beats.map((b) => (b.id === id ? { ...b, at: currentProgress } : b)));
	}

	function toggleHidden(id: BeatId) {
		onChange(beats.map((b) => (b.id === id ? { ...b, hidden: !b.hidden } : b)));
	}
</script>

{#if open}
	<div
		id="section-times"
		class="fixed bottom-[88px] left-4 z-[70] flex max-h-[min(62vh,28rem)] w-[min(calc(100vw-2rem),19.5rem)] flex-col overflow-hidden rounded-2xl border border-bone/15 bg-ink/85 backdrop-blur-md"
	>
		<div class="flex items-center justify-between gap-2 border-b border-bone/10 px-3 py-2.5">
			<div class="text-[10px] tracking-[0.22em] text-bone-dim uppercase">Section — Min / Sec</div>
			<button
				type="button"
				onclick={() => setOpen(false)}
				aria-label="Hide section panel"
				class="cursor-pointer rounded border border-bone/15 px-2 py-1 text-[9px] tracking-[0.12em] text-bone-dim uppercase transition-colors hover:border-bone/40 hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens"
			>
				Hide
			</button>
		</div>

		<ul class="overflow-y-auto p-1.5">
			{#each beats as beat, i (beat.id)}
				{@const total = progressToSeconds(beat.at, duration)}
				{@const parts = splitMinSec(total)}
				{@const active = isBeatActive(currentProgress, beats, i)}
				<li
					class={[
						'flex items-center gap-1.5 rounded-xl px-2 py-1.5 transition-colors',
						beat.hidden ? 'opacity-45' : active ? 'bg-lens/15' : 'hover:bg-bone/5'
					]}
				>
					<button
						type="button"
						onclick={() => onJump(beat.at)}
						class={[
							'min-w-0 flex-1 cursor-pointer truncate text-left text-[11px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens',
							beat.hidden ? 'text-bone-dim line-through' : 'text-bone hover:text-lens'
						]}
					>
						{BEAT_LABELS[beat.id]}
					</button>

					<div class="flex shrink-0 items-center gap-0.5 font-mono text-[11px] text-bone tabular-nums">
						<input
							type="number"
							min="0"
							step="1"
							aria-label="{BEAT_LABELS[beat.id]} minutes"
							value={parts.min}
							disabled={!duration || beat.hidden}
							onchange={(e) => setAtMinSec(beat.id, e.currentTarget.value, String(parts.sec))}
							class="w-8 rounded border border-bone/15 bg-ink/50 px-1 py-1 text-center outline-none focus:border-lens disabled:opacity-40"
						/>
						<span class="text-bone/40">:</span>
						<input
							type="number"
							min="0"
							max="59.9"
							step="0.1"
							aria-label="{BEAT_LABELS[beat.id]} seconds"
							value={parts.sec.toFixed(1)}
							disabled={!duration || beat.hidden}
							onchange={(e) => setAtMinSec(beat.id, String(parts.min), e.currentTarget.value)}
							class="w-12 rounded border border-bone/15 bg-ink/50 px-1 py-1 text-center outline-none focus:border-lens disabled:opacity-40"
						/>
					</div>

					<button
						type="button"
						title="Set to current time"
						aria-label="Set {BEAT_LABELS[beat.id]} to current time"
						onclick={() => markHere(beat.id)}
						disabled={beat.hidden}
						class="cursor-pointer rounded border border-bone/15 px-1.5 py-1 text-[9px] tracking-[0.08em] text-bone-dim uppercase transition-colors hover:border-lens/40 hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens disabled:cursor-not-allowed disabled:opacity-40"
					>
						Now
					</button>

					<button
						type="button"
						title={beat.hidden ? 'Show section' : 'Hide section'}
						aria-label={beat.hidden ? `Show ${BEAT_LABELS[beat.id]}` : `Hide ${BEAT_LABELS[beat.id]}`}
						aria-pressed={beat.hidden}
						onclick={() => toggleHidden(beat.id)}
						class={[
							'cursor-pointer rounded border px-1.5 py-1 text-[9px] tracking-[0.08em] uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens',
							beat.hidden
								? 'border-lens/40 text-lens hover:border-lens'
								: 'border-bone/15 text-bone-dim hover:border-ember/50 hover:text-bone'
						]}
					>
						{beat.hidden ? 'Show' : 'Hide'}
					</button>
				</li>
			{/each}
		</ul>
	</div>
{:else}
	<button
		id="section-times"
		type="button"
		onclick={() => setOpen(true)}
		aria-label="Show section panel"
		class="fixed bottom-[88px] left-4 z-[70] cursor-pointer rounded-full border border-bone/15 bg-ink/85 px-3.5 py-2 text-[10px] tracking-[0.18em] text-bone-dim uppercase backdrop-blur-md transition-colors hover:border-lens/40 hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lens"
	>
		Sections
	</button>
{/if}
