import { expect, test } from '@playwright/test';

test.describe('series navigation', () => {
  test('shows the series and marks the current article', async ({ page }) => {
    await page.goto('/blog/post-01/');

    const nav = page.locator('.series-nav');
    await expect(nav).toBeVisible();
    await expect(
      nav.getByRole('heading', { level: 2, name: '工程实践札记' }),
    ).toBeVisible();
    await expect(nav.locator('[aria-current="page"]')).toContainText(
      '把构建时间当作一种反馈',
    );
    await expect(
      nav.getByRole('link', { name: /小团队里的代码评审/ }),
    ).toHaveAttribute('href', '/blog/post-02/');
  });

  test('marks the second article as current', async ({ page }) => {
    await page.goto('/blog/post-02/');

    await expect(
      page.locator('.series-nav [aria-current="page"]'),
    ).toContainText('小团队里的代码评审');
  });

  test('does not show for a non-series article', async ({ page }) => {
    await page.goto('/blog/hello-world/');

    await expect(page.locator('.series-nav')).toHaveCount(0);
  });
});
