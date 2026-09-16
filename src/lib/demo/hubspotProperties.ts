import { env } from '$env/dynamic/private';
import type { DemoFormValues } from './fields';
import type { DemoUtm } from './utm';

/**
 * HubSpot contact property internal names (invented stand-ins until GTM is confirmed).
 * Create matching custom properties in HubSpot, or rename these to match your portal.
 */
export const HUBSPOT_CONTACT_PROPS = {
	firstName: 'firstname',
	lastName: 'lastname',
	email: 'email',
	company: 'company',
	phone: 'phone',
	role: 'pc_demo_role',
	employeeBand: 'pc_employee_band',
	tooling: 'pc_current_tooling',
	timing: 'pc_eval_timing',
	isoGate: 'pc_iso_soc_gate',
	improve: 'pc_improve_notes',
	/** Stranger Y/N — cold / low-fit inbound vs ICP-shaped lead */
	stranger: 'pc_stranger',
	/** SLA bucket from §14.3 stand-in routing */
	slaTier: 'pc_sla_tier',
	leadPriority: 'pc_lead_priority',
	utmSource: 'utm_source',
	utmMedium: 'utm_medium',
	utmCampaign: 'utm_campaign',
	utmTerm: 'utm_term',
	utmContent: 'utm_content',
	/** First-touch analytics — never overwrite if already set */
	analyticsSource: 'hs_analytics_source',
	analyticsSourceData1: 'hs_analytics_source_data_1',
	analyticsSourceData2: 'hs_analytics_source_data_2'
} as const;

/** Placeholder HubSpot owner IDs — override via env when real owners exist. */
export const SLA_OWNERS = {
	/** Hot ICP: evaluating now, 1k–5k, privacy role */
	priority: () => env.HUBSPOT_OWNER_PRIORITY?.trim() || '1001',
	/** Mid-market: 2.5k–5k or next-3-months */
	midMarket: () => env.HUBSPOT_OWNER_MIDMARKET?.trim() || '1002',
	/** Enterprise: above 5,000 */
	enterprise: () => env.HUBSPOT_OWNER_ENTERPRISE?.trim() || '1003',
	/** Stranger / early explore — slower nurture SLA */
	nurture: () => env.HUBSPOT_OWNER_NURTURE?.trim() || '1004',
	/** Default SMB / under 1k */
	smb: () => env.HUBSPOT_OWNER_SMB?.trim() || '1005'
} as const;

export type ContactRoutingResult = {
	/** Property updates to apply after booking */
	properties: Record<string, string>;
	/** Optional HubSpot owner id for SLA routing */
	hubspotOwnerId?: string;
	/** Whether Stranger rule fired */
	isStranger: boolean;
	slaTier: 'P1' | 'P2' | 'P3' | 'Nurture';
};

const PRIVACY_ROLES = new Set([
	'DPO',
	'Head of Privacy',
	'Privacy Manager',
	'Legal/Compliance',
	'Security/GRC'
]);

const HOT_TIMING = new Set(['actively evaluating now', 'next 3 months']);

/**
 * Invented Stranger Y/N rule (stand-in for GTM):
 * Stranger = Y when the lead looks early/cold:
 *   - timing is "exploring", OR
 *   - under 1,000 employees AND role is Other
 * Otherwise Stranger = N (treat as ICP-shaped inbound).
 */
export function isStrangerLead(form: DemoFormValues): boolean {
	if (form.timing === 'exploring') return true;
	if (form.employeeBand === 'under 1,000' && form.role === 'Other') return true;
	return false;
}

/**
 * Invented SLA §14.3 routing (stand-in for GTM):
 * - Nurture: Stranger Y → nurture owner, P3-slow
 * - P1: privacy role + actively evaluating + 1k+ → priority
 * - P1 enterprise: above 5,000 + hot timing → enterprise
 * - P2: mid band or next 3 months → mid-market
 * - P3: everyone else → SMB
 */
