import { test, expect, _electron as electron } from '@playwright/test';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const title = '科技業龍頭為何認為「現在算力遠遠不夠」：原因、證據與三大主題深度分析';

async function launch(extraEnv: Record<string, string> = {}) {
  return electron.launch({
    executablePath: require('electron'),
    args: ['.', '--no-sandbox'],
    env: { ...(process.env as Record<string, string>), ...extraEnv },
  });
}

test('source Electron app searches and opens the known Chinese article securely', async () => {
  const app = await launch();
  try {
    const page = await app.firstWindow();
    await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: new RegExp(title.slice(0, 8)) })).toBeVisible();
    await expect(page.evaluate(() => Reflect.has(window, 'require'))).resolves.toBe(false);
    await expect(page.evaluate(() => Reflect.has(window, 'process'))).resolves.toBe(false);
    await page.getByLabel('搜尋文章').fill('算力遠遠不夠');
    await expect(page.getByTestId('article-list').getByRole('button')).toHaveCount(1);
    await page.getByRole('button', { name: new RegExp(title.slice(0, 12)) }).click();
    await expect(page.locator('article header h2')).toHaveText(title);
    await expect(page.getByTestId('article-meta')).toContainText('2026-03-20');
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

test('internal article links stay in app shell, support fragments, and block file links', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-e2e-'));
  fs.mkdirSync(path.join(root, 'alpha', 'source'), { recursive: true });
  fs.mkdirSync(path.join(root, 'alpha', 'target'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'alpha', 'source', 'index.md'),
    `---\ndate: 2026-01-01\ntags: [test]\n---\n# Source Article\n\n[Go Target](../target/index.md#deep-heading)\n\n[Broken](../missing/)\n\n[Bad](file:///etc/passwd)\n`,
  );
  fs.writeFileSync(
    path.join(root, 'alpha', 'target', 'index.md'),
    `---\ndate: 2026-01-02\ntags: [test]\n---\n# Target Article\n\nIntro\n\n## Deep Heading\n\nFragment body.\n`,
  );
  const app = await launch({ ARCHIVE_CONTENT_ROOT: root });
  try {
    const page = await app.firstWindow();
    await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: /Source Article/ }).click();
    const before = page.url();
    await page.getByRole('link', { name: 'Go Target' }).click();
    await expect(page).toHaveURL(before);
    await expect(page.locator('article header h2')).toHaveText('Target Article');
    await expect(page.locator('#deep-heading')).toBeInViewport();
    await page.getByRole('button', { name: /Source Article/ }).click();
    await page.getByRole('link', { name: 'Broken' }).click();
    await expect(page.getByRole('alert')).toContainText('找不到內部文章連結');
    await page.locator('a', { hasText: 'Bad' }).click();
    await expect(page.getByRole('alert')).toContainText('已阻擋不安全連結');
    await expect(page).toHaveURL(before);
  } finally {
    await app.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('about modal shows build information without exposing Node globals', async () => {
  const app = await launch();
  try {
    const page = await app.firstWindow();
    await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: '關於' })).toBeVisible();
    await page.getByRole('button', { name: '關於' }).click();
    await expect(page.getByRole('dialog', { name: /關於 Research Observatory/ })).toBeVisible();
    await expect(page.getByTestId('about-version')).toHaveText(
      require('../../../package.json').version,
    );
    await expect(page.getByTestId('about-platform')).not.toHaveText('');
    await expect(page.evaluate(() => Reflect.has(window, 'require'))).resolves.toBe(false);
    await expect(page.evaluate(() => Reflect.has(window, 'process'))).resolves.toBe(false);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  } finally {
    await app.close();
  }
});
