import type { APIContext } from 'astro';
import { site } from '../data/site';
import { toAbsoluteUrl } from '../lib/seo';

export function GET(context: APIContext): Response {
  const base = context.site ?? new URL(site.url);
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /search/',
    '',
    `Sitemap: ${toAbsoluteUrl('/sitemap-index.xml', base)}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
