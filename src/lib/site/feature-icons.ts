// The icons a Features menu entry can carry, chosen by id in Sorted (`site.nav.features.items[].icon`).
// Line icons on a 24px grid, drawn with the stroke the component sets. Sorted's "Icon" choice must
// list exactly these ids (FEATURE_ICON_IDS in pcl-abm's platform-structure.ts): an id the site does
// not know draws as an empty tile, silently.

export const FEATURE_ICONS: Readonly<Record<string, string>> = {
	layers: '<path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/>',
	register:
		'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3.5"/>',
	assessment:
		'<path d="M8.5 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1.5"/><rect x="8.5" y="3" width="7" height="4" rx="1"/><path d="m9 14 2 2 4-4"/>',
	vendors:
		'<circle cx="12" cy="5.5" r="2.5"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/><path d="m10.8 7.7-4.1 8M13.2 7.7l4.1 8M8 18h8"/>',
	ai: '<path d="m11 4 1.7 4.8L17.5 10.5l-4.8 1.7L11 17l-1.7-4.8-4.8-1.7 4.8-1.7L11 4Z"/><path d="M18 15v5M15.5 17.5h5"/>',
	board:
		'<path d="M4 20.5h16"/><rect x="5.5" y="12" width="3" height="5.5" rx="1"/><rect x="10.5" y="8" width="3" height="9.5" rx="1"/><rect x="15.5" y="4" width="3" height="13.5" rx="1"/>',
	search:
		'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.9-4.9"/><circle cx="10.5" cy="9" r="1.75"/><path d="M7.6 13.6a3.3 3.3 0 0 1 5.8 0"/>',
	training:
		'<path d="M12 4 2.5 9 12 14l9.5-5L12 4Z"/><path d="M6.5 11.3V16c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.7M21.5 9v5"/>',
	breach:
		'<path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6l-7-3Z"/><path d="M12 8v4.5M12 15.75v.25"/>',
	evidence:
		'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/><path d="m9 14.5 2 2 4-4"/>',
	shield: '<path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
	lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3M12 15v2"/>',
	people:
		'<circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.6 14.1A4.5 4.5 0 0 1 21 18.5"/>',
	globe:
		'<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/>',
	alert: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
	settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'
};

/** The icon's markup, or nothing for an empty or unknown id. Only ever this module's own strings. */
export function featureIcon(id: string | undefined): string | null {
	return (id && Object.hasOwn(FEATURE_ICONS, id) && FEATURE_ICONS[id]) || null;
}
