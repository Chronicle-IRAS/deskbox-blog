export const prerender = false;

import type { APIContext } from 'astro';
import {
  apiError,
  csrfFrom,
  json,
  readJson,
  requireApiCsrf,
  requireApiSession,
  requireVersion,
} from '../../../../../server/api';
import { getDb } from '../../../../../server/db';
import { notFound } from '../../../../../server/errors';
import { invalidateOgCache } from '../../../../../server/og';
import { publishPost } from '../../../../../server/posts';

export async function POST(context: APIContext): Promise<Response> {
  try {
    const session = await requireApiSession(context);
    const id = context.params.id;

    if (!id) throw notFound();

    const body = await readJson<Record<string, unknown>>(context);

    requireApiCsrf(context, session, csrfFrom(context, body));

    const version = requireVersion(body);
    const result = publishPost(id, getDb(), version);

    await invalidateOgCache(result.slug);

    return json({
      ...result,
      publicUrl: `/blog/${result.slug}/`,
    });
  } catch (error) {
    return apiError(error);
  }
}
