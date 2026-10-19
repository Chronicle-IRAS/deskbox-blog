import { expect, test } from '@playwright/test';

test.describe('blog index', () => {
  test('renders all published posts', async ({ page }) => {
    const response = await page.goto('/blog/');

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { level: 1, name: '文章' }),
    ).toBeVisible();
    await expect(page.locator('.post-list article.post-card')).toHaveCount(12);
    await expect(
      page.locator(
        'a[href*="draft-example"], a[href*="future-example"]',
      ),
    ).toHaveCount(0);
  });

  test('does not overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/blog/');

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );

    expect(hasHorizontalOverflow).toBe(false);
  });
});
