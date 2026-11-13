export const prerender = false;

import type { APIContext } from 'astro';
import {
  apiError,
  json,
  readJson,
  requireApiSession,
} from '../../../server/api';
import { validation } from '../../../server/errors';
import { renderMarkdown } from '../../../server/render';

export async function POST(context: APIContext): Promise<Response> {
  try {
    await requireApiSession(context);

    const body = await readJson<{ title?: unknown; bodyMd?: unknown }>(context);

    if (typeof body.bodyMd !== 'string') {
      throw validation('正文不能为空', { bodyMd: '正文不能为空' });
    }

    const rendered = await renderMarkdown(body.bodyMd);

    return json(rendered);
  } catch (error) {
    return apiError(error);
  }
}
