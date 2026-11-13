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
} from '../../../../server/api';
import { getDb } from '../../../../server/db';
import { notFound } from '../../../../server/errors';
import { invalidateOgCache } from '../../../../server/og';
import {
  getAdminPost,
  softDeletePost,
  upsertPost,
} from '../../../../server/posts';
import { renderMarkdown } from '../../../../server/render';
import type {
  AdminPost,
  SavePostInput,
  SavePostResult,
} from '../../../../server/types';
import { validatePostInput } from '../../../../server/validation';

function result(post: AdminPost): SavePostResult {
  return {
    id: post.id,
    slug: post.slug,
    version: post.version,
    status: post.draft ? 'draft' : 'published',
    updatedAt: post.updatedAt,
  };
}

export async function PATCH(context: APIContext): Promise<Response> {
  try {
    const session = await requireApiSession(context);
    const id = context.params.id;

    if (!id) throw notFound();

    const body = await readJson<SavePostInput & Record<string, unknown>>(context);

    requireApiCsrf(context, session, csrfFrom(context, body));

    const version = requireVersion(body);
    const db = getDb();
    const existing = getAdminPost(id, db);

    if (!existing) throw notFound();

    const validated = validatePostInput(body, db, existing);
    const rendered = await renderMarkdown(validated.bodyMd);

    const post = upsertPost(
      {
        id,
        ...validated,
        coverPath: validated.coverPath ?? existing.coverPath,
        coverAlt: validated.coverAlt ?? existing.coverAlt,
        html: rendered.html,
        headings: rendered.headings,
        draft: existing.draft,
        updatedDate: existing.updatedDate,
        canonical: existing.canonical,
        ogPath: existing.ogPath,
        readingMinutes: rendered.readingMinutes,
      },
      db,
      version,
    );

    const admin = getAdminPost(post.id, db);

    if (!admin) throw new Error('文章保存后无法读取');

    await invalidateOgCache(admin.slug);

    return json(result(admin));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(context: APIContext): Promise<Response> {
  try {
    const session = await requireApiSession(context);
    const id = context.params.id;

    if (!id) throw notFound();

    const body = await readJson<Record<string, unknown>>(context);

    requireApiCsrf(context, session, csrfFrom(context, body));

    const version = requireVersion(body);
    const deleted = softDeletePost(id, getDb(), version);

    await invalidateOgCache(deleted.slug);

    return json({
      id: deleted.id,
      slug: deleted.slug,
      status: 'deleted',
      version: deleted.version,
      updatedAt: deleted.updatedAt,
    });
  } catch (error) {
    return apiError(error);
  }
}
