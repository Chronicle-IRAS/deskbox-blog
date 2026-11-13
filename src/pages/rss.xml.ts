import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/posts';
import { site } from '../config';

export async function GET(ctx: APIContext) {
  const posts = await getPosts();
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return rss({
    title: site.name,
    description: site.description,
    site: new URL(`${base}/`, ctx.site!).href,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `${base}/blog/${p.data.slug}/`,
      categories: p.data.tags,
    })),
    customData: `<language>zh-CN</language>`,
  });
}
