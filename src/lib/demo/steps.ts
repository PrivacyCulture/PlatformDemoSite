/**
 * The Book a demo form beside a hero asks the /demo form's questions over two views before the
 * calendar: who you are, then your organisation. The questions, options and messages are the same
 * ones (`./fields`); this only says which view each belongs to, so a view checks its own fields and
 * the whole form is still checked by `validateDemoForm` before the calendar opens.
 *
 * Pure: no content, no runtime. Asserted in scripts/test-demo-steps.ts.
 */
import type { DemoFormErrors, DemoFormValues } from './fields';

export type DemoStep = 'about' | 'organisation';

type FixedKey = Exclude<keyof DemoFormValues, 'extra'>;

/** Every fixed question, by the view that asks it. Sorted's extra questions are all `organisation`. */
export const DEMO_STEP_KEYS: Record<DemoStep, readonly FixedKey[]> = {
	about: ['firstName', 'lastName', 'email', 'company', 'role'],
	organisation: ['employeeBand', 'tooling', 'timing', 'isoGate', 'improve', 'phone']
};

/** The errors one view shows: those for its own questions, out of the whole form's. */
export function stepErrors(errors: DemoFormErrors, step: DemoStep): DemoFormErrors {
	const out: DemoFormErrors = {};
	for (const key of DEMO_STEP_KEYS[step]) if (errors[key]) out[key] = errors[key];
	if (step === 'organisation' && errors.extra && Object.keys(errors.extra).length) out.extra = { ...errors.extra };
	return out;
}

/** The first view with an error in it, or null when the whole form is good. */
export function firstStepWithErrors(errors: DemoFormErrors): DemoStep | null {
	for (const step of ['about', 'organisation'] as const) if (Object.keys(stepErrors(errors, step)).length) return step;
	return null;
}
