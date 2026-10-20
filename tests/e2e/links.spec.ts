import { expect, test } from '@playwright/test';

const SEED_PATHS = [
  '/',
  '/blog/',
  '/blog/page/2/',
  '/tags/',
  '/tags/frontend/',
  '/archive/',
  '/search/',
  '/about/',
  '/blog/astro-content-collections/',
];

test('内部链接全部返回 200 且无重定向', async ({ page, request, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const paths = new Set<string>();

  for (const seed of SEED_PATHS) {
    await page.goto(seed);

    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));

    for (const href of hrefs) {
      if (!href) continue;

      const url = new URL(href, `${origin}${seed}`);

      if (url.origin !== origin) continue;
      if (url.pathname.startsWith('/_astro/')) continue;

      paths.add(url.pathname);
    }
  }

  expect(paths.size).toBeGreaterThan(10);

  for (const path of [...paths].sort()) {
    const response = await request.get(path, { maxRedirects: 0 });

    expect(response.status(), `${path} should return 200`).toBe(200);
  }
});

test('缺失页面返回自定义 404', async ({ page, request }) => {
  for (const path of ['/blog/page/1/', '/does-not-exist/']) {
    const response = await request.get(path, { maxRedirects: 0 });

    expect(response.status(), `${path} should return 404`).toBe(404);
  }

  await page.goto('/does-not-exist/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('这一页没有内容。');
});
