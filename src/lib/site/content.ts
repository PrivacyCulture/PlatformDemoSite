import { live } from '$lib/content/runtime';

/**
 * Site-wide copy and asset URLs for the marketing pages. Everything here is
 * read from the site content under `site`; this module only adds the footer's
 * link columns, which are composed from the legal links so the journey's legal
 * bar and the footer stay in sync.
 */
export const site = live(({ site: raw }) => ({
	...raw,
	footer: {
		...raw.footer,
		logo: {
			src: raw.logos.white.src,
			alt: raw.logos.white.alt,
			width: raw.logos.white.width,
			height: raw.logos.white.height,
			href: raw.footer.logoHref
		},
		links: raw.legal.links
	}
}));

export {
	FREE_EMAIL_DOMAINS as consumerEmailDomains,
	DEMO_ROLES as demoRoles,
	EMPLOYEE_BANDS as employeeBands,
	TOOLING_OPTIONS as toolingOptions,
	TIMING_OPTIONS as timelines,
	ISO_GATE_OPTIONS as isoGates
} from '$lib/demo/fields';
