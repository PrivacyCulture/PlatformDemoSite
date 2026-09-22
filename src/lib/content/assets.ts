/**
 * Resolves asset paths recorded in the site content (`data/database.json` or the CMS).
 *
 * Paths under `/src/lib/assets/` are bundled by Vite so the served URL is
 * fingerprinted and shipped with an immutable cache header. Every other path
 * (`/Images/...`, `/brand/...`, `/clips/...`) is served as-is from `static/`.
 */
// Keep the patterns tight: every match is emitted into the client bundle, so
// widening them would ship files nothing references.
const bundled = import.meta.glob(
	['/src/lib/assets/clips/Mountain/*.{mp4,webp}', '/src/lib/assets/*.svg'],
	{ eager: true, import: 'default' }
) as Record<string, string>;

/** True when `path` names a file Vite bundled from src/lib/assets. */
export function hasBundledAsset(path: string): boolean {
	return Object.hasOwn(bundled, path);
}

export function asset(path: string): string {
	if (!path.startsWith('/src/')) return path;
	const url = bundled[path];
	if (!url) {
		const message =
			`Site content references a bundled asset that does not exist: ${path}. ` +
			`Add the file under src/lib/assets/ or correct the path.`;
		// Content can come from the CMS at run time, so in production a bad path
		// degrades to a broken asset rather than a failed page render.
		if (import.meta.env.DEV) throw new Error(message);
		console.error(message);
		return path;
	}
	return url;
}
