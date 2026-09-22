import { json } from '@sveltejs/kit';
import { contentStore } from '$lib/server/content-store';
import type { RequestHandler } from './$types';

/** Public health read for the CMS's "Ping" button. Holds no secrets. */
export const GET: RequestHandler = () =>
	json(contentStore.status(), { headers: { 'access-control-allow-origin': '*' } });
