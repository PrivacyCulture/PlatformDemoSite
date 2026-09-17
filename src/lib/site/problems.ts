/** The pain points in the order they appear on /platform. Each has its own page. */
export const problems = [
	{
		title: 'Conflicting sources of truth',
		body: 'One connected estate, not five tools telling you five different things.',
		href: '/conflicting-sources'
	},
	{
		title: 'The stale ROPA',
		body: 'Records the business re-confirms as they change, not a register rebuilt at audit.',
		href: '/stale-ropa'
	},
	{
		title: 'Assessments that land',
		body: 'Every DPIA tied to the live risk it flagged, not filed and forgotten.',
		href: '/dpia-follow-through'
	},
	{
		title: 'Vendor risk that goes quiet',
		body: 'Vendors watched continuously, not vetted once and trusted.',
		href: '/vendor-drift'
	},
	{
		title: 'Shadow AI',
		body: 'Every AI tool surfaced and tied to its record, not found after it ships.',
		href: '/shadow-ai'
	},
	{
		title: 'Show the board',
		body: 'The trend, the target and the gap on one screen, not a shrug and a spreadsheet.',
		href: '/board-reporting'
	},
	{
		title: 'DSAR overload',
		body: 'Locate data subject records in minutes instead of weeks.',
		href: '/dsar-overload'
	},
	{
		title: 'Training that misses the risk',
		body: 'Point education at operational weak spots, not generic tick-boxes.',
		href: '/training-budget'
	},
	{
		title: 'Breach response readiness',
		body: 'A breach on a Friday, handled – roles, clock, and an evidenced 72 hours.',
		href: '/breach-response'
	},
	{
		title: 'Audit & regulator readiness',
		body: 'A continuous evidence log, not a scramble before review.',
		href: '/audit-readiness'
	}
] as const;

export type Problem = (typeof problems)[number];

/** Previous and next problem relative to `href`, wrapping at both ends so both links always exist. */
export function problemNeighbours(href: string): { previous: Problem; next: Problem } {
	const i = problems.findIndex((p) => p.href === href);
	if (i === -1) throw new Error(`Unknown problem page: ${href}`);
	const n = problems.length;
	return { previous: problems[(i - 1 + n) % n], next: problems[(i + 1) % n] };
}
