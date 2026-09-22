/**
 * Shared qualification fields, options, and validators for book-a-demo.
 * Option lists and error messages are read from the site content under
 * `demoForm`.
 */
import { live } from '$lib/content/runtime';

export const DEMO_ROLES: readonly string[] = live((c) => c.demoForm.options.roles, 'array');
export const EMPLOYEE_BANDS: readonly string[] = live(
	(c) => c.demoForm.options.employeeBands,
	'array'
);
export const TOOLING_OPTIONS: readonly string[] = live((c) => c.demoForm.options.tooling, 'array');
export const TIMING_OPTIONS: readonly string[] = live((c) => c.demoForm.options.timing, 'array');
export const ISO_GATE_OPTIONS: readonly string[] = live((c) => c.demoForm.options.isoGate, 'array');

const messages = live((c) => c.demoForm.errors);

export const FREE_EMAIL_DOMAINS = new Set([
	'gmail.com',
	'googlemail.com',
	'yahoo.com',
	'yahoo.co.uk',
	'hotmail.com',
	'hotmail.co.uk',
	'outlook.com',
	'outlook.co.uk',
	'live.com',
	'icloud.com',
	'aol.com',
	'me.com',
	'msn.com',
	'protonmail.com',
	'proton.me',
	'gmx.com',
	'yandex.com',
	'mail.com'
]);

export type DemoRole = string;
export type EmployeeBand = string;
export type ToolingOption = string;
export type TimingOption = string;
export type IsoGateOption = string;

export type DemoFormValues = {
	firstName: string;
	lastName: string;
	email: string;
	company: string;
	role: string;
	employeeBand: string;
	tooling: string;
	timing: string;
	isoGate: string;
	improve: string;
	phone: string;
};

export type DemoFormErrors = Partial<Record<keyof DemoFormValues, string>>;

export const emptyDemoForm = (): DemoFormValues => ({
	firstName: '',
	lastName: '',
	email: '',
	company: '',
	role: '',
	employeeBand: '',
	tooling: '',
	timing: '',
	isoGate: '',
	improve: '',
	phone: ''
});

export function isWorkEmail(email: string): boolean {
	const trimmed = email.trim().toLowerCase();
	const at = trimmed.lastIndexOf('@');
	if (at < 1) return false;
	const domain = trimmed.slice(at + 1);
	if (!domain || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
		return false;
	}
	return !FREE_EMAIL_DOMAINS.has(domain);
}

function inList(value: string, list: readonly string[]): boolean {
	return list.includes(value);
}

export function validateDemoForm(values: DemoFormValues): DemoFormErrors {
	const errors: DemoFormErrors = {};

	if (!values.firstName.trim()) errors.firstName = messages.firstNameRequired;
	if (!values.lastName.trim()) errors.lastName = messages.lastNameRequired;

	const email = values.email.trim();
	if (!email) errors.email = messages.emailRequired;
	else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = messages.emailInvalid;
	else if (!isWorkEmail(email)) errors.email = messages.emailNotWork;

	if (!values.company.trim()) errors.company = messages.companyRequired;

	if (!values.role) errors.role = messages.roleRequired;
	else if (!inList(values.role, DEMO_ROLES)) errors.role = messages.roleInvalid;

	if (!values.employeeBand) errors.employeeBand = messages.employeeBandRequired;
	else if (!inList(values.employeeBand, EMPLOYEE_BANDS)) {
		errors.employeeBand = messages.employeeBandInvalid;
	}

	if (!values.tooling) errors.tooling = messages.toolingRequired;
	else if (!inList(values.tooling, TOOLING_OPTIONS)) {
		errors.tooling = messages.toolingInvalid;
	}

	if (!values.timing) errors.timing = messages.timingRequired;
	else if (!inList(values.timing, TIMING_OPTIONS)) errors.timing = messages.timingInvalid;

	// ISO/SOC gate hidden for now — keep optional if a value is present
	if (values.isoGate && !inList(values.isoGate, ISO_GATE_OPTIONS)) {
		errors.isoGate = messages.isoGateInvalid;
	}

	return errors;
}

export function normalizeDemoForm(values: DemoFormValues): DemoFormValues {
	return {
		firstName: values.firstName.trim(),
		lastName: values.lastName.trim(),
		email: values.email.trim().toLowerCase(),
		company: values.company.trim(),
		role: values.role.trim(),
		employeeBand: values.employeeBand.trim(),
		tooling: values.tooling.trim(),
		timing: values.timing.trim(),
		isoGate: values.isoGate.trim(),
		improve: values.improve.trim(),
		phone: values.phone.trim()
	};
}
