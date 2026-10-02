// The home journey's idle timers: absent keys are the defaults, 0 switches a step off.
// npx tsx scripts/test-idle-timing.ts
import { IDLE_TIMING_DEFAULT, idleTiming } from '../src/lib/site/idle-timing.ts';

let failures = 0;
function check(name: string, cond: boolean) {
	console.log(`  ${cond ? '✓' : '✗'} ${name}`);
	if (!cond) failures++;
}

const absent = idleTiming(undefined);
check('absent → the defaults, in milliseconds', absent.glowAfterMs === 2000 && absent.beginAfterMs === 5000 && absent.nextAfterMs === 6000);
check('the defaults are what the page used before the keys existed', IDLE_TIMING_DEFAULT.glowAfterSeconds === 2 && IDLE_TIMING_DEFAULT.beginAfterSeconds === 5 && IDLE_TIMING_DEFAULT.nextAfterSeconds === 6);
check('a number is read', idleTiming({ nextAfterSeconds: 9 }).nextAfterMs === 9000);
check('a numeric string (how the CMS stores it) is read', idleTiming({ glowAfterSeconds: '3.5' }).glowAfterMs === 3500);
check('a blank string is the default', idleTiming({ glowAfterSeconds: '  ' }).glowAfterMs === 2000);
check('text that is not a number is the default', idleTiming({ beginAfterSeconds: 'soon' }).beginAfterMs === 5000);
check('a negative value is the default, never a negative timer', idleTiming({ nextAfterSeconds: -4 }).nextAfterMs === 6000);
check('0 is kept — it means off', idleTiming({ nextAfterSeconds: 0 }).nextAfterMs === 0 && idleTiming({ glowAfterSeconds: '0' }).glowAfterMs === 0);
check('one key set leaves the others at their defaults', idleTiming({ nextAfterSeconds: 12 }).glowAfterMs === 2000);
check('a non-object is read as absent', idleTiming('x').nextAfterMs === 6000 && idleTiming([1]).glowAfterMs === 2000);

console.log(failures ? `\n${failures} failed` : '\nAll passed');
process.exit(failures ? 1 : 0);
