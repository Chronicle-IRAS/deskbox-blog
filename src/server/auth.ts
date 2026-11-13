import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { APIContext } from 'astro';
import type { DatabaseSync } from 'node:sqlite';
import { getDb } from './db';

export const SESSION_COOKIE = 'deskbox_session';
export const CSRF_COOKIE = 'deskbox_csrf';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface Session {
  id: string;
  csrfToken: string;
  expiresAt: string;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const key = scryptSync(password, salt, 64).toString('hex');

  return `scrypt$${salt}$${key}`;
}

export function verifyPassword(stored: string, password: string): boolean {
  const [scheme, salt, key] = stored.split('$');

  if (scheme !== 'scrypt' || !salt || !key) return false;

  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(key, 'hex');

  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  );
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(
  db: DatabaseSync,
  csrfToken = randomBytes(32).toString('base64url'),
): { token: string; session: Session } {
  const token = randomBytes(32).toString('base64url');
  const id = tokenHash(token);
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  db.prepare(
    `INSERT INTO sessions (id, created_at, expires_at, csrf_token)
     VALUES (?, ?, ?, ?)`,
  ).run(id, createdAt, expiresAt, csrfToken);

  return { token, session: { id, csrfToken, expiresAt } };
}

export function findSession(
  db: DatabaseSync,
  token: string,
): Session | undefined {
  const row = db
    .prepare(
      `SELECT id, csrf_token, expires_at
       FROM sessions
       WHERE id = ?`,
    )
    .get(tokenHash(token)) as
    | { id: string; csrf_token: string; expires_at: string }
    | undefined;

  if (!row) return undefined;

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(row.id);
    return undefined;
  }

  return {
    id: row.id,
    csrfToken: row.csrf_token,
    expiresAt: row.expires_at,
  };
}

export function destroySession(db: DatabaseSync, token: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(tokenHash(token));
}

export function getSession(
  context: APIContext,
  db: DatabaseSync = getDb(),
): Session | undefined {
  const token = context.cookies.get(SESSION_COOKIE)?.value;

  return token ? findSession(db, token) : undefined;
}

export function setSessionCookie(
  context: APIContext,
  token: string,
): void {
  context.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
    secure: isSecureRequest(context),
  });
}

export function clearSessionCookie(context: APIContext): void {
  context.cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function ensureCsrfCookie(context: APIContext): string {
  const existing = context.cookies.get(CSRF_COOKIE)?.value;

  if (existing) return existing;

  const token = randomBytes(32).toString('base64url');

  context.cookies.set(CSRF_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
    secure: isSecureRequest(context),
  });

  return token;
}

export function verifyCsrf(
  context: APIContext,
  submitted: string | null,
  session?: Session,
): boolean {
  if (!submitted) return false;

  if (session) return submitted === session.csrfToken;

  const cookie = context.cookies.get(CSRF_COOKIE)?.value;

  return Boolean(cookie && cookie === submitted);
}

export function isSecureRequest(context: APIContext): boolean {
  const proto = context.request.headers.get('x-forwarded-proto');

  return context.url.protocol === 'https:' || proto === 'https';
}
