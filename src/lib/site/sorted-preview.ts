/**
 * The link between this site and Sorted's page builder, which shows the dev site in a frame (or a
 * pop-out window) at `<page>?sortedPreview=1#block-<blockId>`. Ported from pcl-web's
 * sorted-preview.js; the messages are the same, so one builder drives both sites.
 *
 * Active ONLY with sortedPreview=1 AND on the draft channel — a visitor to the live site can never
 * switch it on. It scrolls to and outlines the block Sorted names (`sorted-select`), highlights the
 * block under the pointer with the name Sorted gave it (`sorted-labels`), tells Sorted which block
 * was clicked (`sorted-pick`, and the click does nothing else), and says `sorted-ready` once mounted.
 * Messages go only to the origin that opened the preview, never to '*'.
 *
 * Blocks are marked with data-block-id by PreviewBlock, a `display: contents` wrapper with no box
 * of its own, so a block is measured by its children.
 */

const OUTLINE_ID = 'sorted-preview-outline';
const HOVER_ID = 'sorted-preview-hover';
let labels: Record<string, string> = {};

export function previewEnabled(url: URL, channel: string | undefined): boolean {
	return url.searchParams.get('sortedPreview') === '1' && channel === 'draft';
}

function sortedOrigin(): string | null {
	try {
		return document.referrer ? new URL(document.referrer).origin : null;
	} catch {
		return null;
	}
}

function target(): Window | null {
	if (window.parent && window.parent !== window) return window.parent;
	return (window.opener as Window | null) || null;
}

function blockEl(id: string | null): Element | null {
	return id ? document.querySelector(`[data-block-id="${CSS.escape(id)}"]`) : null;
}

/** The area a block covers: its own box, or for a box-less marker the union of its children's. */
function rectOf(el: Element): { top: number; left: number; width: number; height: number } | null {
	const rects = el.getClientRects().length ? [el.getBoundingClientRect()] : [...el.children].map((c) => c.getBoundingClientRect()).filter((r) => r.width || r.height);
	if (!rects.length) return null;
	const top = Math.min(...rects.map((r) => r.top));
	const left = Math.min(...rects.map((r) => r.left));
	const bottom = Math.max(...rects.map((r) => r.bottom));
	const right = Math.max(...rects.map((r) => r.right));
	return { top: top + window.scrollY, left: left + window.scrollX, width: right - left, height: bottom - top };
}

