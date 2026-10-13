import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Inline every stylesheet, the main Tailwind sheet included (~95KB raw,
			// ~16KB gzipped), so no CSS request blocks first paint. After the first
			// page SvelteKit navigates client-side, so losing the separate cached
			// file costs one landing page, not every page.
			inlineStyleThreshold: 120000,
			adapter: adapter({
				out: 'build',
				precompress: true
			})
		})
	]
});
