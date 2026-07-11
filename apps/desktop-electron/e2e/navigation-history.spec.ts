import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from './electron-test';

function writeArticle(root: string, relativePath: string, markdown: string) {
  const file = path.join(root, relativePath, 'index.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, markdown);
}

test('navigates article, fragment, search, and branch history without leaving the app shell', async ({
  launchElectron,
}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-navigation-e2e-'));
  writeArticle(
    root,
    path.join('alpha', 'source'),
    `---\ndate: 2026-01-01\ntags: [history]\n---\n# Source Article\n\n## 同頁段落\n\nSource body.\n\n[Same section](#同頁段落)\n\n[Open target](../target/index.md#結論)\n`,
  );
  writeArticle(
    root,
    path.join('alpha', 'target'),
    `---\ndate: 2026-01-02\ntags: [history]\n---\n# Target Article\n\n## 結論\n\nTarget body.\n`,
  );
  writeArticle(
    root,
    path.join('beta', 'gamma'),
    `---\ndate: 2026-01-03\ntags: [branch]\n---\n# Gamma Article\n\nGamma body.\n`,
  );

  const { page } = await launchElectron({
    env: { ARCHIVE_CONTENT_ROOT: root },
    cleanupPaths: [root],
  });
  await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  const initialUrl = page.url();
  const back = page.getByRole('button', { name: '上一個位置' });
  const forward = page.getByRole('button', { name: '下一個位置' });
  await expect(back).toBeDisabled();
  await expect(forward).toBeDisabled();

  await page.getByRole('button', { name: /Source Article/ }).click();
  await expect(page.locator('article header h2')).toHaveText('Source Article');
  await page.getByRole('link', { name: 'Same section' }).click();
  await expect(page.locator('#同頁段落')).toBeInViewport();
  await back.click();
  await expect(page.locator('article header h2')).toHaveText('Source Article');

  await page.getByRole('link', { name: 'Open target' }).click();
  await expect(page.locator('article header h2')).toHaveText('Target Article');
  await expect(page.locator('#結論')).toBeInViewport();
  await expect(forward).toBeDisabled();

  await page.keyboard.press('Alt+ArrowLeft');
  await expect(page.locator('article header h2')).toHaveText('Source Article');
  await page.keyboard.press('Alt+ArrowLeft');
  await expect(page.getByText('請選擇文章')).toBeVisible();
  await expect(forward).toBeEnabled();

  await page.getByLabel('搜尋文章').fill('Target body');
  await expect(page.getByTestId('article-list').getByRole('button')).toHaveCount(1);
  await page.getByRole('button', { name: /Target Article/ }).click();
  await page.keyboard.press('Alt+ArrowLeft');
  await expect(page.getByLabel('搜尋文章')).toHaveValue('Target body');
  await expect(page.getByText('請選擇文章')).toBeVisible();
  await page.keyboard.press('Alt+ArrowRight');
  await expect(page.locator('article header h2')).toHaveText('Target Article');

  await page.keyboard.press('Alt+ArrowLeft');
  await page.getByLabel('搜尋文章').fill('Gamma');
  await page.getByRole('button', { name: /Gamma Article/ }).click();
  await expect(page.locator('article header h2')).toHaveText('Gamma Article');
  await expect(forward).toBeDisabled();
  await expect(page).toHaveURL(initialUrl);
});
