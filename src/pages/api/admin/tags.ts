export const prerender = false;

import type { APIContext } from 'astro';
import { getSession, verifyCsrf } from '../../../server/auth';
import { createTag } from '../../../server/posts';

function fail(context: APIContext, message: string): Response {
  return context.redirect(
    `/admin/tags/?error=${encodeURIComponent(message)}`,
    303,
  );
}

export async function POST(context: APIContext): Promise<Response> {
  const session = getSession(context);

  if (!session) {
    return context.redirect('/login/', 303);
  }

  const form = await context.request.formData();
  const csrf = String(form.get('csrf') ?? '');

  if (!verifyCsrf(context, csrf, session)) {
    return fail(context, '表单已过期，请重试');
  }

  const name = String(form.get('name') ?? '').trim();
  const slug = String(form.get('slug') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();

  if (name.length < 1 || name.length > 20) {
    return fail(context, '标签名称需要 1–20 个字符');
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return fail(context, 'slug 只能使用小写字母、数字与连字符');
  }

  try {
    createTag({ slug, name, description: description || undefined });
  } catch (error) {
    return fail(
      context,
      error instanceof Error ? error.message : '标签创建失败',
    );
  }

  return context.redirect('/admin/tags/', 303);
}
