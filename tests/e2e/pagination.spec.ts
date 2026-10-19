import { expect, test } from '@playwright/test';

test.describe('pagination', () => {
  test('first page shows ten posts', async ({ page }) => {
    const response = await page.goto('/blog/');

    expect(response?.status()).toBe(200);
    await expect(page.locator('article.post-card')).toHaveCount(10);
    await expect(
      page.locator('.pagination [aria-current="page"]'),
    ).toHaveText('1');
  });

  test('second page shows the remaining posts', async ({ page }) => {
    const response = await page.goto('/blog/page/2/');

    expect(response?.status()).toBe(200);
    await expect(page.locator('article.post-card')).toHaveCount(2);
    await expect(
      page.locator('.pagination [aria-current="page"]'),
    ).toHaveText('2');
  });

  test('does not generate page one', async ({ page }) => {
    const response = await page.goto('/blog/page/1/');

    expect(response?.status()).toBe(404);
  });
});
