import { expect, test } from '@playwright/test';

test('首页返回 200 并展示最新文章与最近文章', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'DeskBox' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '最新文章' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '最近文章' })).toBeVisible();

  await expect(
    page.locator('.post-card--featured').getByText('用 Astro 内容集合管理博客文章'),
  ).toBeVisible();
  await expect(page.locator('.post-list .post-card')).toHaveCount(6);
});

test('首页不显示草稿与未来文章', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('草稿示例')).toHaveCount(0);
  await expect(page.getByText('未来文章示例')).toHaveCount(0);
});

test('最近文章不包含最新文章', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.post-list').getByText('用 Astro 内容集合管理博客文章')).toHaveCount(0);
});

test('375px 视口无横向滚动', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(overflow).toBeLessThanOrEqual(0);
});
