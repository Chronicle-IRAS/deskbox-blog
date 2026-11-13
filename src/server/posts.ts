import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { getDb } from './db';
import { conflict, notFound } from './errors';
import type {
  AdminListQuery,
  AdminPost,
  AdminPostPage,
  Heading,
  PostInput,
  PostPage,
  PostQuery,
  PostRecord,
  SavePostResult,
  SeriesGroup,
  TagSummary,
} from './types';

interface AdminRow extends PostRow {
  body_md: string;
  draft: number;
  canonical: string | null;
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at: string | null;
}

interface PostRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  html: string;
  headings_json: string;
  tags_json: string;
  series_name: string | null;
  series_order: number | null;
  pub_date: string;
  updated_date: string | null;
  reading_minutes: number;
  cover_path: string | null;
  cover_alt: string | null;
  og_path: string | null;
}

const PUBLIC_WHERE = `
  p.deleted_at IS NULL
  AND p.draft = 0
  AND date(p.pub_date, '+8 hours') <= date('now', '+8 hours')
`;

function mapAdminRow(row: AdminRow): AdminPost {
  return {
    ...mapRow(row),
    bodyMd: row.body_md,
    draft: row.draft === 1,
    canonical: row.canonical ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  };
}

function mapRow(row: PostRow): PostRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    html: row.html,
    headings: JSON.parse(row.headings_json) as Heading[],
    tags: JSON.parse(row.tags_json) as string[],
    series:
      row.series_name === null
        ? undefined
        : { name: row.series_name, order: row.series_order ?? 1 },
    pubDate: row.pub_date,
    updatedDate: row.updated_date ?? undefined,
    readingMinutes: row.reading_minutes,
    coverPath: row.cover_path ?? undefined,
    coverAlt: row.cover_alt ?? undefined,
    ogPath: row.og_path ?? undefined,
  };
}

