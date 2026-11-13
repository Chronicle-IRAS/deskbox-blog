export const prerender = false;

import type { APIContext } from 'astro';
import { site } from '../data/site';
import {
  listAllPublishedPosts,
  listSeries,
  listTags,
} from '../server/posts';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function GET(_context: APIContext): Response {
  const base = site.url.replace(/\/$/, '');
  const paths = new Set<string>([
    '/',
    '/blog/',
    '/tags/',
    '/archive/',
    '/series/',
    '/about/',
  ]);

  for (const post of listAllPublishedPosts()) {
    paths.add(`/blog/${post.slug}/`);
  }

  for (const tag of listTags()) {
    if (tag.count > 0) paths.add(`/tags/${tag.slug}/`);
  }

  for (const series of listSeries()) {
    paths.add(`/series/${encodeURIComponent(series.name)}/`);
  }

  const urls = [...paths]
    .sort()
    .map((path) => `  <url><loc>${escapeXml(`${base}${path}`)}</loc></url>`)
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
