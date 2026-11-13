import { beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDb } from '../../src/server/db';
import {
  getArchive,
  getPublishedPost,
  listPublishedPosts,
  createTag,
  listSeries,
  listTags,
  upsertPost,
} from '../../src/server/posts';
import type { PostInput } from '../../src/server/types';

let db: DatabaseSync;

function post(overrides: Partial<PostInput> & Pick<PostInput, 'slug'>): PostInput {
  return {
    title: overrides.title ?? overrides.slug,
    description: overrides.description ?? '这是一段足够长的测试摘要。',
    bodyMd: overrides.bodyMd ?? '正文',
    html: overrides.html ?? '<p>正文</p>',
    tags: overrides.tags ?? [],
    draft: overrides.draft ?? false,
    pubDate: overrides.pubDate ?? '2026-10-20',
    ...overrides,
  };
}

beforeEach(() => {
  db = openDb(':memory:');
});

describe('listPublishedPosts', () => {
  it('excludes drafts and future posts, newest first', () => {
    upsertPost(
      post({
        slug: 'draft',
        title: '草稿',
        draft: true,
        pubDate: '2026-10-20',
      }),
      db,
    );
    upsertPost(
      post({ slug: 'future', title: '未来', pubDate: '2099-01-01' }),
      db,
    );
    upsertPost(
      post({ slug: 'older', title: '较早', pubDate: '2026-10-18' }),
      db,
    );
    upsertPost(
      post({ slug: 'newer', title: '较新', pubDate: '2026-10-19' }),
      db,
    );

    const result = listPublishedPosts({}, db);

    expect(result.posts.map((item) => item.slug)).toEqual(['newer', 'older']);
    expect(result.total).toBe(2);
  });

  it('paginates and reports total pages', () => {
    for (let index = 1; index <= 5; index += 1) {
      upsertPost(
        post({
          slug: `page-${index}`,
          pubDate: `2026-10-${String(10 + index).padStart(2, '0')}`,
        }),
        db,
      );
    }

    const first = listPublishedPosts({ page: 1, pageSize: 2 }, db);
    const second = listPublishedPosts({ page: 2, pageSize: 2 }, db);

    expect(first.posts).toHaveLength(2);
    expect(first.totalPages).toBe(3);
    expect(second.posts).toHaveLength(2);
    expect(second.posts[0].slug).not.toBe(first.posts[0].slug);
  });

  it('filters by tag', () => {
    upsertPost(post({ slug: 'tagged', tags: ['前端'] }), db);
    upsertPost(post({ slug: 'other', tags: ['工程实践'] }), db);

    const result = listPublishedPosts({ tag: 'frontend' }, db);

    expect(result.posts.map((item) => item.slug)).toEqual(['tagged']);
  });

  it('returns no pages for an empty database', () => {
    const result = listPublishedPosts({}, db);

    expect(result.posts).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});

describe('getPublishedPost', () => {
  it('returns a published post and hides drafts', () => {
    upsertPost(post({ slug: 'visible' }), db);
    upsertPost(post({ slug: 'hidden', draft: true }), db);

    expect(getPublishedPost('visible', db)?.slug).toBe('visible');
    expect(getPublishedPost('hidden', db)).toBeUndefined();
    expect(getPublishedPost('missing', db)).toBeUndefined();
  });
});

describe('tags and series', () => {
  it('counts published posts per tag', () => {
    upsertPost(post({ slug: 'one', tags: ['前端'] }), db);
    upsertPost(post({ slug: 'two', tags: ['前端', '工程实践'] }), db);
    upsertPost(post({ slug: 'draft', tags: ['前端'], draft: true }), db);

    const tags = listTags(db);
    const frontend = tags.find((tag) => tag.slug === 'frontend');

    expect(frontend?.count).toBe(2);
  });

  it('groups series and rejects duplicate order', () => {
    upsertPost(
      post({ slug: 's1', series: { name: '系列', order: 1 } }),
      db,
    );
    upsertPost(
      post({ slug: 's2', series: { name: '系列', order: 2 } }),
      db,
    );

    const series = listSeries(db);

    expect(series).toHaveLength(1);
    expect(series[0].name).toBe('系列');
    expect(series[0].posts.map((item) => item.slug)).toEqual(['s1', 's2']);

    expect(() =>
      upsertPost(
        post({ slug: 's3', series: { name: '系列', order: 2 } }),
        db,
      ),
    ).toThrow(/order 2/);
  });

  it('groups archive by year', () => {
    upsertPost(post({ slug: 'y2026', pubDate: '2026-10-20' }), db);
    upsertPost(post({ slug: 'y2025', pubDate: '2025-12-31' }), db);

    const archive = getArchive(db);

    expect(archive.map((group) => group.year)).toEqual(['2026', '2025']);
  });
});

describe('upsertPost', () => {
  it('rejects duplicate slugs', () => {
    upsertPost(post({ slug: 'same' }), db);

    expect(() => upsertPost(post({ slug: 'same' }), db)).toThrow(/已存在/);
  });
});

describe('createTag', () => {
  it('creates a tag that can be assigned to a post', () => {
    createTag({ slug: 'database', name: '数据库', description: '存储与查询' }, db);
    upsertPost(post({ slug: 'db-post', tags: ['数据库'] }), db);

    const tags = listTags(db);
    const database = tags.find((tag) => tag.slug === 'database');

    expect(database?.count).toBe(1);
    expect(database?.description).toBe('存储与查询');
  });

  it('rejects duplicate name or slug', () => {
    createTag({ slug: 'database', name: '数据库' }, db);

    expect(() => createTag({ slug: 'database', name: '其他' }, db)).toThrow(
      /已存在/,
    );
    expect(() => createTag({ slug: 'other', name: '数据库' }, db)).toThrow(
      /已存在/,
    );
  });
});
