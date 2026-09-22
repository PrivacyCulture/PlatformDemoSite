// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SiteContent } from '$lib/content';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** The content snapshot this request renders with (see hooks.server.ts). */
			content: SiteContent;
			contentMeta: {
				channel: 'live' | 'draft';
				source: 'cms' | 'fallback';
				fetchedAt: string | null;
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
