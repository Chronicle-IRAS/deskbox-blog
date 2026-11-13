export const prerender = false;

import type { APIContext } from 'astro';
import { getPosts } from '../lib/posts';
import { getTags } from '../config';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export async function GET(context: APIContext): Promise<Response> {
  const base = context.site!.href.replace(/\/$/, '');
  const posts = await getPosts();
  const paths = new Set<string>([
    '/',
    '/blog/',
    '/tags/',
    '/archive/',
    '/series/',
    '/about/',
  ]);

  for (const post of posts) {
    paths.add(`/blog/${post.data.slug}/`);
  }

  for (const tag of getTags()) {
    if (posts.some((post) => post.data.tags.includes(tag.name))) paths.add(`/tags/${tag.slug}/`);
  }

  for (const name of new Set(posts.flatMap((post) => post.data.series ? [post.data.series.name] : []))) {
    paths.add(`/series/${encodeURIComponent(name)}/`);
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