function filters(query: PostQuery): {
  where: string;
  params: Array<string | number>;
} {
  const conditions = [PUBLIC_WHERE];
  const params: Array<string | number> = [];

  if (query.tag) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM post_tags pt
        WHERE pt.post_id = p.id AND pt.tag_slug = ?
      )
    `);
    params.push(query.tag);
  }

  if (query.series) {
    conditions.push('p.series_name = ?');
    params.push(query.series);
  }

  return { where: conditions.join(' AND '), params };
}

function positiveInt(
  value: number | undefined,
  fallback: number,
  max: number,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(max, Math.max(1, Math.trunc(parsed)));
}

/** Complete, ordered collection for feeds, sitemaps and article navigation. */
export function listAllPublishedPosts(
  query: Pick<PostQuery, 'tag' | 'series'> = {},
  db: DatabaseSync = getDb(),
): PostRecord[] {
  const { where, params } = filters(query);
  const rows = db.prepare(
    `SELECT p.* FROM posts p WHERE ${where}
     ORDER BY p.pub_date DESC, p.slug ASC`,
  ).all(...params) as unknown as PostRow[];
  return rows.map(mapRow);
}

export function listPublishedPosts(
  query: PostQuery = {},
  db: DatabaseSync = getDb(),
): PostPage {
  const page = positiveInt(query.page, 1, Number.MAX_SAFE_INTEGER);
  const pageSize = positiveInt(query.pageSize, 10, 50);
  const offset = (page - 1) * pageSize;
  const { where, params } = filters(query);

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS total FROM posts p WHERE ${where}`)
    .get(...params) as { total: number };

  const rows = db
    .prepare(
      `SELECT p.*
       FROM posts p
       WHERE ${where}
       ORDER BY p.pub_date DESC, p.slug ASC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset) as unknown as PostRow[];

  const total = Number(totalRow.total);

  return {
    posts: rows.map(mapRow),
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

export function getPublishedPost(
  slug: string,
  db: DatabaseSync = getDb(),
): PostRecord | undefined {
  const row = db
    .prepare(`SELECT p.* FROM posts p WHERE p.slug = ? AND ${PUBLIC_WHERE}`)
    .get(slug) as unknown as PostRow | undefined;

  return row ? mapRow(row) : undefined;
}

export function listTags(db: DatabaseSync = getDb()): TagSummary[] {
  const rows = db
    .prepare(
      `SELECT
         t.slug,
         t.name,
         t.description,
         (
           SELECT COUNT(*)
           FROM post_tags pt
           JOIN posts p ON p.id = pt.post_id
           WHERE pt.tag_slug = t.slug AND ${PUBLIC_WHERE}
         ) AS count
       FROM tags t
       ORDER BY t.name ASC`,
    )
    .all() as Array<{
    slug: string;
    name: string;
    description: string | null;
    count: number;
  }>;

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    count: Number(row.count),
  }));
}

export function createTag(
  input: { slug: string; name: string; description?: string },
  db: DatabaseSync = getDb(),
): TagSummary {
  const existing = db
    .prepare('SELECT slug, name FROM tags WHERE slug = ? OR name = ?')
    .get(input.slug, input.name) as { slug: string; name: string } | undefined;

  if (existing) {
    throw new Error(`标签 "${existing.name}" 或 slug "${existing.slug}" 已存在`);
  }

  db.prepare(
    'INSERT INTO tags (slug, name, description) VALUES (?, ?, ?)',
  ).run(input.slug, input.name, input.description ?? null);

  return {
    slug: input.slug,
    name: input.name,
    description: input.description,
    count: 0,
  };
}

export function listSeries(db: DatabaseSync = getDb()): SeriesGroup[] {
  const rows = db
    .prepare(
      `SELECT p.*
       FROM posts p
       WHERE ${PUBLIC_WHERE} AND p.series_name IS NOT NULL
       ORDER BY p.series_name ASC, p.series_order ASC`,
    )
    .all() as unknown as PostRow[];

  const groups = new Map<string, SeriesGroup>();

  for (const row of rows) {
    const name = row.series_name as string;
    const group = groups.get(name) ?? {
      name,
      posts: [],
      latestDate: row.pub_date,
    };

    group.posts.push(mapRow(row));

    if (row.pub_date > group.latestDate) group.latestDate = row.pub_date;

    groups.set(name, group);
  }

  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getArchive(
  db: DatabaseSync = getDb(),
): Array<{ year: string; posts: PostRecord[] }> {
  const rows = db
    .prepare(
      `SELECT p.*
       FROM posts p
       WHERE ${PUBLIC_WHERE}
       ORDER BY p.pub_date DESC, p.slug ASC`,
    )
    .all() as unknown as PostRow[];

  const years = new Map<string, PostRecord[]>();

  for (const row of rows) {
    const year = row.pub_date.slice(0, 4);
    const posts = years.get(year) ?? [];
    posts.push(mapRow(row));
    years.set(year, posts);
  }

  return [...years.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, posts]) => ({ year, posts }));
}

export function upsertPost(
  input: PostInput,
  db: DatabaseSync = getDb(),
  expectedVersion?: number,
): PostRecord {
  const id = input.id ?? randomUUID();
  const now = new Date().toISOString();
  const tags = [...new Set(input.tags ?? [])];
  const headings = input.headings ?? [];

  if (expectedVersion !== undefined) {
    const current = db
      .prepare('SELECT version FROM posts WHERE id = ? AND deleted_at IS NULL')
      .get(id) as { version: number } | undefined;

    if (!current) throw notFound();

    if (current.version !== expectedVersion) {
      throw conflict('文章已在另一处更新，请刷新后再试');
    }
  }

  const existing = db
    .prepare('SELECT id FROM posts WHERE slug = ?')
    .get(input.slug) as { id: string } | undefined;

  if (existing && existing.id !== id) {
    throw new Error(`slug "${input.slug}" 已存在`);
  }

  const seriesOrder = input.series?.order ?? null;

  if (input.series && seriesOrder !== null) {
    const conflict = db
      .prepare(
        `SELECT id FROM posts
         WHERE series_name = ? AND series_order = ? AND id != ? AND deleted_at IS NULL`,
      )
      .get(input.series.name, seriesOrder, id) as { id: string } | undefined;

    if (conflict) {
      throw new Error(
        `系列 "${input.series.name}" 的 order ${seriesOrder} 已被占用`,
      );
    }
  }

  db.exec('BEGIN');

  try {
    db.prepare(
      `INSERT INTO posts (
         id, slug, title, description, body_md, html, headings_json, tags_json,
         series_name, series_order, draft, pub_date, updated_date, canonical,
         cover_path, cover_alt, og_path, reading_minutes,
         created_at, updated_at, version
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT(id) DO UPDATE SET
         slug = excluded.slug,
         title = excluded.title,
         description = excluded.description,
         body_md = excluded.body_md,
         html = excluded.html,
         headings_json = excluded.headings_json,
         tags_json = excluded.tags_json,
         series_name = excluded.series_name,
         series_order = excluded.series_order,
         draft = excluded.draft,
         pub_date = excluded.pub_date,
         updated_date = COALESCE(excluded.updated_date, posts.updated_date),
         canonical = excluded.canonical,
         cover_path = excluded.cover_path,
         cover_alt = excluded.cover_alt,
         og_path = excluded.og_path,
         reading_minutes = excluded.reading_minutes,
         updated_at = excluded.updated_at,
         version = posts.version + 1`,
    ).run(
      id,
      input.slug,
      input.title,
      input.description,
      input.bodyMd,
      input.html,
      JSON.stringify(headings),
      JSON.stringify(tags),
      input.series?.name ?? null,
      seriesOrder,
      input.draft === false ? 0 : 1,
      input.pubDate,
      input.updatedDate ?? null,
      input.canonical ?? null,
      input.coverPath ?? null,
      input.coverAlt ?? null,
      input.ogPath ?? null,
      input.readingMinutes ?? 1,
      now,
      now,
    );

    db.prepare('DELETE FROM post_tags WHERE post_id = ?').run(id);

    for (const tag of tags) {
      const tagRow = db
        .prepare('SELECT slug FROM tags WHERE name = ?')
        .get(tag) as { slug: string } | undefined;

      if (!tagRow) continue;

      db.prepare(
        'INSERT OR IGNORE INTO post_tags (post_id, tag_slug) VALUES (?, ?)',
      ).run(id, tagRow.slug);
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  const row = db
    .prepare('SELECT * FROM posts WHERE id = ?')
    .get(id) as unknown as PostRow;

  return mapRow(row);
}

export function listAdminPosts(db: DatabaseSync = getDb()): AdminPost[] {
  const rows = db
    .prepare(
      `SELECT * FROM posts
       WHERE deleted_at IS NULL
       ORDER BY updated_at DESC`,
    )
    .all() as unknown as AdminRow[];

  return rows.map(mapAdminRow);
}

export function getAdminPost(
  id: string,
  db: DatabaseSync = getDb(),
): AdminPost | undefined {
  const row = db
    .prepare(
      `SELECT * FROM posts
       WHERE id = ? AND deleted_at IS NULL`,
    )
    .get(id) as unknown as AdminRow | undefined;

  return row ? mapAdminRow(row) : undefined;
}

export function findPostIdBySlug(
  slug: string,
  db: DatabaseSync = getDb(),
): string | undefined {
  const row = db
    .prepare('SELECT id FROM posts WHERE slug = ? AND deleted_at IS NULL')
    .get(slug) as { id: string } | undefined;

  return row?.id;
}

function siteToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function adminRow(
  id: string,
  db: DatabaseSync,
  includeDeleted = false,
): AdminRow {
  const row = db
    .prepare(
      `SELECT * FROM posts
       WHERE id = ?${includeDeleted ? '' : ' AND deleted_at IS NULL'}`,
    )
    .get(id) as unknown as AdminRow | undefined;

  if (!row) throw notFound();

  return row;
}

function checkVersion(row: AdminRow, expectedVersion?: number): void {
  if (expectedVersion !== undefined && row.version !== expectedVersion) {
    throw conflict('文章已在另一处更新，请刷新后再试');
  }
}

function saveRevision(
  db: DatabaseSync,
  row: AdminRow,
  version: number,
  now: string,
): void {
  db.prepare(
    `INSERT INTO post_revisions
       (id, post_id, version, title, body_md, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), row.id, version, row.title, row.body_md, now);
}

