import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { dayKey } from './format';
import { readingTime } from './reading-time';

export type BlogEntry = CollectionEntry<'blog'>;

export interface PostSummary {
  slug: string;
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  readingMinutes: number;
  cover?: ImageMetadata;
  coverAlt?: string;
}

export interface PublishedOptions {
  includeDrafts?: boolean;
  now?: Date;
}

export function getPostSlug(post: BlogEntry): string {
  return post.data.slug;
}

export function isPublished(post: BlogEntry, opts: PublishedOptions = {}): boolean {
  if (post.data.draft && !opts.includeDrafts) return false;

  const pubDay = dayKey(post.data.pubDate);
  const nowDay = dayKey(opts.now ?? new Date());
  return pubDay <= nowDay;
}

export function sortPosts<T extends BlogEntry>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const byDate = b.data.pubDate.getTime() - a.data.pubDate.getTime();
    return byDate !== 0 ? byDate : getPostSlug(a).localeCompare(getPostSlug(b));
  });
}

export function assertUniqueSlugs(posts: BlogEntry[]): void {
  const seen = new Map<string, BlogEntry>();

  for (const post of posts) {
    const slug = getPostSlug(post);
    const previous = seen.get(slug);
    if (previous) {
      throw new Error(`Duplicate blog slug "${slug}" in "${previous.id}" and "${post.id}".`);
    }
    seen.set(slug, post);
  }
}

export function toPostSummary(post: BlogEntry): PostSummary {
  return {
    slug: getPostSlug(post),
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    updatedDate: post.data.updatedDate,
    tags: post.data.tags,
    readingMinutes: readingTime(post.body ?? ''),
    cover: post.data.cover,
    coverAlt: post.data.coverAlt,
  };
}

export async function getPublishedPosts(opts: PublishedOptions = {}): Promise<BlogEntry[]> {
  const posts = await getCollection('blog');
  assertUniqueSlugs(posts);
  return sortPosts(posts.filter((post) => isPublished(post, opts)));
}
