import { beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDb } from '../../src/server/db';
import {
  createSession,
  destroySession,
  findSession,
  hashPassword,
  verifyPassword,
} from '../../src/server/auth';

let db: DatabaseSync;

beforeEach(() => {
  db = openDb(':memory:');
});

describe('password hashing', () => {
  it('verifies the correct password', () => {
    const hash = hashPassword('correct horse battery staple');

    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(verifyPassword(hash, 'correct horse battery staple')).toBe(true);
  });

  it('rejects a wrong password or malformed hash', () => {
    const hash = hashPassword('correct');

    expect(verifyPassword(hash, 'wrong')).toBe(false);
    expect(verifyPassword('not-a-hash', 'correct')).toBe(false);
  });
});

describe('sessions', () => {
  it('creates, finds and destroys a session', () => {
    const { token, session } = createSession(db);

    expect(findSession(db, token)).toMatchObject({
      id: session.id,
      csrfToken: session.csrfToken,
    });

    destroySession(db, token);

    expect(findSession(db, token)).toBeUndefined();
  });

  it('rejects expired sessions and removes them', () => {
    const { token } = createSession(db);

    db.prepare('UPDATE sessions SET expires_at = ?').run(
      new Date(Date.now() - 1000).toISOString(),
    );

    expect(findSession(db, token)).toBeUndefined();
    expect(
      (db.prepare('SELECT COUNT(*) AS count FROM sessions').get() as {
        count: number;
      }).count,
    ).toBe(0);
  });
});
