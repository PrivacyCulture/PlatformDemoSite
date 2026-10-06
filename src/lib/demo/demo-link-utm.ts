import { demoPageId, withDemoLinkUtms } from './utm';

/**
 * Tags every link to the demo page with the page it was clicked on, from one place.
 *
 * The buttons come from many components and from CMS content ("Book a demo" in the header,
 * the journey, the Next step box, pricing, the problem pages), so this is done by delegation
 * at click time rather than at each link: the href is rewritten the moment a pointer, key or
 * click reaches the anchor, before the router or the browser reads it. That also covers a
 * middle-click or a cmd-click into a new tab, and a right-click to copy the address.
 *
 * Returns the function that removes the listeners.
 */
export function tagDemoLinks(root: Document = document): () => void {
	const decorate = (target: EventTarget | null) => {
		if (!(target instanceof Element)) return;
		const anchor = target.closest('a[href]');
		if (!(anchor instanceof HTMLAnchorElement)) return;
		// Only this site's own demo page; a link elsewhere is left as it is.
		if (anchor.origin !== location.origin) return;
		const href = anchor.getAttribute('href');
		if (!href) return;
		const next = withDemoLinkUtms(href, demoPageId(location.pathname), location.origin);
		if (next !== href) anchor.setAttribute('href', next);
	};

	const onPointer = (event: Event) => decorate(event.target);
	const onKey = (event: KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') decorate(event.target);
	};

	// Capture phase, so this runs before SvelteKit's own click handler on the page container.
	root.addEventListener('pointerdown', onPointer, true);
	root.addEventListener('click', onPointer, true);
	root.addEventListener('keydown', onKey, true);
	return () => {
		root.removeEventListener('pointerdown', onPointer, true);
		root.removeEventListener('click', onPointer, true);
		root.removeEventListener('keydown', onKey, true);
	};
}