export function routeContact(form: DemoFormValues, _utms: DemoUtm): ContactRoutingResult {
	void _utms;
	const stranger = isStrangerLead(form);
	const privacyRole = PRIVACY_ROLES.has(form.role);
	const hot = HOT_TIMING.has(form.timing);
	const enterprise = form.employeeBand === 'above 5,000';
	const mid = form.employeeBand === '2,501–5,000' || form.employeeBand === '1,000–2,500';

	if (stranger) {
		return {
			isStranger: true,
			slaTier: 'Nurture',
			hubspotOwnerId: SLA_OWNERS.nurture(),
			properties: {
				[HUBSPOT_CONTACT_PROPS.stranger]: 'Y',
				[HUBSPOT_CONTACT_PROPS.slaTier]: 'Nurture',
				[HUBSPOT_CONTACT_PROPS.leadPriority]: 'low'
			}
		};
	}

	if (enterprise && hot) {
		return {
			isStranger: false,
			slaTier: 'P1',
			hubspotOwnerId: SLA_OWNERS.enterprise(),
			properties: {
				[HUBSPOT_CONTACT_PROPS.stranger]: 'N',
				[HUBSPOT_CONTACT_PROPS.slaTier]: 'P1',
				[HUBSPOT_CONTACT_PROPS.leadPriority]: 'high'
			}
		};
	}

	if (privacyRole && form.timing === 'actively evaluating now' && mid) {
		return {
			isStranger: false,
			slaTier: 'P1',
			hubspotOwnerId: SLA_OWNERS.priority(),
			properties: {
				[HUBSPOT_CONTACT_PROPS.stranger]: 'N',
				[HUBSPOT_CONTACT_PROPS.slaTier]: 'P1',
				[HUBSPOT_CONTACT_PROPS.leadPriority]: 'high'
			}
		};
	}

	if (mid || form.timing === 'next 3 months' || form.timing === '3–6 months') {
		return {
			isStranger: false,
			slaTier: 'P2',
			hubspotOwnerId: SLA_OWNERS.midMarket(),
			properties: {
				[HUBSPOT_CONTACT_PROPS.stranger]: 'N',
				[HUBSPOT_CONTACT_PROPS.slaTier]: 'P2',
				[HUBSPOT_CONTACT_PROPS.leadPriority]: 'medium'
			}
		};
	}

	return {
		isStranger: false,
		slaTier: 'P3',
		hubspotOwnerId: SLA_OWNERS.smb(),
		properties: {
			[HUBSPOT_CONTACT_PROPS.stranger]: 'N',
			[HUBSPOT_CONTACT_PROPS.slaTier]: 'P3',
			[HUBSPOT_CONTACT_PROPS.leadPriority]: 'medium'
		}
	};
}

/** Map qualification form → HubSpot contact properties (excluding first-touch analytics). */
export function formToContactProperties(form: DemoFormValues): Record<string, string> {
	const props: Record<string, string> = {
		[HUBSPOT_CONTACT_PROPS.firstName]: form.firstName,
		[HUBSPOT_CONTACT_PROPS.lastName]: form.lastName,
		[HUBSPOT_CONTACT_PROPS.email]: form.email,
		[HUBSPOT_CONTACT_PROPS.company]: form.company,
		[HUBSPOT_CONTACT_PROPS.role]: form.role,
		[HUBSPOT_CONTACT_PROPS.employeeBand]: form.employeeBand,
		[HUBSPOT_CONTACT_PROPS.tooling]: form.tooling,
		[HUBSPOT_CONTACT_PROPS.timing]: form.timing
	};
	if (form.isoGate) props[HUBSPOT_CONTACT_PROPS.isoGate] = form.isoGate;
	if (form.phone) props[HUBSPOT_CONTACT_PROPS.phone] = form.phone;
	if (form.improve) props[HUBSPOT_CONTACT_PROPS.improve] = form.improve;
	return props;
}

/** UTM properties for create-only / first-touch preservation. */
export function utmToContactProperties(utms: DemoUtm): Record<string, string> {
	const props: Record<string, string> = {};
	if (utms.utm_source) props[HUBSPOT_CONTACT_PROPS.utmSource] = utms.utm_source;
	if (utms.utm_medium) props[HUBSPOT_CONTACT_PROPS.utmMedium] = utms.utm_medium;
	if (utms.utm_campaign) props[HUBSPOT_CONTACT_PROPS.utmCampaign] = utms.utm_campaign;
	if (utms.utm_term) props[HUBSPOT_CONTACT_PROPS.utmTerm] = utms.utm_term;
	if (utms.utm_content) props[HUBSPOT_CONTACT_PROPS.utmContent] = utms.utm_content;
	return props;
}
