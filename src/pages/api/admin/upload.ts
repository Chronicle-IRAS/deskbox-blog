export const prerender = false;

import type { APIContext } from 'astro';
import { getSession, verifyCsrf } from '../../../server/auth';
import { saveUpload } from '../../../server/uploads';

function error(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function POST(context: APIContext): Promise<Response> {
  const session = getSession(context);

  if (!session) {
    return error('未登录', 401);
  }

  const form = await context.request.formData();
  const csrf = String(form.get('csrf') ?? '');

  if (!verifyCsrf(context, csrf, session)) {
    return error('表单已过期，请重试', 403);
  }

  const file = form.get('image');

  if (!(file instanceof File) || file.size === 0) {
    return error('请选择图片');
  }

  try {
    const saved = await saveUpload(file);
    return new Response(JSON.stringify({ url: saved.path, width: saved.width, height: saved.height }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (uploadError) {
    return error(
      uploadError instanceof Error ? uploadError.message : '上传失败',
    );
  }
}
