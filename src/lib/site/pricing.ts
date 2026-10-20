/**
 * The pricing cards, read defensively from whatever content the CMS serves.
 *
 * `site.pricing.plans` replaced `site.pricing.tiers`. They are separate keys, not a reshaped
 * array, because Sorted's add-only sync takes a NEW key whole but never grows an existing
 * array: three tiers could not have become five cards that way. Until Sorted has the plans,
 * it still serves the old tiers, so they are read here in the new shape rather than dropping
 * the pricing table off every page that carries it.
 *
 * Pure: no content import, so it can be tested offline.
 */

export const PLAN_STYLES = ['standard', 'featured', 'enterprise'] as const;
export type PlanStyle = (typeof PLAN_STYLES)[number];

export type PricingPlan = {
	/** Small line above the band — "Employees". Not `label`: Sorted names a list item by its
	 *  `label` first, which would head every card "Employees" instead of its band. */
	bandLabel: string;
	band: string;
	/** Small line above the price — "from", or "5,000+ or complex groups". */
	lead: string;
	rate: string;
	period: string;
	/** Small line under the price — "£6,000 billed annually". */
	billed: string;
	/** Inline HTML, rendered through rich(). A leading figure is bolded — see featureParts. */
	features: string[];
	cta: string;
	href: string;
	style: PlanStyle;
};

export type PricingNote = { title: string; body: string };
export type PricingModule = { title: string; body: string };
export type PricingModules = { title: string; intro: string; items: PricingModule[] };

const str = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
const rec = (v: unknown): Record<string, unknown> | null =>
	v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

function planStyle(v: unknown, featured: unknown): PlanStyle {
	if (typeof v === 'string' && (PLAN_STYLES as readonly string[]).includes(v)) return v as PlanStyle;
	return featured === true ? 'featured' : 'standard';
}

function coercePlan(raw: unknown): PricingPlan | null {
	const r = rec(raw);
	if (!r) return null;
	const band = str(r.band).trim();
	const rate = str(r.rate).trim();
	if (!band && !rate) return null;
	const features = Array.isArray(r.features) ? r.features.map(str).filter((f) => f.trim()) : [];
	return {
		bandLabel: str(r.bandLabel ?? r.label),
		band,
		lead: str(r.lead),
		rate,
		period: str(r.period),
		billed: str(r.billed),
		features,
		cta: str(r.cta).trim() || 'Book a demo',
		href: str(r.href).trim() || '/demo',
		style: planStyle(r.style, r.featured)
	};
}

/** The cards to draw: `plans` when the content has any, else the legacy `tiers`. */
export function pricingPlans(pricing: unknown): PricingPlan[] {
	const p = rec(pricing);
	if (!p) return [];
	const from = (list: unknown) => (Array.isArray(list) ? list.map(coercePlan).filter((x): x is PricingPlan => !!x) : []);
	const plans = from(p.plans);
	return plans.length ? plans : from(p.tiers);
}

export function pricingNotes(raw: unknown): PricingNote[] {
	if (!Array.isArray(raw)) return [];
	return raw.flatMap((n) => {
		const r = rec(n);
		if (!r) return [];
		const title = str(r.title).trim();
		const body = str(r.body).trim();
		return title || body ? [{ title, body }] : [];
	});
}

export function pricingModules(raw: unknown): PricingModules | null {
	const r = rec(raw);
	if (!r) return null;
	const items = Array.isArray(r.items)
		? r.items.flatMap((m) => {
				const i = rec(m);
				const title = i ? str(i.title).trim() : '';
				return title ? [{ title, body: str(i!.body) }] : [];
			})
		: [];
	if (!items.length) return null;
	return { title: str(r.title).trim() || 'View our launch modules', intro: str(r.intro), items };
}

/** The number in a price for structured data — '' for "POA" or "Talk to us", never a guess. */
export function planPrice(rate: string): string {
	const digits = rate.replace(/[^\d.]/g, '');
	return /\d/.test(digits) ? digits : '';
}

/**
 * A feature line split so its leading figure can be set in bold: "10 user accounts" →
 * { figure: '10', rest: ' user accounts' }. Only a plain line is split; one an editor has
 * already formatted is left exactly as written (figure '').
 */
export function featureParts(feature: string): { figure: string; rest: string } {
	if (/[<&]/.test(feature)) return { figure: '', rest: feature };
	const m = /^(\d[\d,.]*\+?)(\s.*)$/.exec(feature);
	return m ? { figure: m[1], rest: m[2] } : { figure: '', rest: feature };
}
