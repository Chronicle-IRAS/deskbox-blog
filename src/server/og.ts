import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { formatDate } from '../lib/format';
import { renderOgSvg } from '../lib/admin-og';
import type { PostRecord } from './types';

const DATA_DIR = process.env.BLOG_DATA_DIR ?? 'shared';
const OG_DIR = join(DATA_DIR, 'og');

function ogFile(slug: string): string {
  return join(OG_DIR, `brand-v3-${slug}.png`);
}

async function render(post: PostRecord): Promise<Buffer> {
  const svg = renderOgSvg({
    title: post.title,
    description: post.description,
    date: formatDate(new Date(post.pubDate)),
    minutes: post.readingMinutes,
    tags: post.tags,
  });

  return sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toBuffer();
}

export async function getOrCreateOg(post: PostRecord): Promise<Buffer> {
  const file = ogFile(post.slug);

  try {
    return await readFile(file);
  } catch {
    const png = await render(post);

    try {
      await mkdir(OG_DIR, { recursive: true });
      await writeFile(file, png);
    } catch (error) {
      console.error('[og] cache write failed', error);
    }

    return png;
  }
}

export async function invalidateOgCache(slug: string): Promise<void> {
  await rm(ogFile(slug), { force: true });
}
