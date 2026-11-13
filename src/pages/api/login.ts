export const prerender = false;

import type { APIContext } from 'astro';
import {
  createSession,
  setSessionCookie,
  verifyCsrf,
  verifyPassword,
} from '../../server/auth';
import { getDb } from '../../server/db';

export async function POST(context: APIContext): Promise<Response> {
  const form = await context.request.formData();
  const csrf = String(form.get('csrf') ?? '');
  const password = String(form.get('password') ?? '');

  if (!verifyCsrf(context, csrf)) {
    return context.redirect('/login/?error=csrf', 303);
  }

  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  const username = String(form.get('username') ?? '');
  const expectedUsername = process.env.ADMIN_USERNAME;
  const passwordMatches = storedHash ? verifyPassword(storedHash, password) : false;

  if (!expectedUsername || username !== expectedUsername || !passwordMatches) {
    return context.redirect('/login/?error=1', 303);
  }

  const { token } = createSession(getDb());

  setSessionCookie(context, token);

  return context.redirect('/admin/', 303);
}
