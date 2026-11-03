// A contact update must save every property HubSpot has, and leave out only the ones it does
// not (or the values it will not take) — HubSpot itself refuses the whole update instead.
// Run: npx tsx scripts/test-hubspot-invalid-properties.ts
import { refusedProperties, sendWithoutRefused, isValidationError } from '../src/lib/demo/hubspot-invalid-properties';

let passed = 0;
const failures: string[] = [];
function ok(label: string, actual: unknown, expected: unknown) {
	if (JSON.stringify(actual) === JSON.stringify(expected)) passed++;
	else failures.push(`${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`);
}

// ── reading HubSpot's refusals ────────────────────────────────────────────────
const errorsShape = {
	status: 'error',
	category: 'VALIDATION_ERROR',
	errors: [
		{ message: 'Property "pc_demo_role" does not exist', code: 'PROPERTY_DOESNT_EXIST', context: { propertyName: ['pc_demo_role'] } },
		{ message: '1001 was not one of the allowed options', code: 'INVALID_OPTION', context: { propertyName: ['hubspot_owner_id'] } }
	]
};
ok('the errors[] shape', refusedProperties(errorsShape, ['pc_demo_role', 'hubspot_owner_id', 'email']), [
	{ name: 'pc_demo_role', code: 'PROPERTY_DOESNT_EXIST' },
	{ name: 'hubspot_owner_id', code: 'INVALID_OPTION' }
]);

const messageShape = {
	status: 'error',
	category: 'VALIDATION_ERROR',
	message:
		'Property values were not valid: [{"isValid":false,"message":"Property \\"pc_sla_tier\\" does not exist","error":"PROPERTY_DOESNT_EXIST","name":"pc_sla_tier"},{"isValid":false,"message":"Property \\"utm_source\\" does not exist","error":"PROPERTY_DOESNT_EXIST","name":"utm_source"}]'
};
ok('the message shape (JSON inside the message)', refusedProperties(messageShape, ['pc_sla_tier', 'utm_source', 'email']), [
	{ name: 'pc_sla_tier', code: 'PROPERTY_DOESNT_EXIST' },
	{ name: 'utm_source', code: 'PROPERTY_DOESNT_EXIST' }
]);
ok('plain wording only', refusedProperties({ message: 'Property "pc_stranger" does not exist' }, ['pc_stranger']), [
	{ name: 'pc_stranger', code: 'PROPERTY_DOESNT_EXIST' }
]);
ok('a name that was not sent is never returned', refusedProperties(errorsShape, ['email']), []);
ok('nothing readable → empty (the caller then goes one at a time)', refusedProperties({ message: 'Something else went wrong' }, ['email']), []);
ok('not an object → empty', refusedProperties('oops', ['email']), []);
ok('a 400 validation error counts', isValidationError(400, { category: 'VALIDATION_ERROR' }), true);
ok('a 400 with no category counts', isValidationError(400, null), true);
ok('a 404 does not', isValidationError(404, {}), false);
ok('a 401 does not', isValidationError(401, { category: 'INVALID_AUTHENTICATION' }), false);

// ── a fake HubSpot ────────────────────────────────────────────────────────────
type Shape = 'errors' | 'message' | 'unreadable';
function fakeHubSpot(known: Set<string>, owners: Set<string>, shape: Shape) {
	const stored: Record<string, string> = {};
	const calls: string[][] = [];
	const send = async (props: Record<string, string>) => {
		calls.push(Object.keys(props));
		const missing = Object.keys(props).filter((n) => !known.has(n));
		const badOwner = props.hubspot_owner_id !== undefined && !owners.has(props.hubspot_owner_id);
		if (missing.length || badOwner) {
			const all = [
				...missing.map((n) => ({ name: n, code: 'PROPERTY_DOESNT_EXIST' })),
				...(badOwner ? [{ name: 'hubspot_owner_id', code: 'INVALID_OPTION' }] : [])
			];
			const body =
				shape === 'errors'
					? { category: 'VALIDATION_ERROR', errors: all.map((a) => ({ code: a.code, context: { propertyName: [a.name] } })) }
					: shape === 'message'
						? { category: 'VALIDATION_ERROR', message: `Property values were not valid: ${JSON.stringify(all.map((a) => ({ isValid: false, name: a.name, error: a.code })))}` }
						: { category: 'VALIDATION_ERROR', message: 'Invalid input.' };
			throw Object.assign(new Error('400'), { status: 400, body });
		}
		Object.assign(stored, props);
	};
	return { send, stored, calls };
}

