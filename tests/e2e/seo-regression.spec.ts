import { expect, test, type APIRequestContext } from '@playwright/test';

const SITE_ORIGIN = 'http://localhost:4321';

async function sitemapUrls(request: APIRequestContext): Promise<string[]> {
  const indexResponse = await request.get('/sitemap-index.xml');
  expect(indexResponse.status()).toBe(200);

  const indexBody = await indexResponse.text();
  const sitemapPath = indexBody.match(/<loc>([^<]+)<\/loc>/)?.[1];

  expect(sitemapPath).toBeTruthy();

  const sitemapResponse = await request.get(new URL(sitemapPath!).pathname);
  expect(sitemapResponse.status()).toBe(200);

  const body = await sitemapResponse.text();

  return [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

async function publishedPostUrls(request: APIRequestContext): Promise<string[]> {
  return (await sitemapUrls(request)).filter((url) => {
    const { pathname } = new URL(url);
    return pathname.startsWith('/blog/') && pathname !== '/blog/' && !pathname.startsWith('/blog/page/');
  });
}

test('所有已发布文章输出一致的 SEO 与 JSON-LD', async ({ page, request }) => {
  const urls = await publishedPostUrls(request);

  expect(urls).toHaveLength(12);

  for (const url of urls) {
    const { pathname } = new URL(url);
    const canonical = `${SITE_ORIGIN}${pathname}`;

    await page.goto(pathname);

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);

    const jsonLd = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
    ) as Record<string, unknown>;

    expect(jsonLd['@type']).toBe('BlogPosting');
    expect(jsonLd.url).toBe(canonical);
    expect(jsonLd.headline).toBeTruthy();
    expect(String(jsonLd.datePublished)).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const title = await page.title();

    expect(title.endsWith(' · DeskBox')).toBe(true);
    expect(jsonLd.headline).toBe(title.replace(/ · DeskBox$/, ''));
  }
});

test('封面与无封面文章的 OG image 行为正确', async ({ page }) => {
  await page.goto('/blog/astro-content-collections/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `${SITE_ORIGIN}/og/astro-content-collections.png`,
  );

  await page.goto('/blog/hello-world/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `${SITE_ORIGIN}/og/hello-world.png`,
  );
});

test('文章 OG 图可由构建生成', async ({ request }) => {
  for (const slug of ['astro-content-collections', 'hello-world']) {
    const response = await request.get(`/og/${slug}.png`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    expect((await response.body()).byteLength).toBeGreaterThan(1000);
  }
});

test('非文章页面使用默认 OG 图', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `${SITE_ORIGIN}/og-default.png`,
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
    'content',
    '1200',
  );
});

test('分页与搜索页的 canonical/robots 正确', async ({ page }) => {
  await page.goto('/blog/page/2/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${SITE_ORIGIN}/blog/page/2/`,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');

  await page.goto('/search/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${SITE_ORIGIN}/search/`,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

test('RSS 条目链接唯一且为绝对 URL', async ({ request }) => {
  const response = await request.get('/rss.xml');

  expect(response.status()).toBe(200);

  const body = await response.text();
  const links = [...body.matchAll(/<link>([^<]+)<\/link>/g)]
    .map((match) => match[1])
    .filter((link) => link.includes('/blog/'));

  expect(links).toHaveLength(12);
  expect(new Set(links).size).toBe(12);

  for (const link of links) {
    expect(link).toMatch(/^http:\/\/localhost:4321\/blog\//);
  }
});

test('sitemap 包含 12 篇文章与 P1 页面且排除非索引页', async ({ request }) => {
  const urls = await sitemapUrls(request);
  const paths = urls.map((url) => new URL(url).pathname);
  const postUrls = await publishedPostUrls(request);

  expect(postUrls).toHaveLength(12);
  expect(paths).toContain('/tags/');
  expect(paths).toContain('/archive/');
  expect(paths).not.toContain('/search/');
  expect(paths).not.toContain('/styleguide/');
  expect(paths).not.toContain('/404/');
  expect(paths.some((path) => path.startsWith('/blog/page/'))).toBe(false);
});
