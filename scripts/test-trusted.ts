// The "Trusted by" strip reads both a bare name and { name, src, href }.
// npx tsx scripts/test-trusted.ts
import { trustedEntries, isExternal } from '../src/lib/site/trusted.ts';

let failures = 0;
function check(name: string, cond: boolean) {
	console.log(`  ${cond ? '✓' : '✗'} ${name}`);
	if (!cond) failures++;
}

const plain = trustedEntries(['Schroders', 'SWIFT']);
check('bare names still draw, as names', plain.length === 2 && plain[0].name === 'Schroders' && !plain[0].src && !plain[0].href);
const mixed = trustedEntries(['Schroders', { name: 'SWIFT', src: '/media/swift.svg', href: 'https://swift.com' }]);
check('an object carries its logo and link', mixed[1].src === '/media/swift.svg' && mixed[1].href === 'https://swift.com');
check('blank extras read as none', trustedEntries([{ name: 'A', src: '', href: '' }])[0].src === '');
check('a javascript: link is dropped', trustedEntries([{ name: 'A', href: 'javascript:alert(1)' }])[0].href === '');
check('a protocol-relative logo is dropped', trustedEntries([{ name: 'A', src: '//evil.test/x.png' }])[0].src === '');
check('a logo with no name still draws', trustedEntries([{ name: '', src: '/a.png' }]).length === 1);
check('an empty entry is skipped', trustedEntries(['', { name: '', src: '' }, 7, null]).length === 0);
check('a non-list reads as empty', trustedEntries(undefined).length === 0 && trustedEntries('x').length === 0);
check('https links open elsewhere, site links do not', isExternal('https://a.test') && !isExternal('/pricing'));

console.log(failures ? `\n${failures} failed` : '\nAll passed');
process.exit(failures ? 1 : 0);
