import { test, expect, _electron as electron } from '@playwright/test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

test('development Electron app loads bundled archive and opens an article securely', async () => {
  const app = await electron.launch({
    executablePath: require('electron'),
    args: ['.', '--no-sandbox'],
  });
  const page = await app.firstWindow();
  await expect(page.getByRole('heading', { name: 'Research Observatory' })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.locator('li')).not.toHaveCount(0);
  await expect(page.evaluate(() => Reflect.has(window, 'require'))).resolves.toBe(false);
  await expect(page.evaluate(() => Reflect.has(window, 'process'))).resolves.toBe(false);
  await page.getByLabel('搜尋文章').fill('compute');
  await page.getByRole('button').first().click();
  await expect(page.locator('article header h2')).toBeVisible();
  await app.close();
});
