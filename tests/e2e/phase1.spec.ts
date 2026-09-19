import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('@smoke AC-001 AC-002 AC-003 reader can navigate and read without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Đọc sâu',
  );
  await page.locator('.domain-card').filter({ hasText: 'UFO / UAP' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('UFO / UAP');
  await page.getByRole('link', { name: /Government Programs/ }).click();
  await expect(page.locator('.prose')).toContainText('Project Sign');
  await expect(page.getByLabel('Breadcrumb')).toContainText('UFO / UAP');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await context.close();
});

test('@smoke AC-004 every generated internal URL keeps the project base path', async ({
  page,
}) => {
  const rawBase = process.env.BASE_PATH || '/ufo-data';
  const expectedPrefix =
    rawBase === '/' ? '/' : `${rawBase.replace(/\/+$/, '')}/`;

  await page.goto('./');
  const internalUrls = await page
    .locator('a[href^="/"]')
    .evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute('href')),
    );
  expect(internalUrls.length).toBeGreaterThan(5);
  expect(internalUrls.every((url) => url?.startsWith(expectedPrefix))).toBe(
    true,
  );
});

test('@smoke AC-020 AC-022 Vietnamese search restores q from the URL', async ({
  page,
}) => {
  await page.goto('./search/?q=Spec%20đứng%20ở%20giữa');
  await expect(page.locator('[data-search-status]')).toContainText('kết quả', {
    timeout: 15_000,
  });
  await expect(page.locator('[data-search-results]')).toContainText(
    'Spec Driven Development',
  );
  await expect(page.locator('#search-query')).toHaveValue('Spec đứng ở giữa');
});

test('@smoke AC-024 search index failure keeps an actionable directory', async ({
  page,
}) => {
  await page.route('**/pagefind/pagefind.js', (route) => route.abort());
  await page.goto('./search/?q=UFO');
  await expect(page.locator('[data-search-status]')).toContainText(
    'danh mục liên kết bên dưới',
  );
  await expect(page.locator('[data-search-fallback]')).toBeVisible();
  await expect(page.locator('[data-search-fallback] a').first()).toBeVisible();
});

test('@smoke AC-053 representative page has no serious automated accessibility violation', async ({
  page,
}) => {
  await page.goto('./');
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact || ''),
  );
  expect(serious).toEqual([]);
});
