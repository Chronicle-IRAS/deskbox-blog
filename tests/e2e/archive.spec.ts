import { expect, test } from '@playwright/test';

test.describe('archive', () => {
  test('groups posts by year', async ({ page }) => {
    const response = await page.goto('/archive/');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: '归档' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: '2026' })).toBeVisible();
    await expect(page.locator('.archive__item')).toHaveCount(12);
  });
});
