import type { APIContext } from 'astro';
import sharp from 'sharp';
import { formatDate } from '../../lib/format';
import { renderOgSvg } from '../../lib/og';
import {
  getPublishedPosts,
  toPostSummary,
  type BlogEntry,
} from '../../lib/posts';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();

  return posts.map((post) => ({
    params: { slug: post.data.slug },
    props: { post },
  }));
}

export async function GET({ props }: APIContext) {
  const { post } = props as { post: BlogEntry };
  const summary = toPostSummary(post);

  const svg = renderOgSvg({
    title: post.data.title,
    description: post.data.description,
    date: formatDate(post.data.pubDate),
    minutes: summary.readingMinutes,
    tags: summary.tags,
  });

  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
