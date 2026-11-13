export const prerender = false;

import { getDb, schemaVersion } from '../../server/db';

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function GET(): Response {
  try {
    const db = getDb();

    return json({ ok: true, schema: schemaVersion(db) });
  } catch (error) {
    console.error('[health] database check failed', error);
    return json({ ok: false }, 503);
  }
}