export function publishPost(
  id: string,
  db: DatabaseSync = getDb(),
  expectedVersion?: number,
): SavePostResult {
  const row = adminRow(id, db);
  checkVersion(row, expectedVersion);

  const now = new Date().toISOString();
  const version = row.version + 1;

  db.exec('BEGIN');

  try {
    db.prepare(
      `UPDATE posts
       SET draft = 0, updated_date = ?, version = ?, updated_at = ?
       WHERE id = ?`,
    ).run(siteToday(), version, now, id);
    saveRevision(db, row, version, now);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return {
    id,
    slug: row.slug,
    version,
    status: 'published',
    updatedAt: now,
  };
}

export function unpublishPost(
  id: string,
  db: DatabaseSync = getDb(),
  expectedVersion?: number,
): SavePostResult {
  const row = adminRow(id, db);
  checkVersion(row, expectedVersion);

  const now = new Date().toISOString();
  const version = row.version + 1;

  db.prepare(
    `UPDATE posts SET draft = 1, version = ?, updated_at = ? WHERE id = ?`,
  ).run(version, now, id);

  return {
    id,
    slug: row.slug,
    version,
    status: 'draft',
    updatedAt: now,
  };
}

export function softDeletePost(
  id: string,
  db: DatabaseSync = getDb(),
  expectedVersion?: number,
): SavePostResult {
  const row = adminRow(id, db);
  checkVersion(row, expectedVersion);

  const now = new Date().toISOString();
  const version = row.version + 1;

  db.prepare(
    `UPDATE posts SET deleted_at = ?, version = ?, updated_at = ? WHERE id = ?`,
  ).run(now, version, now, id);

  return {
    id,
    slug: row.slug,
    version,
    status: row.draft === 1 ? 'draft' : 'published',
    updatedAt: now,
  };
}

export function restorePost(
  id: string,
  db: DatabaseSync = getDb(),
  expectedVersion?: number,
): SavePostResult {
  const row = adminRow(id, db, true);

  if (!row.deleted_at) throw notFound('文章不在回收站');

  checkVersion(row, expectedVersion);

  const now = new Date().toISOString();
  const version = row.version + 1;

  db.prepare(
    `UPDATE posts
     SET deleted_at = NULL, draft = 1, version = ?, updated_at = ?
     WHERE id = ?`,
  ).run(version, now, id);

  return {
    id,
    slug: row.slug,
    version,
    status: 'draft',
    updatedAt: now,
  };
}

export function getAdminPostAny(
  id: string,
  db: DatabaseSync = getDb(),
): AdminPost | undefined {
  const row = db
    .prepare('SELECT * FROM posts WHERE id = ?')
    .get(id) as unknown as AdminRow | undefined;

  return row ? mapAdminRow(row) : undefined;
}

export function listRevisions(
  postId: string,
  db: DatabaseSync = getDb(),
): Array<{ id: string; version: number; title: string; bodyMd: string; createdAt: string }> {
  const rows = db
    .prepare(
      `SELECT id, version, title, body_md, created_at
       FROM post_revisions
       WHERE post_id = ?
       ORDER BY version DESC`,
    )
    .all(postId) as Array<{
    id: string;
    version: number;
    title: string;
    body_md: string;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    version: row.version,
    title: row.title,
    bodyMd: row.body_md,
    createdAt: row.created_at,
  }));
}

