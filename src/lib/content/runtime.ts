/**
 * Where site content is read from at run time.
 *
 * Content is no longer baked in at build time: the server fetches it from the
 * CMS (falling back to `data/database.json`) and may swap it between requests,
 * and the browser receives it from the root layout load. So nothing may hold a
 * reference to it captured at module load. `live()` gives modules a stand-in
 * that resolves the current snapshot on every property access.
 *
 * - Server: `installContentResolver` is given an AsyncLocalStorage lookup, so
 *   each request reads the snapshot it started with even if a refresh lands
 *   mid-render.
 * - Browser: `setContent` is called from the root `+layout.ts` load.
 *
 * Never pass a `live()` proxy into `$state()` (Svelte would wrap the proxy, not
 * the data) and never return one from a load function (devalue cannot
 * serialise it). Hand those a plain object instead, e.g. `structuredClone` of a
 * value read off the real snapshot, or a freshly composed object.
 */
import type { SiteContent } from './index';

let resolver: (() => SiteContent | undefined) | undefined;
let current: SiteContent | undefined;

export function installContentResolver(fn: () => SiteContent | undefined): void {
	resolver = fn;
}

export function setContent(c: SiteContent): void {
	current = c;
}

export class ContentNotLoadedError extends Error {
	constructor() {
		super(
			'Site content was read before it was loaded. Read it inside a component or a load ' +
				'function (after `await parent()`), never at module top level.'
		);
		this.name = 'ContentNotLoadedError';
	}
}

export function getContent(): SiteContent {
	const c = resolver?.() ?? current;
	if (!c) throw new ContentNotLoadedError();
	return c;
}

/**
 * A read-only view of `select(currentContent)` that follows the content as it
 * changes. `select` runs at most once per snapshot. Use `kind: 'array'` when
 * the selection is an array so `Array.isArray` and `{#each}` work.
 */
export function live<T extends object>(
	select: (c: SiteContent) => T,
	kind: 'object' | 'array' = 'object'
): T {
	const memo = new WeakMap<SiteContent, T>();
	const real = (): T => {
		const c = getContent();
		let v = memo.get(c);
		if (v === undefined) {
			v = select(c);
			memo.set(c, v);
		}
		return v;
	};

	const target = (kind === 'array' ? [] : {}) as T;

	return new Proxy(target, {
		get(_t, key) {
			const r = real();
			const v = Reflect.get(r, key, r);
			return typeof v === 'function' ? v.bind(r) : v;
		},
		has(_t, key) {
			return Reflect.has(real(), key);
		},
		ownKeys() {
			return Reflect.ownKeys(real());
		},
		getOwnPropertyDescriptor(t, key) {
			const r = real();
			const desc = Reflect.getOwnPropertyDescriptor(r, key);
			if (!desc) return undefined;
			// A proxy may only report a non-configurable property the target
			// itself has non-configurable; the empty target has none except an
			// array's `length`, which must keep the target's own shape.
			const own = Reflect.getOwnPropertyDescriptor(t, key);
			if (own && !own.configurable) return { ...own, value: (r as { length?: number }).length };
			return { ...desc, configurable: true };
		},
		getPrototypeOf() {
			return Reflect.getPrototypeOf(real());
		},
		set() {
			return false;
		},
		defineProperty() {
			return false;
		},
		deleteProperty() {
			return false;
		}
	});
}
