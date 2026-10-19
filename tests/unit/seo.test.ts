import { describe, expect, it } from 'vitest';
import {
  articleHeadline,
  buildArticleJsonLd,
  buildWebsiteJsonLd,
} from '../../src/lib/seo';

const BASE = 'http://localhost:4321';

describe('buildWebsiteJsonLd', () => {
  it('includes WebSite and Person entries', () => {
    const graph = buildWebsiteJsonLd(BASE)['@graph'] as Array<
      Record<string, unknown>
    >;

    expect(graph.map((node) => node['@type'])).toEqual(['WebSite', 'Person']);
    expect(graph[0].url).toBe(`${BASE}/`);
    expect(graph[1].url).toBe(`${BASE}/about/`);
  });
});

describe('buildArticleJsonLd', () => {
  it('builds a BlogPosting with all provided fields', () => {
    const jsonLd = buildArticleJsonLd({
      title: '示例文章 · DeskBox',
      description: '示例摘要',
      url: `${BASE}/blog/example/`,
      image: `${BASE}/cover.png`,
      datePublished: '2026-10-18T00:00:00.000Z',
      dateModified: '2026-10-20T00:00:00.000Z',
      keywords: ['前端', '工程实践'],
    });

    expect(jsonLd['@type']).toBe('BlogPosting');
    expect(jsonLd.headline).toBe('示例文章');
    expect(jsonLd.url).toBe(`${BASE}/blog/example/`);
    expect(jsonLd.image).toBe(`${BASE}/cover.png`);
    expect(jsonLd.datePublished).toBe('2026-10-18T00:00:00.000Z');
    expect(jsonLd.dateModified).toBe('2026-10-20T00:00:00.000Z');
    expect(jsonLd.keywords).toBe('前端, 工程实践');
    expect(jsonLd.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': `${BASE}/blog/example/`,
    });
  });

  it('omits optional fields when absent', () => {
    const jsonLd = buildArticleJsonLd({
      title: '示例文章',
      description: '示例摘要',
      url: `${BASE}/blog/example/`,
    });

    expect(jsonLd).not.toHaveProperty('image');
    expect(jsonLd).not.toHaveProperty('datePublished');
    expect(jsonLd).not.toHaveProperty('dateModified');
    expect(jsonLd).not.toHaveProperty('keywords');
  });
});

describe('articleHeadline', () => {
  it('removes the site suffix from page titles', () => {
    expect(articleHeadline('示例文章 · DeskBox')).toBe('示例文章');
  });

  it('keeps titles that do not contain the suffix', () => {
    expect(articleHeadline('示例文章')).toBe('示例文章');
  });
});
