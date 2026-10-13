// The hero still is found by naming convention beside the clip. Offline.
import assert from 'node:assert/strict';
import { heroPosterPaths } from '../src/lib/journey/hero-poster';

const p = heroPosterPaths('/src/lib/assets/clips/Mountain/start.mp4');
assert.deepEqual(p, {
	landscape: '/src/lib/assets/clips/Mountain/start-poster.webp',
	portrait: '/src/lib/assets/clips/Mountain/start-poster-portrait.webp'
});
assert.equal(heroPosterPaths('  /src/a/b.MP4 ')?.landscape, '/src/a/b-poster.webp', 'trimmed, any case');
assert.equal(heroPosterPaths('/src/a/b.webm')?.portrait, '/src/a/b-poster-portrait.webp');
// Not bundled: a static file cannot be checked for existence at build time, so no poster.
assert.equal(heroPosterPaths('/clips/start.mp4'), null);
assert.equal(heroPosterPaths(''), null);
assert.equal(heroPosterPaths('/src/a/start'), null, 'no extension');
assert.equal(heroPosterPaths('/src/a/start.png'), null, 'not a clip');
assert.equal(heroPosterPaths(undefined as unknown as string), null);
console.log('hero-poster: all assertions passed');
