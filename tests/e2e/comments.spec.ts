import { expect, test } from '@playwright/test';

test.describe('comments and 404', () => {
  test('comments load only after click', async ({ page }) => {
    await page.route('https://giscus.app/client.js', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: '/* giscus stub */',
      }),
    );

    const response = await page.goto('/blog/hello-world/');

    expect(response?.status()).toBe(200);
    await expect(page.locator('[data-comments]')).toBeVisible();
    await expect(
      page.locator('script[src*="giscus.app"]'),
    ).toHaveCount(0);

    await page.getByRole('button', { name: '加载评论' }).click();

    await expect(
      page.locator('script[src="https://giscus.app/client.js"]'),
    ).toHaveCount(1);
  });

  test('404 offers a search entry', async ({ page }) => {
    await page.goto('/does-not-exist/');

    await expect(
      page.locator('.not-found__actions').getByRole('link', { name: '搜索' }),
    ).toHaveAttribute('href', '/search/');
  });
});
