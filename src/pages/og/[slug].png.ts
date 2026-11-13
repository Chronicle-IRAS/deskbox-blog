import type { APIContext } from 'astro';
import { getPosts, fmtDate, readingMinutes } from '../../lib/posts';
import { ogPng } from '../../lib/og';
import { site } from '../../config';

export async function getStaticPaths() {
  const posts = await getPosts();
  return [
    { params: { slug: 'default' }, props: { title: site.description, kicker: 'BLOG', foot: '技术 · 阅读 · 生活' } },
    ...posts.map((p) => ({
      params: { slug: p.data.slug },
      props: { title: p.data.title, cover: (p.data.cover as any)?.fsPath, kicker: fmtDate(p.data.pubDate), foot: `${(p.data.tags as string[]).map((t) => '#' + t).join('  ') || '#随笔'}   ·   约 ${readingMinutes(p.body ?? '')} 分钟` },
    })),
  ];
}
export async function GET({ props }: APIContext) {
  const png = await ogPng(props as any);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
