import type { APIContext } from 'astro';
import { getSession, verifyCsrf, type Session } from './auth';
import { ApiError, validation } from './errors';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function apiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return json(error.toBody(), error.status);
  }

  console.error('[admin-api] unexpected error', error);

  return json(
    {
      error: {
        code: 'INTERNAL',
        message: '服务器暂时不可用，请稍后再试',
      },
    },
    500,
  );
}

export async function requireApiSession(context: APIContext): Promise<Session> {
  const session = getSession(context);

  if (!session) {
    throw new ApiError('AUTH', '未登录', 401);
  }

  return session;
}

export function requireApiCsrf(
  context: APIContext,
  session: Session,
  submitted: string | null,
): void {
  if (!verifyCsrf(context, submitted, session)) {
    throw new ApiError('CSRF', '表单已过期，请刷新后重试', 403);
  }
}

export function csrfFrom(
  context: APIContext,
  body?: Record<string, unknown>,
): string | null {
  const header = context.request.headers.get('x-csrf-token');

  if (header) return header;

  const value = body?.csrf;

  return typeof value === 'string' ? value : null;
}

export async function readJson<T>(context: APIContext): Promise<T> {
  try {
    return (await context.request.json()) as T;
  } catch {
    throw validation('请求体不是合法 JSON');
  }
}

export function requireVersion(body: unknown): number {
  const value = Number((body as { version?: unknown } | null)?.version);

  if (!Number.isInteger(value) || value < 1) {
    throw validation('缺少有效的版本号', { version: '缺少有效的版本号' });
  }

  return value;
}
