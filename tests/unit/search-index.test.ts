import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/posts', () => ({
  getPosts: vi.fn().mockResolvedValue([{ body: '只在搜索时加载的正文', data: {
    slug: 'body-search', title: '测试文章', description: '文章摘要', tags: ['前端'], pubDate: new Date('2026-10-20T00:00:00Z'),
  } }]),
  fmtDate: () => '2026.10.20',
}));

import { GET } from '../../src/pages/api/search-index';

describe('on-demand public search index', () => {
  it('retains full-text and metadata for client-side search', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ t: '测试文章', d: '文章摘要', u: '/blog/body-search/', date: '2026.10.20', tags: ['前端'], body: '只在搜索时加载的正文' }]);
  });

  it('prevents stored indexes outliving publication changes', async () => {
    const response = await GET();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Content-Type')).toContain('application/json');
  });
});
