
import type { APIContext } from 'astro';
import { getPosts, fmtDate } from '../../lib/posts';
import { ogPng } from '../../lib/og';
import { site } from '../../config';

export async function GET({ params }: APIContext) {
  const post = (await getPosts()).find((p) => p.data.slug === params.slug);
  if (!post && params.slug !== 'default') return new Response('Not Found', { status: 404 });
  const png = await ogPng({
    title: post?.data.title ?? site.description,
    kicker: post ? fmtDate(post.data.pubDate) : 'BLOG',
    foot: post?.data.tags.join(' · ') ?? site.name,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