function place(box: HTMLElement, el: Element): boolean {
	const r = rectOf(el);
	if (!r) return false;
	Object.assign(box.style, { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
	return true;
}

function labelBox(id: string, cssBox: string, cssLabel: string): HTMLElement {
	const box = document.createElement('div');
	box.id = id;
	box.setAttribute('aria-hidden', 'true');
	box.style.cssText = cssBox;
	const label = document.createElement('span');
	label.style.cssText = cssLabel;
	box.appendChild(label);
	document.body.appendChild(box);
	return box;
}

function outline(id: string | null): void {
	let box = document.getElementById(OUTLINE_ID);
	const el = blockEl(id);
	if (!el || !id) {
		box?.remove();
		return;
	}
	box ??= labelBox(
		OUTLINE_ID,
		'position:absolute;pointer-events:none;z-index:2147483646;outline:2px solid #2563eb;outline-offset:-3px;transition:top .15s,height .15s',
		'position:absolute;left:6px;top:6px;background:#2563eb;color:#fff;font:600 11px/1.6 system-ui,sans-serif;padding:0 7px;border-radius:4px'
	);
	if (!place(box, el)) {
		box.remove();
		return;
	}
	box.dataset.blockId = id;
	(box.firstChild as HTMLElement).textContent = labels[id] ? `Editing · ${labels[id]}` : 'Editing';
	document.getElementById(HOVER_ID)?.remove();
}

/** The lighter highlight that follows the pointer, with the block's name. */
function hover(id: string | null): void {
	let box = document.getElementById(HOVER_ID);
	const el = blockEl(id);
	const selected = document.getElementById(OUTLINE_ID)?.dataset.blockId;
	if (!el || !id || id === selected) {
		box?.remove();
		return;
	}
	box ??= labelBox(
		HOVER_ID,
		'position:absolute;pointer-events:none;z-index:2147483645;outline:2px dashed #60a5fa;outline-offset:-3px;background:rgba(96,165,250,.08)',
		'position:absolute;left:6px;top:6px;max-width:calc(100% - 12px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:#1e3a8a;color:#fff;font:600 11px/1.7 system-ui,sans-serif;padding:0 8px;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.2)'
	);
	(box.firstChild as HTMLElement).textContent = `${labels[id] || 'Block'} — click to edit`;
	box.dataset.blockId = id;
	if (!place(box, el)) box.remove();
}

function scrollTo(id: string, smooth: boolean): void {
	const el = blockEl(id);
	const r = el && rectOf(el);
	if (r) window.scrollTo({ top: Math.max(0, r.top - 80), behavior: smooth ? 'smooth' : 'auto' });
}

/** Call from the root layout's onMount. Returns a cleanup function (a no-op when inactive). */
export function startSortedPreview(url: URL, channel: string | undefined): () => void {
	if (typeof window === 'undefined' || !previewEnabled(url, channel)) return () => {};
	const origin = sortedOrigin();
	const to = target();
	const post = (msg: unknown) => {
		if (origin && to) to.postMessage(msg, origin);
	};

	const fromHash = () => {
		const m = /^#block-(.+)$/.exec(window.location.hash);
		if (m) {
			const id = decodeURIComponent(m[1]);
			scrollTo(id, false);
			outline(id);
		}
	};
	// Images and fonts move blocks after first paint; follow the hash again once they settle.
	fromHash();
	const settle = setTimeout(fromHash, 800);

	// A block picked here comes straight back as Sorted's selection; it is already on screen, so
	// that echo outlines it without scrolling away from where it was clicked.
	let picked: string | null = null;
	const onMessage = (ev: MessageEvent) => {
		if (!origin || ev.origin !== origin) return;
		const msg = ev.data as { type?: string; id?: unknown; labels?: unknown } | null;
		if (msg?.type === 'sorted-labels' && msg.labels && typeof msg.labels === 'object') {
			labels = msg.labels as Record<string, string>;
			const sel = document.getElementById(OUTLINE_ID)?.dataset.blockId;
			if (sel) outline(sel);
		}
		if (msg?.type === 'sorted-select' && typeof msg.id === 'string') {
			outline(msg.id);
			if (msg.id !== picked) scrollTo(msg.id, true);
			picked = null;
		}
	};

	const blockAt = (t: EventTarget | null) => (t instanceof Element ? t.closest('[data-block-id]') : null);
	const onOver = (ev: MouseEvent) => {
		const id = blockAt(ev.target)?.getAttribute('data-block-id') ?? null;
		if (id !== document.getElementById(HOVER_ID)?.dataset.blockId) hover(id);
	};
	const onLeave = () => hover(null);
	const onClick = (ev: MouseEvent) => {
		const el = blockAt(ev.target);
		if (!el) return;
		// Editing, not browsing: inside a block a click selects it and nothing else happens.
		ev.preventDefault();
		ev.stopPropagation();
		const id = el.getAttribute('data-block-id');
		picked = id;
		outline(id);
		post({ type: 'sorted-pick', id });
	};
	const onResize = () => {
		const box = document.getElementById(OUTLINE_ID);
		if (box?.dataset.blockId) outline(box.dataset.blockId);
		document.getElementById(HOVER_ID)?.remove();
	};

	window.addEventListener('message', onMessage);
	document.addEventListener('click', onClick, true);
	document.addEventListener('mouseover', onOver, true);
	document.documentElement.addEventListener('mouseleave', onLeave);
	window.addEventListener('resize', onResize);
	post({ type: 'sorted-ready' });

	return () => {
		clearTimeout(settle);
		window.removeEventListener('message', onMessage);
		document.removeEventListener('click', onClick, true);
		document.removeEventListener('mouseover', onOver, true);
		document.documentElement.removeEventListener('mouseleave', onLeave);
		window.removeEventListener('resize', onResize);
		document.getElementById(HOVER_ID)?.remove();
		document.getElementById(OUTLINE_ID)?.remove();
	};
}