export function searchAdminPosts(
  query: AdminListQuery = {},
  db: DatabaseSync = getDb(),
): AdminPostPage {
  const page = positiveInt(query.page, 1, Number.MAX_SAFE_INTEGER);
  const pageSize = positiveInt(query.pageSize, 20, 100);
  const offset = (page - 1) * pageSize;
  const status = query.status ?? 'all';
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (status === 'trash') {
    conditions.push('deleted_at IS NOT NULL');
  } else {
    conditions.push('deleted_at IS NULL');

    if (status === 'draft') conditions.push('draft = 1');
    if (status === 'published') conditions.push('draft = 0');
  }

  const term = (query.q ?? '').trim();

  if (term) {
    const like = `%${term.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
    conditions.push(
      `(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR slug LIKE ? ESCAPE '\\')`,
    );
    params.push(like, like, like);
  }

  const where = conditions.join(' AND ');
  const totalRow = db
    .prepare(`SELECT COUNT(*) AS total FROM posts WHERE ${where}`)
    .get(...params) as { total: number };
  const rows = db
    .prepare(
      `SELECT * FROM posts
       WHERE ${where}
       ORDER BY updated_at DESC, id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset) as unknown as AdminRow[];

  const total = Number(totalRow.total);

  return {
    posts: rows.map(mapAdminRow),
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}
