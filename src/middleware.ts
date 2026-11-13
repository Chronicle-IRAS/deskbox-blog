import { defineMiddleware } from 'astro:middleware';
import { randomBytes } from 'node:crypto';
import { getSession } from './server/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if ((path === '/admin' || path.startsWith('/admin/')) && !getSession(context)) {
    return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  const response = await next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  const nonce = randomBytes(18).toString('base64');
  const html = (await response.text()).replace(/<script\b/g, '<script nonce="' + nonce + '"');
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('Cache-Control', 'no-store');
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'nonce-" + nonce + "' 'wasm-unsafe-eval' https://giscus.app; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://giscus.app; frame-src https://giscus.app; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
});
