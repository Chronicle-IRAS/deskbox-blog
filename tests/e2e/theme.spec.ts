import { expect, test } from '@playwright/test';

test('主题切换后刷新保持', async ({ page }) => {
  await page.goto('/');

  const html = page.locator('html');
  const toggle = page.locator('[data-theme-toggle]');
  await expect(html).toHaveAttribute('data-theme', /light|dark/);

  const before = await html.getAttribute('data-theme');
  await toggle.click();
  const after = await html.getAttribute('data-theme');

  expect(after).not.toBe(before);
  await expect(html).toHaveAttribute('data-theme', after!);
  await expect(toggle).toHaveAttribute('aria-pressed', String(after === 'dark'));

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', after!);
});

test.describe('系统暗色', () => {
  test.use({ colorScheme: 'dark' });

  test('首屏使用暗色且不闪烁', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('[data-theme-toggle]')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('系统浅色', () => {
  test.use({ colorScheme: 'light' });

  test('首屏使用浅色', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('[data-theme-toggle]')).toHaveAttribute('aria-pressed', 'false');
  });
});
