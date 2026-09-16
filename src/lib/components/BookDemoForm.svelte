<script lang="ts">
	import {
		DEMO_ROLES,
		EMPLOYEE_BANDS,
		TIMING_OPTIONS,
		TOOLING_OPTIONS,
		emptyDemoForm,
		validateDemoForm,
		type DemoFormErrors,
		type DemoFormValues
	} from '$lib/demo/fields';

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
	let values = $state<DemoFormValues>({ ...seed });
	let errors = $state<DemoFormErrors>({});
	let submitted = $state(false);

	const light = $derived(tone === 'light');
	const fieldClass = $derived(
		light
			? 'mt-1.5 min-h-11 w-full rounded-lg border border-ink/15 bg-white px-3 text-[15px] text-ink outline-none transition-colors focus:border-lens'
			: 'mt-1.5 min-h-11 w-full rounded-lg border border-bone/15 bg-ink px-3 text-[15px] text-bone outline-none transition-colors focus:border-lens'
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

	function blurValidate(key: keyof DemoFormValues) {
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
			First name
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
			Last name
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
		Work email
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
		Organisation
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
		What do you do?
		<select
			class="{fieldClass} cursor-pointer"
			bind:value={values.role}
			onblur={() => blurValidate('role')}
			aria-invalid={Boolean(errors.role)}
		>
			<option value="" disabled>Pick the closest fit</option>
			{#each DEMO_ROLES as role (role)}
				<option value={role}>{role}</option>
			{/each}
		</select>
		{#if errors.role}
			<span class={errorClass}>{errors.role}</span>
		{/if}
	</label>

	<label class={labelClass}>
		Roughly how big is the organisation?
		<select
			class="{fieldClass} cursor-pointer"
			bind:value={values.employeeBand}
			onblur={() => blurValidate('employeeBand')}
			aria-invalid={Boolean(errors.employeeBand)}
		>
			<option value="" disabled>Headcount band</option>
			{#each EMPLOYEE_BANDS as band (band)}
				<option value={band}>{band}</option>
			{/each}
		</select>
		{#if errors.employeeBand}
			<span class={errorClass}>{errors.employeeBand}</span>
		{/if}
	</label>

	<label class={labelClass}>
		How do you keep track of privacy today?
		<select
			class="{fieldClass} cursor-pointer"
			bind:value={values.tooling}
			onblur={() => blurValidate('tooling')}
			aria-invalid={Boolean(errors.tooling)}
		>
			<option value="" disabled>Closest match</option>
			{#each TOOLING_OPTIONS as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
		{#if errors.tooling}
			<span class={errorClass}>{errors.tooling}</span>
		{/if}
	</label>

	<label class={labelClass}>
		When would you like to get started?
		<select
			class="{fieldClass} cursor-pointer"
			bind:value={values.timing}
			onblur={() => blurValidate('timing')}
			aria-invalid={Boolean(errors.timing)}
		>
			<option value="" disabled>A rough idea is enough</option>
			{#each TIMING_OPTIONS as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
		{#if errors.timing}
			<span class={errorClass}>{errors.timing}</span>
		{/if}
	</label>

	<label class={labelClass}>
		What’s the one thing you’d most like to see more clearly?
		<span class={hintClass}> (optional)</span>
		<textarea
			class="{fieldClass} min-h-[5.5rem] py-2"
			rows="3"
			placeholder="A living ROPA. One story for the board. Vendors you can actually see…"
			bind:value={values.improve}
		></textarea>
	</label>

	<label class={labelClass}>
		Phone
		<span class={hintClass}> (optional)</span>
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
		Choose a time →
	</button>
</form>
