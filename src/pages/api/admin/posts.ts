export const prerender = false;

import type { APIContext } from 'astro';
import {
  apiError,
  csrfFrom,
  json,
  readJson,
  requireApiCsrf,
  requireApiSession,
} from '../../../server/api';
import { getSession, verifyCsrf } from '../../../server/auth';
import { getDb } from '../../../server/db';
import {
  findPostIdBySlug,
  getAdminPost,
  publishPost,
  searchAdminPosts,
  softDeletePost,
  unpublishPost,
  upsertPost,
} from '../../../server/posts';
import { invalidateOgCache } from '../../../server/og';
import { saveUpload } from '../../../server/uploads';
import { renderMarkdown } from '../../../server/render';
import type {
  AdminPost,
  SavePostInput,
  SavePostResult,
} from '../../../server/types';
import { validatePostInput } from '../../../server/validation';

function fail(context: APIContext, message: string): Response {
  return context.redirect(
    `/admin/?error=${encodeURIComponent(message)}`,
    303,
  );
}

function formString(form: FormData, key: string): string {
  return String(form.get(key) ?? '').trim();
}

function result(post: AdminPost): SavePostResult {
  return {
    id: post.id,
    slug: post.slug,
    version: post.version,
    status: post.draft ? 'draft' : 'published',
    updatedAt: post.updatedAt,
  };
}

async function postJson(context: APIContext): Promise<Response> {
  try {
    const session = await requireApiSession(context);
    const body = await readJson<SavePostInput & Record<string, unknown>>(context);

    requireApiCsrf(context, session, csrfFrom(context, body));

    const db = getDb();
    const validated = validatePostInput(body, db);
    const rendered = await renderMarkdown(validated.bodyMd);

    const post = upsertPost(
      {
        ...validated,
        html: rendered.html,
        headings: rendered.headings,
        draft: true,
        readingMinutes: rendered.readingMinutes,
      },
      db,
    );

    const admin = getAdminPost(post.id, db);

    if (!admin) throw new Error('文章创建后无法读取');

    return json(result(admin), 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(context: APIContext): Promise<Response> {
  try {
    await requireApiSession(context);

    const statusParam = context.url.searchParams.get('status');
    const status =
      statusParam === 'draft' ||
      statusParam === 'published' ||
      statusParam === 'trash'
        ? statusParam
        : 'all';

    const page = searchAdminPosts({
      status,
      q: context.url.searchParams.get('q') ?? '',
      page: Number(context.url.searchParams.get('page') ?? 1),
      pageSize: Number(context.url.searchParams.get('pageSize') ?? 20),
    });

    return json(page);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(context: APIContext): Promise<Response> {
  const contentType = context.request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return postJson(context);
  }

  const session = getSession(context);

  if (!session) {
    return context.redirect('/login/', 303);
  }

  const form = await context.request.formData();
  const csrf = String(form.get('csrf') ?? '');

  if (!verifyCsrf(context, csrf, session)) {
    return fail(context, '表单已过期，请重试');
  }

  const db = getDb();
  const action = formString(form, 'action') || 'save';
  const id = formString(form, 'id');
  const existing = id ? getAdminPost(id, db) : undefined;

  if (id && !existing) {
    return fail(context, '文章不存在');
  }

  if (action === 'unpublish') {
    if (!existing) return fail(context, '文章不存在');
    unpublishPost(existing.id, db);
    await invalidateOgCache(existing.slug);
    return context.redirect('/admin/', 303);
  }

  if (action === 'delete') {
    if (!existing) return fail(context, '文章不存在');
    softDeletePost(existing.id, db);
    await invalidateOgCache(existing.slug);
    return context.redirect('/admin/', 303);
  }

  // The list view sends only id/csrf/action; the editor sends the full form.
  if (action === 'publish' && !formString(form, 'title')) {
    if (!existing) return fail(context, '文章不存在');
    publishPost(existing.id, db);
    await invalidateOgCache(existing.slug);
    return context.redirect('/admin/', 303);
  }

  const title = formString(form, 'title');
  const slug = formString(form, 'slug');
  const description = formString(form, 'description');
  const pubDate = formString(form, 'pubDate');
  const bodyMd = formString(form, 'bodyMd');
  const tagText = formString(form, 'tags');
  const seriesName = formString(form, 'seriesName');
  const seriesOrderText = formString(form, 'seriesOrder');
  const coverFile = form.get('cover');
  let coverPath = existing?.coverPath;
  let coverAlt = formString(form, 'coverAlt') || existing?.coverAlt;

  if (title.length < 1 || title.length > 80) {
    return fail(context, '标题需要 1–80 个字符');
  }

  if (description.length < 20 || description.length > 160) {
    return fail(context, '摘要需要 20–160 个字符');
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return fail(context, 'slug 只能使用小写字母、数字与连字符');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(pubDate) || Number.isNaN(Date.parse(pubDate))) {
    return fail(context, '发布日期格式不正确');
  }

  if (!bodyMd) {
    return fail(context, '正文不能为空');
  }

  if (existing && !existing.draft && slug !== existing.slug) {
    return fail(context, '文章发布后不能修改 slug');
  }

  const slugOwner = findPostIdBySlug(slug, db);

  if (slugOwner && slugOwner !== existing?.id) {
    return fail(context, 'slug 已存在，请换一个');
  }

  const tags = [
    ...new Set(
      tagText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];

  if (tags.length > 3) {
    return fail(context, '最多使用 3 个标签');
  }

  const knownTags = new Set(
    (
      db.prepare('SELECT name FROM tags').all() as Array<{ name: string }>
    ).map((row) => row.name),
  );

  for (const tag of tags) {
    if (!knownTags.has(tag)) {
      return fail(context, `未知标签 "${tag}"`);
    }
  }

  let series: { name: string; order: number } | undefined;

  if (seriesName) {
    const order = Number(seriesOrderText);

    if (!Number.isInteger(order) || order < 1) {
      return fail(context, '系列顺序必须是正整数');
    }

    series = { name: seriesName, order };
  }

  if (coverFile instanceof File && coverFile.size > 0) {
    try {
      const uploaded = await saveUpload(coverFile);
      coverPath = uploaded.path;
    } catch (error) {
      return fail(
        context,
        error instanceof Error ? error.message : '封面上传失败',
      );
    }
  }

  if (coverPath && !coverAlt) {
    return fail(context, '有封面时必须填写封面说明');
  }

  const rendered = await renderMarkdown(bodyMd);
  const draft =
    action === 'publish' ? true : (existing?.draft ?? true);

  try {
    const post = upsertPost(
      {
        id: existing?.id,
        slug,
        title,
        description,
        bodyMd,
        html: rendered.html,
        headings: rendered.headings,
        tags,
        series,
        draft,
        pubDate,
        updatedDate: existing?.updatedDate,
        canonical: existing?.canonical,
        coverPath,
        coverAlt,
        ogPath: existing?.ogPath,
        readingMinutes: rendered.readingMinutes,
      },
      db,
    );

    if (action === 'publish') {
      publishPost(post.id, db);
    }

    await invalidateOgCache(post.slug);

    return context.redirect(
      `/admin/posts/${post.id}/`,
      303,
    );
  } catch (error) {
    console.error('[admin] save failed', error);

    return fail(
      context,
      error instanceof Error ? error.message : '保存失败，请稍后再试',
    );
  }
}
