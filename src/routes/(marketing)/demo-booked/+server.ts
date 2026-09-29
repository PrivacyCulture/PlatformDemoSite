import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * The demo page moves to this URL in place once a booking succeeds, so analytics
 * can count it. The booking details only live in that page's state, so a reload
 * or a direct visit goes back to the booking form.
 */
export const GET: RequestHandler = () => redirect(303, '/demo');
