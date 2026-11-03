<script lang="ts">
	import {
		DEMO_EXTRA_FIELDS,
		DEMO_ROLES,
		EMPLOYEE_BANDS,
		TIMING_OPTIONS,
		TOOLING_OPTIONS,
		emptyDemoForm,
		validateDemoForm,
		type DemoFormErrors,
		type DemoFormValues
	} from '$lib/demo/fields';
	import { demoForm } from '$lib/content';
	import { CHECKBOX_YES, emptyExtraAnswers } from '$lib/demo/extra-fields';

	const L = demoForm.fields;

	let {
		seed = emptyDemoForm(),
		tone = 'light',
		onQualified
	}: {
		seed?: DemoFormValues;
		tone?: 'light' | 'dark';
		onQualified: (values: DemoFormValues) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	// Every added question gets an answer slot, so a question added since the seed was made still
	// binds — and one removed since is dropped by normalizeDemoForm on the server.
	let values = $state<DemoFormValues>({
		...seed,
		extra: { ...emptyExtraAnswers(DEMO_EXTRA_FIELDS), ...(seed.extra ?? {}) }
	});
	let errors = $state<DemoFormErrors>({});
	let submitted = $state(false);

	const light = $derived(tone === 'light');
	const fieldClass = $derived(
		light
			? 'mt-1.5 min-h-11 w-full rounded-lg border border-ink/15 bg-white px-3 text-[16px] text-ink outline-none transition-colors focus:border-lens'
			: 'mt-1.5 min-h-11 w-full rounded-lg border border-bone/15 bg-ink px-3 text-[16px] text-bone outline-none transition-colors focus:border-lens'
	);
	const labelClass = $derived(
		light ? 'block text-[13px] font-medium text-ink/75' : 'block text-[13px] font-medium text-bone/80'
	);
	const hintClass = $derived(light ? 'font-light text-ink/40' : 'font-light text-bone/45');
	const errorClass = $derived(
		light ? 'mt-1 block text-[12px] text-red-600' : 'mt-1 block text-[12px] text-red-300'
	);

	function submit(e: Event) {
		e.preventDefault();
		submitted = true;
		const nextErrors = validateDemoForm(values);
		errors = nextErrors;
		if (Object.keys(nextErrors).length) return;
		onQualified({ ...values });
	}

	function blurValidateExtra(id: string) {
		if (!submitted) return;
		const message = validateDemoForm(values).extra?.[id];
		const { [id]: _, ...rest } = errors.extra ?? {};
		const extra = message ? { ...rest, [id]: message } : rest;
		errors = { ...errors, extra: Object.keys(extra).length ? extra : undefined };
	}

	function blurValidate(key: Exclude<keyof DemoFormValues, 'extra'>) {
		if (!submitted) return;
		const next = validateDemoForm(values);
		if (next[key]) errors = { ...errors, [key]: next[key] };
		else {
			const { [key]: _, ...rest } = errors;
			errors = rest;
		}
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-4" novalidate>
	<div class="grid gap-4 sm:grid-cols-2">
		<label class={labelClass}>
			{L.firstName}
			<input
				class={fieldClass}
				autocomplete="given-name"
				bind:value={values.firstName}
				onblur={() => blurValidate('firstName')}
				aria-invalid={Boolean(errors.firstName)}
			/>
			{#if errors.firstName}
				<span class={errorClass}>{errors.firstName}</span>
			{/if}
		</label>
		<label class={labelClass}>
			{L.lastName}
			<input
				class={fieldClass}
				autocomplete="family-name"
				bind:value={values.lastName}
				onblur={() => blurValidate('lastName')}
				aria-invalid={Boolean(errors.lastName)}
			/>
			{#if errors.lastName}
				<span class={errorClass}>{errors.lastName}</span>
			{/if}
		</label>
	</div>

	<label class={labelClass}>
		{L.email}
		<input
			class={fieldClass}
			type="email"
			autocomplete="email"
			bind:value={values.email}
			onblur={() => blurValidate('email')}
			aria-invalid={Boolean(errors.email)}
		/>
		{#if errors.email}
			<span class={errorClass}>{errors.email}</span>
		{/if}
	</label>

	<label class={labelClass}>
		{L.company}
		<input
			class={fieldClass}
			autocomplete="organization"
			bind:value={values.company}
			onblur={() => blurValidate('company')}
			aria-invalid={Boolean(errors.company)}
		/>
		{#if errors.company}
			<span class={errorClass}>{errors.company}</span>
		{/if}
	</label>

	<label class={labelClass}>
		{L.role}
		<select
			class="{fieldClass} cursor-pointer"
			bind:value={values.role}
			onblur={() => blurValidate('role')}
			aria-invalid={Boolean(errors.role)}
		>
			<option value="" disabled>{L.rolePlaceholder}</option>
			{#each DEMO_ROLES as role (role)}
				<option value={role}>{role}</option>
			{/each}
		</select>
		{#if errors.role}
			<span class={errorClass}>{errors.role}</span>
		{/if}
	</label>

	<label class={labelClass}>
		{L.employeeBand}
		<select
			class="{fieldClass} cursor-pointer"
			bind:value={values.employeeBand}
			onblur={() => blurValidate('employeeBand')}
			aria-invalid={Boolean(errors.employeeBand)}
		>
			<option value="" disabled>{L.employeeBandPlaceholder}</option>
			{#each EMPLOYEE_BANDS as band (band)}
				<option value={band}>{band}</option>
			{/each}
		</select>
		{#if errors.employeeBand}
			<span class={errorClass}>{errors.employeeBand}</span>
		{/if}
	</label>

	<label class={labelClass}>
		{L.tooling}
		<select
			class="{fieldClass} cursor-pointer"
			bind:value={values.tooling}
			onblur={() => blurValidate('tooling')}
			aria-invalid={Boolean(errors.tooling)}
		>
			<option value="" disabled>{L.toolingPlaceholder}</option>
			{#each TOOLING_OPTIONS as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
		{#if errors.tooling}
			<span class={errorClass}>{errors.tooling}</span>
		{/if}
	</label>

	<label class={labelClass}>
		{L.timing}
		<select
			class="{fieldClass} cursor-pointer"
			bind:value={values.timing}
			onblur={() => blurValidate('timing')}
			aria-invalid={Boolean(errors.timing)}
		>
			<option value="" disabled>{L.timingPlaceholder}</option>
			{#each TIMING_OPTIONS as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
		{#if errors.timing}
			<span class={errorClass}>{errors.timing}</span>
		{/if}
	</label>

	{#each DEMO_EXTRA_FIELDS as f (f.id)}
		{@const error = errors.extra?.[f.id]}
		{#if f.type === 'checkbox'}
			<div>
				<label class="{labelClass} flex cursor-pointer items-start gap-2.5">
					<input
						type="checkbox"
						class="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-lens"
						checked={values.extra[f.id] === CHECKBOX_YES}
						onchange={(e) => {
							values.extra[f.id] = e.currentTarget.checked ? CHECKBOX_YES : '';
							blurValidateExtra(f.id);
						}}
						aria-invalid={Boolean(error)}
					/>
					<span>
						{f.label}
						{#if !f.required}<span class={hintClass}> {L.optional}</span>{/if}
					</span>
				</label>
				{#if error}
					<span class={errorClass}>{error}</span>
				{/if}
			</div>
		{:else}
			<label class={labelClass}>
				{f.label}
				{#if !f.required}<span class={hintClass}> {L.optional}</span>{/if}
				{#if f.type === 'select'}
					<select
						class="{fieldClass} cursor-pointer"
						bind:value={values.extra[f.id]}
						onblur={() => blurValidateExtra(f.id)}
						aria-invalid={Boolean(error)}
					>
						<option value="" disabled={f.required}>{f.placeholder || 'Choose…'}</option>
						{#each f.options as option, i (i)}
							<option value={option}>{option}</option>
						{/each}
					</select>
				{:else if f.type === 'textarea'}
					<textarea
						class="{fieldClass} min-h-[5.5rem] py-2"
						rows="3"
						maxlength="2000"
						placeholder={f.placeholder}
						bind:value={values.extra[f.id]}
						onblur={() => blurValidateExtra(f.id)}
						aria-invalid={Boolean(error)}
					></textarea>
				{:else}
					<input
						class={fieldClass}
						maxlength="2000"
						placeholder={f.placeholder}
						bind:value={values.extra[f.id]}
						onblur={() => blurValidateExtra(f.id)}
						aria-invalid={Boolean(error)}
					/>
				{/if}
				{#if error}
					<span class={errorClass}>{error}</span>
				{/if}
			</label>
		{/if}
	{/each}

	<label class={labelClass}>
		{L.improve}
		<span class={hintClass}> {L.optional}</span>
		<textarea
			class="{fieldClass} min-h-[5.5rem] py-2"
			rows="3"
			placeholder={L.improvePlaceholder}
			bind:value={values.improve}
		></textarea>
	</label>

	<label class={labelClass}>
		{L.phone}
		<span class={hintClass}> {L.optional}</span>
		<input
			class={fieldClass}
			type="tel"
			autocomplete="tel"
			bind:value={values.phone}
		/>
	</label>

	<button
		type="submit"
		class="mt-1 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-gold px-7 py-3 text-[14px] font-semibold tracking-wide text-gold-ink transition-all hover:-translate-y-0.5 hover:bg-[#e0c07a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
	>
		{L.submit}
	</button>
</form>
