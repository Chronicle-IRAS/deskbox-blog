import { expect, test } from '@playwright/test';

test.describe('article page', () => {
  test('renders a long article with toc, code copy and navigation', async ({
    page,
  }) => {
    await page.context().grantPermissions([
      'clipboard-read',
      'clipboard-write',
    ]);

    const response = await page.goto('/blog/astro-content-collections/');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.post__toc [data-toc]')).toBeVisible();
    await expect(page.locator('.post__toc [data-toc] a').first()).toBeVisible();
    await expect(page.locator('.prose pre').first()).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: '文章导航' }),
    ).toBeVisible();

    const copyButton = page
      .getByRole('button', { name: '复制代码' })
      .first();
    await copyButton.click();
    await expect(copyButton).toHaveText('已复制');
  });

  test('hides toc for a short article', async ({ page }) => {
    await page.goto('/blog/hello-world/');

    await expect(page.locator('[data-toc]')).toHaveCount(0);
  });
});
