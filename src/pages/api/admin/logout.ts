export const prerender = false;

import type { APIContext } from 'astro';
import {
  clearSessionCookie,
  destroySession,
  getSession,
  SESSION_COOKIE,
  verifyCsrf,
} from '../../../server/auth';
import { getDb } from '../../../server/db';

export async function POST(context: APIContext): Promise<Response> {
  const session = getSession(context);
  const form = await context.request.formData();
  const csrf = String(form.get('csrf') ?? '');

  if (session && verifyCsrf(context, csrf, session)) {
    const token = context.cookies.get(SESSION_COOKIE)?.value;

    if (token) destroySession(getDb(), token);
  }

  clearSessionCookie(context);

  return context.redirect('/login/', 303);
}
