import type { DatabaseSync } from 'node:sqlite';
import { validation } from './errors';
import type { AdminPost, SavePostInput } from './types';

export interface ValidatedPost {
  title: string;
  slug: string;
  description: string;
  bodyMd: string;
  pubDate: string;
  tags: string[];
  series?: { name: string; order: number };
  coverPath?: string;
  coverAlt?: string;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validatePostInput(
  input: SavePostInput,
  db: DatabaseSync,
  existing?: AdminPost,
): ValidatedPost {
  const fields: Record<string, string> = {};
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const slug = typeof input.slug === 'string' ? input.slug.trim() : '';
  const description =
    typeof input.description === 'string' ? input.description.trim() : '';
  const bodyMd = typeof input.bodyMd === 'string' ? input.bodyMd : '';
  const pubDate =
    typeof input.pubDate === 'string' ? input.pubDate.trim() : '';

  if (title.length < 1 || title.length > 80) {
    fields.title = '标题需要 1–80 个字符';
  }

  if (!SLUG.test(slug)) {
    fields.slug = 'slug 只能使用小写字母、数字与连字符';
  }

  if (description.length < 20 || description.length > 160) {
    fields.description = '摘要需要 20–160 个字符';
  }

  if (!bodyMd.trim()) {
    fields.bodyMd = '正文不能为空';
  }

  if (!DATE.test(pubDate) || Number.isNaN(Date.parse(pubDate))) {
    fields.pubDate = '发布日期格式不正确';
  }

  if (existing && !existing.draft && slug !== existing.slug) {
    fields.slug = '文章发布后不能修改 slug';
  }

  if (slug && SLUG.test(slug)) {
    const owner = db
      .prepare('SELECT id FROM posts WHERE slug = ? AND id != ?')
      .get(slug, existing?.id ?? '') as { id: string } | undefined;

    if (owner) fields.slug = 'slug 已存在，请换一个';
  }

  const tags = Array.isArray(input.tags)
    ? [...new Set(input.tags.map((tag) => String(tag).trim()).filter(Boolean))]
    : [];

  if (tags.length > 3) {
    fields.tags = '最多使用 3 个标签';
  } else if (tags.length > 0) {
    const known = new Set(
      (db.prepare('SELECT name FROM tags').all() as Array<{ name: string }>).map(
        (row) => row.name,
      ),
    );

    const unknown = tags.find((tag) => !known.has(tag));

    if (unknown) fields.tags = `未知标签 "${unknown}"`;
  }

  let series: { name: string; order: number } | undefined;

  if (input.series) {
    const name = String(input.series.name ?? '').trim();
    const order = Number(input.series.order);

    if (!name) fields.series = '系列名称不能为空';
    else if (!Number.isInteger(order) || order < 1) {
      fields.series = '系列顺序必须是正整数';
    } else {
      series = { name, order };
    }
  }

  const coverPath =
    typeof input.coverPath === 'string' && input.coverPath.trim()
      ? input.coverPath.trim()
      : undefined;

  if (coverPath && !/^\/uploads\/[A-Za-z0-9._-]+$/.test(coverPath)) {
    fields.coverPath = '封面路径不合法';
  }

  const coverAlt =
    typeof input.coverAlt === 'string' && input.coverAlt.trim()
      ? input.coverAlt.trim()
      : undefined;

  if (coverPath && !coverAlt) {
    fields.coverAlt = '有封面时必须填写封面说明';
  }

  if (Object.keys(fields).length > 0) {
    throw validation('请检查表单字段', fields);
  }

  return {
    title,
    slug,
    description,
    bodyMd,
    pubDate,
    tags,
    series,
    coverPath,
    coverAlt,
  };
}
