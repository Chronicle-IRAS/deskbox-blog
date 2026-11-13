import { getCollection, type CollectionEntry } from 'astro:content';
import { listAllPublishedPosts, getAdminPost } from '../server/posts';
import type { Heading } from '../server/types';
import { site } from '../config';

export type Post = CollectionEntry<'blog'> & { runtime?: { html: string; headings: Heading[]; coverPath?: string } };

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: site.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
/** 站点时区下的 YYYY-MM-DD */
export const dayKey = (d: Date) => dayFmt.format(d);
export const fmtDate = (d: Date) => dayKey(d).replaceAll('-', '.');
export const fmtShort = (d: Date) => dayKey(d).slice(5).replace('-', '.');
export const year = (d: Date) => dayKey(d).slice(0, 4);

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;
function plain(md: string) {
  return md
    .replace(/^import .*$/gm, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}
/** 字数：汉字按字、英文按词 */
export function wordCount(md: string) {
  const t = plain(md);
  const cjk = (t.match(CJK) ?? []).length;
  const latin = t.replace(CJK, ' ').match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  return cjk + latin;
}
/** 阅读时间：每分钟 300 汉字或 200 英文词，至少 1 分钟 */
export function readingMinutes(md: string) {
  const t = plain(md);
  const cjk = (t.match(CJK) ?? []).length;
  const latin = t.replace(CJK, ' ').match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  return Math.max(1, Math.ceil(cjk / 300 + latin / 200));
}

/** 草稿与（站点时区）未来日期的文章在构建期排除 */
export function isPublished(p: Post, now = new Date()) {
  return !p.data.draft && dayKey(p.data.pubDate) <= dayKey(now);
}

export async function getPosts(): Promise<Post[]> {
  if (process.env.BLOG_DB_PATH) {
    return listAllPublishedPosts().map((p): Post => ({
      id: p.id, collection: 'blog', body: getAdminPost(p.id)?.bodyMd ?? '',
      data: { slug: p.slug, title: p.title, description: p.description, pubDate: new Date(p.pubDate),
        updatedDate: p.updatedDate ? new Date(p.updatedDate) : undefined, tags: p.tags,
        series: p.series, draft: false, lang: 'zh-CN', coverAlt: p.coverAlt },
      runtime: { html: p.html, headings: p.headings, coverPath: p.coverPath },
    }));
  }
  const all = await getCollection('blog');
  const seen = new Set<string>();
  for (const p of all) {
    if (seen.has(p.data.slug)) throw new Error(`重复的 slug: ${p.data.slug}`);
    seen.add(p.data.slug);
  }
  return all
    .filter((p) => isPublished(p))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.data.slug.localeCompare(b.data.slug));
}

export async function getStats() {
  const posts = await getPosts();
  const words = posts.reduce((s, p) => s + wordCount(p.body ?? ''), 0);
  const first = posts.at(-1)?.data.pubDate;
  const last = posts[0]?.data.pubDate;
  const days = first ? Math.max(1, Math.round((Date.now() - first.getTime()) / 86400000)) : 0;
  const tagSet = new Set(posts.flatMap((p) => p.data.tags));
  return { posts: posts.length, words, days, first, last, tags: tagSet.size };
}
