export const site = {
	brand: 'Privacy Culture Platform',
	legalName: 'Privacy Culture Ltd',
	demoHref: '/demo',
	overviewHref: 'https://www.privacyculture.com/software',
	nav: {
		links: [
			{ label: 'The Platform', href: '/platform' },
			{ label: 'Pricing', href: '/platform#pricing' }
		],
		demo: { label: 'Book a demo', href: '/demo' }
	},
	footer: {
		logo: {
			src: '/brand/privacyculture-logo-white.svg',
			alt: 'PrivacyCulture',
			href: 'https://www.privacyculture.com/'
		},
		links: [
			{ label: 'Home', href: 'https://www.privacyculture.com/' },
			{ label: 'Resources', href: 'https://www.privacyculture.com/resources' },
			{ label: 'Careers', href: 'https://www.privacyculture.com/careers' },
			{ label: 'Case studies', href: 'https://www.privacyculture.com/case-studies' },
			{ label: 'Privacy Policy', href: 'https://www.privacyculture.com/privacy-policy' },
			{ label: 'Cookie Notice', href: 'https://www.privacyculture.com/cookie-notice' },
			{ label: 'Terms of Use', href: 'https://www.privacyculture.com/terms-of-use' },
			{ label: 'Trust & Security', href: '/trust' },
			{ label: 'AI Index (LLMs)', href: 'https://www.privacyculture.com/llms.txt' }
		],
		address: ['Bouverie House,', '154-160 Fleet Street, London, EC4A 2DQ'],
		phone: '+44 (0) 20 7112 9360',
		phoneHref: 'tel:+442071129360',
		email: 'hello@privacyculture.com',
		linkedin: 'https://www.linkedin.com/company/privacy-culture/'
	},
	pricing: {
		title: 'Clear pricing for mid-market privacy teams.',
		micro: 'From £800/month · 12-month agreement · All launch modules included',
		footnote:
			'12-month agreement. All launch modules included. Assisted onboarding included. Billing terms confirmed in the order form.',
		tiers: [
			{
				band: '1,001–2,500 employees',
				rate: '£800',
				period: '/month',
				cta: 'Book a demo',
				href: '/demo',
				featured: true
			},
			{
				band: '2,501–5,000',
				rate: '£1,600',
				period: '/month',
				cta: 'Book a demo',
				href: '/demo',
				featured: false
			},
			{
				band: 'Above 5,000',
				rate: 'Talk to us',
				period: '',
				cta: 'Talk to us',
				href: '/demo',
				featured: false
			}
		]
	},
	video: {
		src: '/clips/TestVersionOffice.mp4',
		label: 'Watch the 2-minute overview',
		caption: 'A short walk-through of the Visual ROPA View and connected workflows.'
	},
	logos: {
		label: 'Trusted by privacy teams at',
		names: ['Schroders', 'SWIFT', 'Square Enix', 'Save the Children', 'Iron Mountain']
	}
} as const;

export {
	FREE_EMAIL_DOMAINS as consumerEmailDomains,
	DEMO_ROLES as demoRoles,
	EMPLOYEE_BANDS as employeeBands,
	TOOLING_OPTIONS as toolingOptions,
	TIMING_OPTIONS as timelines,
	ISO_GATE_OPTIONS as isoGates
} from '$lib/demo/fields';

