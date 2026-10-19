import { expect, test } from '@playwright/test';

function parseJsonLd(raw: string | null): Record<string, unknown> {
  expect(raw).not.toBeNull();
  return JSON.parse(raw ?? '{}') as Record<string, unknown>;
}

test('首页输出 WebSite/Person JSON-LD 与 canonical', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('DeskBox · 写代码，也写生活。');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://localhost:4321/',
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    'content',
    'website',
  );

  const jsonLd = parseJsonLd(
    await page.locator('script[type="application/ld+json"]').textContent(),
  );
  const graph = jsonLd['@graph'] as Array<Record<string, unknown>>;

  expect(graph.map((node) => node['@type'])).toEqual(['WebSite', 'Person']);
});

test('文章页输出 BlogPosting 与文章元数据', async ({ page }) => {
  await page.goto('/blog/astro-content-collections/');

  await expect(page).toHaveTitle('用 Astro 内容集合管理博客文章 · DeskBox');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    'content',
    'article',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /^http:\/\/localhost:4321\/(?:_astro\/|@fs\/)/,
  );
  await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
    'content',
    '2026-10-18T00:00:00.000Z',
  );

  const jsonLd = parseJsonLd(
    await page.locator('script[type="application/ld+json"]').textContent(),
  );

  expect(jsonLd['@type']).toBe('BlogPosting');
  expect(jsonLd.headline).toBe('用 Astro 内容集合管理博客文章');
  expect(jsonLd.datePublished).toBe('2026-10-18T00:00:00.000Z');
  expect(jsonLd.keywords).toBe('前端, 工程实践, 后端');
  expect(String(jsonLd.image)).toMatch(
    /^http:\/\/localhost:4321\/(?:_astro\/|@fs\/)/,
  );
});

test('404 与 styleguide 标记 noindex', async ({ page }) => {
  await page.goto('/does-not-exist/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  );

  await page.goto('/styleguide/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  );
});

test('RSS 包含 12 篇已发布文章且排除草稿/未来', async ({ request }) => {
  const response = await request.get('/rss.xml');

  expect(response.status()).toBe(200);

  const body = await response.text();

  expect(body.match(/<item>/g) ?? []).toHaveLength(12);
  expect(body).not.toContain('草稿示例');
  expect(body).not.toContain('未来文章示例');
  expect(body).toContain('<lastBuildDate>');
  expect(body).toContain('content:encoded');
  expect(body).toContain('内容集合（Content Collections）');
  expect(body).not.toMatch(/(?:href|src)=&quot;\//);
  expect(body).toContain(
    'href=&quot;http://localhost:4321/blog/astro-content-collections/#user-content-fn-1&quot;',
  );
  expect(body).toContain(
    '<guid isPermaLink="true">http://localhost:4321/blog/astro-content-collections/</guid>',
  );
});

test('robots.txt 指向 sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');

  expect(response.status()).toBe(200);

  const body = await response.text();

  expect(body).toContain('User-agent: *');
  expect(body).toContain('Disallow: /search/');
  expect(body).toContain('Sitemap: http://localhost:4321/sitemap-index.xml');
});

test('sitemap 包含已发布文章并排除非索引页', async ({ request }) => {
  const indexResponse = await request.get('/sitemap-index.xml');

  expect(indexResponse.status()).toBe(200);

  const indexBody = await indexResponse.text();
  const sitemapPath = indexBody.match(/<loc>([^<]+)<\/loc>/)?.[1];

  expect(sitemapPath).toBeTruthy();

  const sitemapResponse = await request.get(new URL(sitemapPath!).pathname);

  expect(sitemapResponse.status()).toBe(200);

  const body = await sitemapResponse.text();

  expect(body).toContain('http://localhost:4321/blog/astro-content-collections/');
  expect(body).not.toContain('/search/');
  expect(body).not.toContain('/styleguide/');
  expect(body).not.toContain('/404');
  expect(body).not.toContain('/blog/page/');
  expect(body).not.toContain('/rss.xml');
  expect(body).not.toContain('/robots.txt');
});