const KNOWN = new Set(['firstname', 'lastname', 'email', 'company', 'phone', 'hubspot_owner_id']);
const booking = {
	firstname: 'Ann',
	lastname: 'Lee',
	email: 'ann@acme.com',
	company: 'Acme',
	pc_demo_role: 'DPO',
	pc_sla_tier: 'P1',
	pc_demo_website: 'Privacy Culture Platform website (privacyculture.ai)',
	hubspot_owner_id: '1001'
};

for (const shape of ['errors', 'message', 'unreadable'] as const) {
	const hs = fakeHubSpot(KNOWN, new Set(['77']), shape);
	const missing: string[] = [];
	const result = await sendWithoutRefused(booking, hs.send, { onMissing: (n) => missing.push(n) });
	ok(`${shape}: everything HubSpot has is saved`, hs.stored, { firstname: 'Ann', lastname: 'Lee', email: 'ann@acme.com', company: 'Acme' });
	ok(`${shape}: the rest is reported, not saved`, result.skipped.map((s) => s.name).sort(), ['hubspot_owner_id', 'pc_demo_role', 'pc_demo_website', 'pc_sla_tier']);
	ok(`${shape}: a fake owner is not treated as a missing property`, missing.includes('hubspot_owner_id'), false);
	if (shape !== 'unreadable') ok(`${shape}: two requests — refused once, then the rest`, hs.calls.length, 2);
	else ok('unreadable: falls back to one request per property', hs.calls.length, 1 + Object.keys(booking).length);
}

{
	const hs = fakeHubSpot(new Set([...KNOWN, 'pc_demo_role', 'pc_sla_tier', 'pc_demo_website']), new Set(['1001']), 'errors');
	const result = await sendWithoutRefused(booking, hs.send);
	ok('once everything exists: one request, all saved', [hs.calls.length, result.saved.length, result.skipped.length], [1, 8, 0]);
}
{
	const hs = fakeHubSpot(KNOWN, new Set(['1001']), 'errors');
	const result = await sendWithoutRefused(booking, hs.send, { skip: (n) => n === 'pc_demo_role' || n === 'pc_sla_tier' || n === 'pc_demo_website' });
	ok('properties known to be missing are skipped without asking', [hs.calls.length, hs.calls[0].includes('pc_demo_role')], [1, false]);
	ok('and still reported', result.skipped.length, 3);
}
{
	const hs = fakeHubSpot(new Set(), new Set(), 'errors');
	const result = await sendWithoutRefused({ pc_a: 'x' }, hs.send);
	ok('nothing HubSpot has: nothing saved, no error', [result.saved, result.skipped.map((s) => s.name)], [[], ['pc_a']]);
}
{
	let thrown = '';
	try {
		await sendWithoutRefused({ email: 'a@b.com' }, async () => {
			throw Object.assign(new Error('Unauthorized'), { status: 401, body: { category: 'INVALID_AUTHENTICATION' } });
		});
	} catch (e) {
		thrown = (e as Error).message;
	}
	ok('a bad token is still thrown, not swallowed', thrown, 'Unauthorized');
}

if (failures.length) {
	console.error(`${failures.length} failed, ${passed} passed:\n  ${failures.join('\n  ')}`);
	process.exit(1);
}
console.log(`hubspot refused properties: ${passed} passed`);
