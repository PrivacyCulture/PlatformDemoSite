// Offline test for responsive pictures: the module shared with Sorted (src/lib/site/responsive-image.ts)
// and the helpers the components use (src/lib/site/images.ts).
//   npx tsx scripts/test-responsive-image.ts
//
// responsive-image.ts is a byte-identical copy of Sorted's src/lib/responsive-image.ts. Both repos
// assert MODULE_SHA256 below. Copy the file across and update the constant in BOTH tests.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { responsive, sourceSrcset, imageAtWidth, responsiveArticleImages, SIZES } from '../src/lib/site/images';

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
	if (cond) console.log(`  ✓ ${name}`);
	else {
		failures++;
		console.error(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`);
	}
}
function eq(name: string, actual: unknown, expected: unknown) {
	const a = JSON.stringify(actual);
	const e = JSON.stringify(expected);
	check(name, a === e, `expected ${e}\n      got      ${a}`);
}

const MODULE_SHA256 = '741d9ac639650393492c56d357c74d9b4b7a7f8934325e6223c3dbe95cd2bd83';
const src = readFileSync(new URL('../src/lib/site/responsive-image.ts', import.meta.url), 'utf8');
check('responsive-image.ts is byte-identical to Sorted’s', createHash('sha256').update(src).digest('hex') === MODULE_SHA256, `now ${createHash('sha256').update(src).digest('hex')}`);

const lib = 'https://acct.blob.core.windows.net/platform-media/screenshots/dash-k3--w1920.webp';
const at = (w: number) => lib.replace('--w1920', `--w${w}`);

eq('a library picture gets every copy and the sizes hint', responsive(lib, SIZES.column), {
	srcset: `${at(480)} 480w, ${at(960)} 960w, ${at(1440)} 1440w, ${lib} 1920w`,
	sizes: SIZES.column
});
eq('a static file is drawn as before', responsive('/Images/screenshots/dashboard-screen.png', SIZES.column), {});
eq('an SVG is drawn as before', responsive('/brand/logo.svg', SIZES.logo), {});
eq('an empty address is drawn as before', responsive('', SIZES.logo), {});
eq('a <source> keeps a plain address', sourceSrcset('/Images/screenshots/dashboard-screen.webp'), '/Images/screenshots/dashboard-screen.webp');
check('a <source> gets the copies', sourceSrcset(lib).includes(`${at(480)} 480w`));
eq('a small logo is one copy', responsive('https://x/platform-media/brand/logo-k3--w240.webp', SIZES.logo).srcset, 'https://x/platform-media/brand/logo-k3--w240.webp 240w');

eq('one address: the smallest copy wide enough', imageAtWidth(lib, 900), at(960));
eq('one address: the largest when none is wide enough', imageAtWidth(lib, 4000), lib);
eq('one address: anything else as it is', imageAtWidth('/Images/mountainPath.webp', 960), '/Images/mountainPath.webp');

eq(
	'article pictures from the library become responsive and lazy',
	responsiveArticleImages(`<p>a <img src="${lib}" alt="x"></p>`, '736px'),
	`<p>a <img loading="lazy" decoding="async" srcset="${at(480)} 480w, ${at(960)} 960w, ${at(1440)} 1440w, ${lib} 1920w" sizes="736px" src="${lib}" alt="x"></p>`
);
eq('other article pictures are left alone', responsiveArticleImages('<p><img src="https://example.com/a.png" alt=""></p>'), '<p><img src="https://example.com/a.png" alt=""></p>');

if (failures) {
	console.error(`\n${failures} failed`);
	process.exit(1);
}
console.log('\nAll passed');
