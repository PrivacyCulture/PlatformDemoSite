// The homepage FAQ drawer's settings: absent keys are the defaults.
// npx tsx scripts/test-faq-drawer.ts
import { FAQ_DRAWER_DEFAULT, faqDrawerCopy } from '../src/lib/site/faq-drawer.ts';

let failures = 0;
function check(name: string, cond: boolean) {
	console.log(`  ${cond ? '✓' : '✗'} ${name}`);
	if (!cond) failures++;
}

const absent = faqDrawerCopy(undefined);
check('absent → shown, with the default words', absent.show && absent.openLabel === FAQ_DRAWER_DEFAULT.openLabel && absent.allLink === FAQ_DRAWER_DEFAULT.allLink);
check('a blank label falls back to the default', faqDrawerCopy({ closeLabel: '   ' }).closeLabel === FAQ_DRAWER_DEFAULT.closeLabel);
check('a set label is used, trimmed', faqDrawerCopy({ allLink: ' All questions ' }).allLink === 'All questions');
check('show: off hides it', !faqDrawerCopy({ show: 'off' }).show);
check('any other show value keeps it', faqDrawerCopy({ show: 'on' }).show && faqDrawerCopy({ show: 'yes' }).show);
check('a non-object is read as absent', faqDrawerCopy('x').show && faqDrawerCopy([1]).openLabel === FAQ_DRAWER_DEFAULT.openLabel);

console.log(failures ? `\n${failures} failed` : '\nAll passed');
process.exit(failures ? 1 : 0);
