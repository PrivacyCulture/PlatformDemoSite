import { site } from '$lib/site/content';

/**
 * The explainer a page shows: its own when it has one, else the default from Site globals.
 *
 * A page's `explainer` (`{ src, poster, captions, label }`) is written in the CMS and optional in
 * every part — blank means "use the default", which is also how an absent `explainer` reads, so a
 * page nobody has touched shows exactly what it always did. Keep in step with PAGE_EXPLAINER in
 * Sorted's platform-documents.ts.
 *
 * The thumbnail and captions belong to a VIDEO, so they follow the file: a page with its own file
 * uses its own thumbnail and captions (blank = none), never the default video's, which would
 * describe a different film.
 */
export type ExplainerProps = { src: string; poster: string; captions: string; label: string };

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export function explainerFor(page: unknown): ExplainerProps {
	const rec = page && typeof page === 'object' ? ((page as Record<string, unknown>).explainer as Record<string, unknown> | undefined) : undefined;
	const own = rec && typeof rec === 'object' ? rec : {};
	const src = str(own.src);
	const label = str(own.label) || site.video.label;
	if (!src) return { src: site.video.src, poster: str(own.poster) || site.video.poster, captions: site.video.captions, label };
	return { src, poster: str(own.poster), captions: str(own.captions), label };
}
