import { expect, test } from '@playwright/test';

test.describe('search', () => {
  test('renders the search form', async ({ page }) => {
    const response = await page.goto('/search/');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('searchbox', { name: '搜索文章' })).toBeVisible();
    await expect(page.locator('#search-status')).toContainText('输入关键词');
  });

  test('focuses the search input with slash', async ({ page }) => {
    await page.goto('/search/');
    await page.keyboard.press('/');

    await expect(
      page.getByRole('searchbox', { name: '搜索文章' }),
    ).toBeFocused();
  });

  test('returns results after Pagefind is built', async ({ page }) => {
    await page.goto('/search/?q=内容集合');
    await page.waitForSelector('#search-status');

    await page
      .waitForFunction(
        () => {
          const status = document.querySelector('#search-status');
          return (
            document.querySelectorAll('.search-result').length > 0 ||
            status?.getAttribute('data-state') === 'error'
          );
        },
        undefined,
        { timeout: 10000 },
      )
      .catch(() => {});

    const error = page.locator('#search-status[data-state="error"]');
    if (await error.isVisible()) {
      test.skip(true, 'Pagefind index is not available in dev');
    }

    const firstTitle = page.locator('.search-result a').first();
    await expect(page.locator('.search-result').first()).toBeVisible();
    await expect(firstTitle).not.toHaveText('未命名');
    await expect(firstTitle).toContainText('内容集合');
    await expect(page.locator('#search-input')).toHaveValue('内容集合');
  });
});
