import { describe, expect, it } from 'vitest';
import {
  assertUniqueSlugs,
  isPublished,
  sortPosts,
  toPostSummary,
  type BlogEntry,
} from '../../src/lib/posts';

interface EntryOptions {
  id?: string;
  slug?: string;
  pubDate?: string;
  updatedDate?: string;
  draft?: boolean;
  title?: string;
  description?: string;
  tags?: string[];
  body?: string;
}

function makeEntry(options: EntryOptions = {}): BlogEntry {
  const slug = options.slug ?? 'sample';

  return {
    id: options.id ?? slug,
    collection: 'blog',
    body: options.body ?? '这是一段用于测试的正文内容。',
    data: {
      title: options.title ?? '示例标题',
      description: options.description ?? '这是一段足够长的示例摘要，用于测试内容模型。',
      slug,
      pubDate: new Date(options.pubDate ?? '2026-10-18'),
      updatedDate: options.updatedDate ? new Date(options.updatedDate) : undefined,
      tags: options.tags ?? [],
      draft: options.draft ?? false,
      lang: 'zh-CN',
    },
  } as unknown as BlogEntry;
}

describe('sortPosts', () => {
  it('按 pubDate 降序排序', () => {
    const posts = [
      makeEntry({ slug: 'older', pubDate: '2026-09-01' }),
      makeEntry({ slug: 'newest', pubDate: '2026-10-18' }),
      makeEntry({ slug: 'middle', pubDate: '2026-10-01' }),
    ];

    expect(sortPosts(posts).map((post) => post.data.slug)).toEqual([
      'newest',
      'middle',
      'older',
    ]);
  });

  it('同一天按 slug 稳定排序', () => {
    const posts = [
      makeEntry({ slug: 'zebra', pubDate: '2026-10-18' }),
      makeEntry({ slug: 'alpha', pubDate: '2026-10-18' }),
      makeEntry({ slug: 'mike', pubDate: '2026-10-18' }),
    ];

    expect(sortPosts(posts).map((post) => post.data.slug)).toEqual(['alpha', 'mike', 'zebra']);
  });

  it('不修改传入数组', () => {
    const posts = [
      makeEntry({ slug: 'older', pubDate: '2026-09-01' }),
      makeEntry({ slug: 'newer', pubDate: '2026-10-01' }),
    ];
    const original = posts.map((post) => post.data.slug);

    sortPosts(posts);

    expect(posts.map((post) => post.data.slug)).toEqual(original);
  });
});

describe('isPublished', () => {
  it('默认排除草稿', () => {
    const draft = makeEntry({ slug: 'draft', draft: true, pubDate: '2026-10-01' });

    expect(isPublished(draft, { now: new Date('2026-10-19') })).toBe(false);
    expect(isPublished(draft, { now: new Date('2026-10-19'), includeDrafts: true })).toBe(true);
  });

  it('排除未来日期', () => {
    const future = makeEntry({ slug: 'future', pubDate: '2026-10-20' });
    const now = new Date('2026-10-19T23:00:00+08:00');

    expect(isPublished(future, { now })).toBe(false);
  });

  it('按 Asia/Shanghai 日历日判断当天文章已发布', () => {
    const post = makeEntry({ slug: 'today', pubDate: '2026-10-18' });
    const now = new Date('2026-10-17T16:30:00Z');

    expect(isPublished(post, { now })).toBe(true);
  });

  it('按 Asia/Shanghai 日历日判断前一天晚间仍是前一天', () => {
    const post = makeEntry({ slug: 'today', pubDate: '2026-10-18' });
    const now = new Date('2026-10-17T15:59:59Z');

    expect(isPublished(post, { now })).toBe(false);
  });
});

describe('assertUniqueSlugs', () => {
  it('slug 重复时抛出错误', () => {
    const posts = [
      makeEntry({ id: 'first', slug: 'same-slug' }),
      makeEntry({ id: 'second', slug: 'same-slug' }),
    ];

    expect(() => assertUniqueSlugs(posts)).toThrow(/Duplicate blog slug "same-slug"/);
  });

  it('slug 唯一时不抛出错误', () => {
    const posts = [
      makeEntry({ id: 'first', slug: 'one' }),
      makeEntry({ id: 'second', slug: 'two' }),
    ];

    expect(() => assertUniqueSlugs(posts)).not.toThrow();
  });
});

describe('toPostSummary', () => {
  it('使用 frontmatter slug 并保留元信息', () => {
    const post = makeEntry({
      id: '2026/10/example/index',
      slug: 'example-slug',
      title: '示例标题',
      description: '这是一段足够长的示例摘要，用于测试内容模型。',
      pubDate: '2026-10-18',
      updatedDate: '2026-10-20',
      tags: ['前端', '工程实践'],
      body: '正文内容',
    });

    const summary = toPostSummary(post);

    expect(summary.slug).toBe('example-slug');
    expect(summary.title).toBe('示例标题');
    expect(summary.pubDate).toEqual(new Date('2026-10-18'));
    expect(summary.updatedDate).toEqual(new Date('2026-10-20'));
    expect(summary.tags).toEqual(['前端', '工程实践']);
    expect(summary.readingMinutes).toBeGreaterThanOrEqual(1);
  });

  it('空正文的阅读时间为 1 分钟', () => {
    const post = makeEntry({ body: '' });

    expect(toPostSummary(post).readingMinutes).toBe(1);
  });
});
