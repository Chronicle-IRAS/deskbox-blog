import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const paths = [
  '/blog/',
  '/blog/page/2/',
  '/blog/astro-content-collections/',
  '/tags/',
  '/tags/frontend/',
  '/archive/',
  '/search/',
  '/about/',
  '/does-not-exist/',
];

for (const path of paths) {
  test(`has no serious accessibility violations: ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) =>
        violation.impact === 'serious' || violation.impact === 'critical',
    );

    expect(blocking).toEqual([]);
  });
}
