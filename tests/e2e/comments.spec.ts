import { expect, test } from '@playwright/test';

test.describe('comments and 404', () => {
  test('comments are disabled by default', async ({ page }) => {
    const response = await page.goto('/blog/hello-world/');

    expect(response?.status()).toBe(200);
    await expect(page.locator('[data-comments]')).toHaveCount(0);
    await expect(page.locator('[data-comments-load]')).toHaveCount(0);
    await expect(
      page.locator('script[src*="giscus.app"]'),
    ).toHaveCount(0);
  });

  test('404 offers a search entry', async ({ page }) => {
    await page.goto('/does-not-exist/');

    await expect(
      page.locator('.not-found__actions').getByRole('link', { name: '搜索' }),
    ).toHaveAttribute('href', '/search/');
  });
});
