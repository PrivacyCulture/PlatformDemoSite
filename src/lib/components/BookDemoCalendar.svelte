<script lang="ts">
	import type { DemoFormValues } from '$lib/demo/fields';
	import { readStoredUtms } from '$lib/demo/utm';

	type Slot = { start: number; end: number };

	let {
		form,
		tone = 'light',
		onBack,
		onBooked
	}: {
		form: DemoFormValues;
		tone?: 'light' | 'dark';
		onBack: () => void;
		onBooked: (result: {
			start: string;
			end: string;
			timezone: string;
			isOffline: boolean;
		}) => void;
	} = $props();

	const light = $derived(tone === 'light');
	const labelCls = $derived(
		light ? 'block min-w-[12rem] flex-1 text-[13px] font-medium text-ink/75' : 'block min-w-[12rem] flex-1 text-[13px] font-medium text-bone/80'
	);
	const selectCls = $derived(
		light
			? 'mt-1.5 min-h-11 w-full cursor-pointer rounded-lg border border-ink/15 bg-white px-3 text-[16px] text-ink outline-none focus:border-lens'
			: 'mt-1.5 min-h-11 w-full cursor-pointer rounded-lg border border-bone/15 bg-ink px-3 text-[16px] text-bone outline-none focus:border-lens'
	);
	const ghostBtn = $derived(
		light
			? 'inline-flex min-h-11 cursor-pointer items-center rounded-full border border-ink/15 px-4 text-[13px] text-ink/80 transition-colors hover:border-lens/40 disabled:opacity-40'
			: 'inline-flex min-h-11 cursor-pointer items-center rounded-full border border-bone/15 px-4 text-[13px] text-bone transition-colors hover:border-lens/40 disabled:opacity-40'
	);
	const muted = $derived(light ? 'text-[13px] font-light text-ink/50' : 'text-[13px] font-light text-bone/55');
	const status = $derived(light ? 'py-8 text-center text-[14px] text-ink/55' : 'py-8 text-center text-[14px] text-bone/60');
	const alertCls = $derived(
		light
			? 'rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-[14px] text-red-700'
			: 'rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-200'
	);
	const dayOn = $derived(
		light ? 'border-gold/50 bg-gold/15 text-ink' : 'border-gold/50 bg-gold/15 text-bone'
	);
	const dayOff = $derived(
		light
			? 'border-ink/12 text-ink/75 hover:border-lens/40'
			: 'border-bone/15 text-bone/80 hover:border-lens/40'
	);
	const slotOn = $derived(
		light ? 'border-lens bg-lens/15 text-ink' : 'border-lens bg-lens/20 text-bone'
	);
	const slotOff = $derived(
		light
			? 'border-ink/12 text-ink/80 hover:border-lens/40'
			: 'border-bone/15 text-bone/85 hover:border-lens/40'
	);
	const backBtn = $derived(
		light
			? 'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-ink/15 px-5 text-[14px] font-medium text-ink/80 transition-colors hover:border-lens/40'
			: 'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-bone/20 px-5 text-[14px] font-medium text-bone transition-colors hover:border-lens/40'
	);

	let timezone = $state(
		typeof Intl !== 'undefined'
			? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London'
			: 'Europe/London'
	);
	let monthOffset = $state(0);
	let durationMs = $state(1_800_000);
	let slots = $state<Slot[]>([]);
	let loading = $state(false);
	let loadError = $state<string | null>(null);
	let selectedDayKey = $state<string | null>(null);
	let selectedStart = $state<number | null>(null);
	let booking = $state(false);
	let bookError = $state<string | null>(null);

	const timezones = [
		'Europe/London',
		'Europe/Dublin',
		'Europe/Amsterdam',
		'Europe/Berlin',
		'Europe/Paris',
		'America/New_York',
		'America/Chicago',
		'America/Denver',
		'America/Los_Angeles',
		'America/Toronto',
		'Australia/Sydney',
		'Asia/Singapore'
	];

	const tzOptions = $derived(
		timezones.includes(timezone) ? timezones : [timezone, ...timezones]
	);

	function dayKey(ms: number) {
		return new Intl.DateTimeFormat('en-CA', {
			timeZone: timezone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).format(new Date(ms));
	}

	function formatDayLabel(key: string) {
		const [y, m, d] = key.split('-').map(Number);
		const utcGuess = Date.UTC(y, m - 1, d, 12, 0, 0);
		return new Intl.DateTimeFormat(undefined, {
			timeZone: timezone,
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		}).format(new Date(utcGuess));
	}

	function formatTime(ms: number) {
		return new Intl.DateTimeFormat(undefined, {
			timeZone: timezone,
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(ms));
	}

	const days = $derived.by(() => {
		const map = new Map<string, Slot[]>();
		for (const slot of slots) {
			const key = dayKey(slot.start);
			const list = map.get(key) ?? [];
			list.push(slot);
			map.set(key, list);
		}
		return [...map.entries()].map(([key, daySlots]) => ({
			key,
			label: formatDayLabel(key),
			slots: daySlots.sort((a, b) => a.start - b.start)
		}));
	});

	const daySlots = $derived(
		selectedDayKey ? (days.find((d) => d.key === selectedDayKey)?.slots ?? []) : []
	);

	$effect(() => {
		const tz = timezone;
		const offset = monthOffset;
		let cancelled = false;

		loading = true;
		loadError = null;
		selectedStart = null;

		(async () => {
			try {
				const params = new URLSearchParams({
					timezone: tz,
					monthOffset: String(offset)
				});
				const res = await fetch(`/api/demo/availability?${params}`);
				const data = (await res.json()) as {
					error?: string;
					durationMs?: number;
					slots?: Slot[];
				};
				if (cancelled) return;
				if (!res.ok) {
					loadError = data.error ?? 'Could not load availability.';
					slots = [];
					selectedDayKey = null;
					return;
				}
				durationMs = data.durationMs ?? 1_800_000;
				const nextSlots = data.slots ?? [];
				slots = nextSlots;
				if (nextSlots.length) {
					const keys = new Set(nextSlots.map((s) => dayKey(s.start)));
					if (!selectedDayKey || !keys.has(selectedDayKey)) {
						selectedDayKey = dayKey(nextSlots[0].start);
					}
				} else {
					selectedDayKey = null;
				}
			} catch {
				if (!cancelled) {
					loadError = 'Could not load availability. Check your connection and try again.';
					slots = [];
					selectedDayKey = null;
				}
			} finally {
				if (!cancelled) loading = false;
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	async function confirmBooking() {
		if (selectedStart == null || booking) return;
		booking = true;
		bookError = null;
		try {
			const res = await fetch('/api/demo/book', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					form,
					startTime: selectedStart,
					duration: durationMs,
					timezone,
					utms: readStoredUtms()
				})
			});
			const data = (await res.json()) as {
				error?: string;
				start?: string;
				end?: string;
				timezone?: string;
				isOffline?: boolean;
			};
			if (!res.ok) {
				bookError = data.error ?? 'Booking failed. Please try another time.';
				return;
			}
			onBooked({
				start: data.start ?? new Date(selectedStart).toISOString(),
				end: data.end ?? new Date(selectedStart + durationMs).toISOString(),
				timezone: data.timezone ?? timezone,
				isOffline: Boolean(data.isOffline)
			});
		} catch {
			bookError = 'Booking failed. Please try again.';
		} finally {
			booking = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<label class={labelCls}>
			Your timezone
			<select class={selectCls} bind:value={timezone}>
				{#each tzOptions as tz (tz)}
					<option value={tz}>{tz.replace(/_/g, ' ')}</option>
				{/each}
			</select>
		</label>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class={ghostBtn}
				disabled={monthOffset <= 0 || loading}
				onclick={() => (monthOffset -= 1)}
			>
				Earlier
			</button>
			<button
				type="button"
				class={ghostBtn}
				disabled={monthOffset >= 3 || loading}
				onclick={() => (monthOffset += 1)}
			>
				Later
			</button>
		</div>
	</div>

	<p class={muted}>
		{#if !loading && !loadError && durationMs}
			About {Math.round(durationMs / 60_000)} minutes.
		{/if}
	</p>

	{#if loading}
		<p class={status} role="status">Finding open times…</p>
	{:else if loadError}
		<div class={alertCls} role="alert">{loadError}</div>
	{:else if !days.length}
		<p class={status} role="status">
			Nothing free in this window. Try another month or timezone.
		</p>
	{:else}
		<div class="flex gap-2 overflow-x-auto pb-1">
			{#each days as day (day.key)}
				<button
					type="button"
					class="shrink-0 cursor-pointer rounded-xl border px-3 py-2 text-left transition-colors {selectedDayKey ===
					day.key
						? dayOn
						: dayOff}"
					onclick={() => {
						selectedDayKey = day.key;
						selectedStart = null;
					}}
				>
					<span class="block text-[12px] font-medium tracking-wide">{day.label}</span>
					<span class="mt-0.5 block text-[11px] opacity-55">{day.slots.length} open</span>
				</button>
			{/each}
		</div>

		<div class="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
			{#each daySlots as slot (slot.start)}
				<button
					type="button"
					class="min-h-11 cursor-pointer rounded-lg border text-[14px] transition-colors {selectedStart ===
					slot.start
						? slotOn
						: slotOff}"
					onclick={() => (selectedStart = slot.start)}
				>
					{formatTime(slot.start)}
				</button>
			{/each}
		</div>
	{/if}

	{#if bookError}
		<div class={alertCls} role="alert">{bookError}</div>
	{/if}

	<div class="mt-1 flex flex-wrap gap-3">
		<button type="button" class={backBtn} onclick={onBack} disabled={booking}>
			Back
		</button>
		<button
			type="button"
			class="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full bg-gold px-7 py-3 text-[14px] font-semibold tracking-wide text-gold-ink transition-all hover:-translate-y-0.5 hover:bg-[#e0c07a] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:flex-none"
			disabled={selectedStart == null || booking || loading}
			onclick={confirmBooking}
		>
			{booking ? 'Booking…' : 'Confirm this time'}
		</button>
	</div>
</div>
