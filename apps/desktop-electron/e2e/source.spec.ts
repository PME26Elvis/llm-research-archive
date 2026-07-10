import { test, expect, _electron as electron } from '@playwright/test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const title = '科技業龍頭為何認為「現在算力遠遠不夠」：原因、證據與三大主題深度分析';

test('source Electron app searches and opens the known Chinese article securely', async () => {
  const app = await electron.launch({
    executablePath: require('electron'),
    args: ['.', '--no-sandbox'],
  });
  try {
    const page = await app.firstWindow();
    await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: new RegExp(title.slice(0, 8)) })).toBeVisible();
    await expect(page.evaluate(() => Reflect.has(window, 'require'))).resolves.toBe(false);
    await expect(page.evaluate(() => Reflect.has(window, 'process'))).resolves.toBe(false);
    await page.getByLabel('搜尋文章').fill('算力遠遠不夠');
    await expect(page.getByTestId('article-list').getByRole('button')).toHaveCount(1);
    await expect(page.getByRole('button', { name: new RegExp(title.slice(0, 12)) })).toBeVisible();
    await page.getByRole('button', { name: new RegExp(title.slice(0, 12)) }).click();
    await expect(page.locator('article header h2')).toHaveText(title);
    await expect(page.getByTestId('article-meta')).toContainText('2026-03-20');
    await expect(page.getByTestId('article-meta')).toContainText('分鐘');
    await expect(page.getByTestId('reader')).not.toContainText('<script>');
    const before = page.url();
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = 'http://example.com';
      a.textContent = 'bad';
      document.querySelector('article')?.append(a);
      a.click();
    });
    await expect(page).toHaveURL(before);
  } finally {
    await app.close();
  }
});
