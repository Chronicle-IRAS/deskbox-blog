import { beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDb } from '../../src/server/db';
import {
  getAdminPost,
  listRevisions,
  publishPost,
  restorePost,
  searchAdminPosts,
  softDeletePost,
  unpublishPost,
  upsertPost,
} from '../../src/server/posts';
import { validatePostInput } from '../../src/server/validation';
import type { PostInput } from '../../src/server/types';

let db: DatabaseSync;

function post(overrides: Partial<PostInput> & Pick<PostInput, 'slug'>): PostInput {
  return {
    title: overrides.title ?? overrides.slug,
    description: overrides.description ?? '这是一段足够长的测试摘要。',
    bodyMd: overrides.bodyMd ?? '正文',
    html: overrides.html ?? '<p>正文</p>',
    tags: overrides.tags ?? [],
    draft: overrides.draft ?? true,
    pubDate: overrides.pubDate ?? '2026-10-21',
    ...overrides,
  };
}

beforeEach(() => {
  db = openDb(':memory:');
});

describe('post versioning', () => {
  it('creates version 1 and increments on save', () => {
    const created = upsertPost(post({ slug: 'versioned' }), db);
    expect(getAdminPost(created.id, db)?.version).toBe(1);

    upsertPost(
      {
        ...post({ slug: 'versioned', title: '更新后的标题' }),
        id: created.id,
      },
      db,
      1,
    );

    expect(getAdminPost(created.id, db)?.version).toBe(2);
  });

  it('rejects stale saves with 409 conflict', () => {
    const created = upsertPost(post({ slug: 'conflict' }), db);

    expect(() =>
      upsertPost(
        { ...post({ slug: 'conflict' }), id: created.id },
        db,
        99,
      ),
    ).toThrow(/另一处/);

    expect(getAdminPost(created.id, db)?.version).toBe(1);
  });

  it('publishes with a snapshot and keeps updatedDate off autosave', () => {
    const created = upsertPost(post({ slug: 'publish-me' }), db);

    upsertPost(
      { ...post({ slug: 'publish-me' }), id: created.id },
      db,
      1,
    );

    expect(getAdminPost(created.id, db)?.updatedDate).toBeUndefined();

    const published = publishPost(created.id, db, 2);

    expect(published.status).toBe('published');
    expect(published.version).toBe(3);
    expect(getAdminPost(created.id, db)?.draft).toBe(false);
    expect(getAdminPost(created.id, db)?.updatedDate).toBeTruthy();
    expect(listRevisions(created.id, db)).toHaveLength(1);
  });

  it('supports unpublish, delete and restore', () => {
    const created = upsertPost(post({ slug: 'lifecycle' }), db);
    const published = publishPost(created.id, db, 1);
    const unpublished = unpublishPost(created.id, db, published.version);

    expect(unpublished.status).toBe('draft');
    expect(getAdminPost(created.id, db)?.draft).toBe(true);

    const deleted = softDeletePost(created.id, db, unpublished.version);

    expect(getAdminPost(created.id, db)).toBeUndefined();
    expect(searchAdminPosts({ status: 'trash' }, db).posts).toHaveLength(1);

    const restored = restorePost(created.id, db, deleted.version);

    expect(restored.status).toBe('draft');
    expect(getAdminPost(created.id, db)?.draft).toBe(true);
    expect(searchAdminPosts({ status: 'trash' }, db).posts).toHaveLength(0);
  });

  it('creates revisions only on publish', () => {
    const created = upsertPost(post({ slug: 'revision-only-publish' }), db);

    upsertPost(
      { ...post({ slug: 'revision-only-publish' }), id: created.id },
      db,
      1,
    );
    upsertPost(
      { ...post({ slug: 'revision-only-publish' }), id: created.id },
      db,
      2,
    );

    expect(listRevisions(created.id, db)).toHaveLength(0);

    publishPost(created.id, db, 3);

    expect(listRevisions(created.id, db)).toHaveLength(1);
  });

  it('rejects stale save and publish after a concurrent write', () => {
    const created = upsertPost(post({ slug: 'race' }), db);
    const published = publishPost(created.id, db, 1);

    expect(() =>
      upsertPost(
        {
          ...post({ slug: 'race', draft: false }),
          id: created.id,
        },
        db,
        1,
      ),
    ).toThrow(/另一处/);

    expect(() => publishPost(created.id, db, 1)).toThrow(/另一处/);

    upsertPost(
      {
        ...post({ slug: 'race', draft: false }),
        id: created.id,
      },
      db,
      published.version,
    );

    expect(getAdminPost(created.id, db)?.version).toBe(3);
  });

  it('keeps updatedDate stable across post-publish saves', () => {
    const created = upsertPost(post({ slug: 'updated-date' }), db);
    const published = publishPost(created.id, db, 1);
    const updatedDate = getAdminPost(created.id, db)?.updatedDate;

    upsertPost(
      {
        ...post({ slug: 'updated-date', draft: false }),
        id: created.id,
      },
      db,
      published.version,
    );

    expect(getAdminPost(created.id, db)?.updatedDate).toBe(updatedDate);
  });
});

describe('admin list search', () => {
  it('filters by status and query', () => {
    upsertPost(post({ slug: 'draft-one', title: '草稿文章' }), db);
    upsertPost(
      post({ slug: 'live-one', title: '公开文章', draft: false }),
      db,
    );

    expect(searchAdminPosts({ status: 'draft' }, db).posts).toHaveLength(1);
    expect(searchAdminPosts({ status: 'published' }, db).posts).toHaveLength(1);
    expect(searchAdminPosts({ q: '公开' }, db).posts.map((p) => p.slug)).toEqual([
      'live-one',
    ]);
  });

  it('paginates with a stable order and clamps page size', () => {
    for (const index of [0, 1, 2]) {
      upsertPost(post({ slug: `page-${index}`, title: `分页 ${index}` }), db);
    }

    const first = searchAdminPosts({ page: 1, pageSize: 2 }, db);
    const second = searchAdminPosts({ page: 2, pageSize: 2 }, db);

    expect(first).toMatchObject({
      page: 1,
      pageSize: 2,
      total: 3,
      totalPages: 2,
    });
    expect(first.posts).toHaveLength(2);
    expect(second.posts).toHaveLength(1);
    expect(first.posts[0].id).not.toBe(second.posts[0].id);

    expect(searchAdminPosts({ pageSize: 500 }, db).pageSize).toBe(100);
    expect(
      searchAdminPosts({ page: Number.NaN, pageSize: Number.NaN }, db),
    ).toMatchObject({ page: 1, pageSize: 20 });
  });
});

describe('validation', () => {
  it('reports field errors for invalid input', () => {
    expect(() =>
      validatePostInput(
        {
          title: '',
          slug: 'bad slug',
          description: '短',
          bodyMd: '',
          pubDate: '2026/10/21',
          tags: ['不存在'],
        },
        db,
      ),
    ).toThrow(/请检查表单字段/);
  });

  it('rejects duplicate slug', () => {
    upsertPost(post({ slug: 'taken' }), db);

    let error: unknown;

    try {
      validatePostInput(
        {
          title: '另一篇',
          slug: 'taken',
          description: '这是一段足够长的测试摘要。',
          bodyMd: '正文',
          pubDate: '2026-10-21',
          tags: [],
        },
        db,
      );
    } catch (caught) {
      error = caught;
    }

    expect(
      (error as { fields?: Record<string, string> }).fields?.slug,
    ).toMatch(/slug 已存在/);
  });
});
