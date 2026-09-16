/** Shared qualification fields, options, and validators for book-a-demo. */

export const DEMO_ROLES = [
	'DPO',
	'Head of Privacy',
	'Privacy Manager',
	'Legal/Compliance',
	'Security/GRC',
	'Other'
] as const;

export const EMPLOYEE_BANDS = [
	'under 1,000',
	'1,000–2,500',
	'2,501–5,000',
	'above 5,000'
] as const;

export const TOOLING_OPTIONS = [
	'spreadsheet/manual',
	'specialist privacy tool',
	'enterprise privacy-GRC platform',
	'other'
] as const;

export const TIMING_OPTIONS = [
	'actively evaluating now',
	'next 3 months',
	'3–6 months',
	'exploring'
] as const;

export const ISO_GATE_OPTIONS = ['Yes', 'No', 'Not sure'] as const;

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

export type DemoRole = (typeof DEMO_ROLES)[number];
export type EmployeeBand = (typeof EMPLOYEE_BANDS)[number];
export type ToolingOption = (typeof TOOLING_OPTIONS)[number];
export type TimingOption = (typeof TIMING_OPTIONS)[number];
export type IsoGateOption = (typeof ISO_GATE_OPTIONS)[number];

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

function inList<T extends string>(value: string, list: readonly T[]): value is T {
	return (list as readonly string[]).includes(value);
}

export function validateDemoForm(values: DemoFormValues): DemoFormErrors {
	const errors: DemoFormErrors = {};

	if (!values.firstName.trim()) errors.firstName = 'First name is required.';
	if (!values.lastName.trim()) errors.lastName = 'Last name is required.';

	const email = values.email.trim();
	if (!email) errors.email = 'Work email is required.';
	else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email.';
	else if (!isWorkEmail(email)) errors.email = 'Use a work email — personal domains are not accepted.';

	if (!values.company.trim()) errors.company = 'Company is required.';

	if (!values.role) errors.role = 'Role is required.';
	else if (!inList(values.role, DEMO_ROLES)) errors.role = 'Choose a role from the list.';

	if (!values.employeeBand) errors.employeeBand = 'Employee band is required.';
	else if (!inList(values.employeeBand, EMPLOYEE_BANDS)) {
		errors.employeeBand = 'Choose an employee band.';
	}

	if (!values.tooling) errors.tooling = 'Current tooling is required.';
	else if (!inList(values.tooling, TOOLING_OPTIONS)) {
		errors.tooling = 'Choose current tooling.';
	}

	if (!values.timing) errors.timing = 'Timing is required.';
	else if (!inList(values.timing, TIMING_OPTIONS)) errors.timing = 'Choose a timing option.';

	// ISO/SOC gate hidden for now — keep optional if a value is present
	if (values.isoGate && !inList(values.isoGate, ISO_GATE_OPTIONS)) {
		errors.isoGate = 'Choose an option.';
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
