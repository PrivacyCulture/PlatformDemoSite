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
			// Inline the small per-component CSS files into a <style> block so they
			// don't each block first paint. The main Tailwind sheet stays a cached file.
			inlineStyleThreshold: 10240,
			adapter: adapter({
				out: 'build',
				precompress: true
			})
		})
	]
});
