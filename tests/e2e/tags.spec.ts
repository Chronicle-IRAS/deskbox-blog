import { expect, test } from '@playwright/test';

test.describe('tags', () => {
  test('tag index lists tags with counts', async ({ page }) => {
    const response = await page.goto('/tags/');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: '标签' })).toBeVisible();
    await expect(page.locator('.tag-list__item')).toHaveCount(5);
  });

  test('tag page lists matching posts', async ({ page }) => {
    const response = await page.goto('/tags/frontend/');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: '#前端' })).toBeVisible();
    await expect(page.locator('article.post-card')).not.toHaveCount(0);
  });

  test('unknown tag returns 404', async ({ page }) => {
    const response = await page.goto('/tags/not-a-real-tag/');

    expect(response?.status()).toBe(404);
  });
});
