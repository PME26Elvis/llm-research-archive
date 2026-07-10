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

function writeArticle(root: string, relativePath: string, markdown: string) {
  const file = path.join(root, relativePath, 'index.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, markdown);
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
    `---\ndate: 2026-01-01\ntags: [test]\n---\n# Source Article\n\n## 同頁結論\n\nSame page body.\n\n[Go Target](../target/index.md#結論)\n\n[Go Duplicate](../target/index.md#模型-1)\n\n[Same Page](#同頁結論)\n\n[Missing Fragment](#%E0%A4%A)\n\n[Broken](../missing/)\n\n[Bad](file:///etc/passwd)\n`,
  );
  fs.writeFileSync(
    path.join(root, 'alpha', 'target', 'index.md'),
    `---\ndate: 2026-01-02\ntags: [test]\n---\n# Target Article\n\nIntro\n\n## 結論\n\nChinese fragment body.\n\n## 模型\n\nFirst model.\n\n## 模型\n\nSecond model.\n`,
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
    await expect(page.locator('#結論')).toBeInViewport();
    await page.getByRole('button', { name: /Source Article/ }).click();
    await page.getByRole('link', { name: 'Go Duplicate' }).click();
    await expect(page.locator('article header h2')).toHaveText('Target Article');
    await expect(page.locator('#模型-1')).toBeInViewport();
    await page.getByRole('button', { name: /Source Article/ }).click();
    await page.getByRole('link', { name: 'Same Page' }).click();
    await expect(page).toHaveURL(before);
    await expect(page.locator('article header h2')).toHaveText('Source Article');
    await expect(page.locator('#同頁結論')).toBeInViewport();
    await page.getByRole('link', { name: 'Missing Fragment' }).click();
    await expect(page.getByRole('alert')).toContainText('找不到標題片段');
    await page.getByRole('button', { name: /Source Article/ }).click();
    await page.getByRole('link', { name: 'Broken' }).click();
    await expect(page.getByRole('alert')).toContainText('找不到內部文章連結：../missing/');
    await expect(page.locator('article header h2')).toHaveText('Source Article');
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = 'file:///etc/passwd';
      a.textContent = 'Injected bad file link';
      document.querySelector('[data-testid="reader"]')?.append(a);
      a.click();
    });
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
    await expect(page.getByTestId('about-commit')).not.toHaveText('');
    await expect(page.getByTestId('about-commit')).not.toHaveText('local');
    await expect(page.locator(':focus')).toHaveText('關閉');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('關閉');
    await expect(page.evaluate(() => Reflect.has(window, 'require'))).resolves.toBe(false);
    await expect(page.evaluate(() => Reflect.has(window, 'process'))).resolves.toBe(false);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator(':focus')).toHaveText('關於');
  } finally {
    await app.close();
  }
});

test('browses the archive by category, tag, and month without leaving the app shell', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-browse-e2e-'));
  writeArticle(
    root,
    path.join('alpha', 'one'),
    `---\ndate: 2026-02-10\ntags: [shared, first]\n---\n# Alpha One\n\nFirst body.\n`,
  );
  writeArticle(
    root,
    path.join('alpha', 'two'),
    `---\ndate: 2026-01-05\ntags: [shared]\n---\n# Alpha Two\n\nSecond body.\n`,
  );
  writeArticle(
    root,
    path.join('beta', 'three'),
    `---\ndate: 2026-02-01\ntags: [third]\n---\n# Beta Three\n\nThird body.\n`,
  );

  const app = await launch({ ARCHIVE_CONTENT_ROOT: root });
  try {
    const page = await app.firstWindow();
    await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('article-list').getByRole('button')).toHaveCount(3);
    const before = page.url();

    await page.getByTestId('browse-category').click();
    await page.getByRole('button', { name: 'alpha（2 篇）' }).click();
    await expect(page.getByTestId('article-list').getByRole('button')).toHaveCount(2);
    await expect(page.getByRole('button', { name: /Alpha One/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Beta Three/ })).toHaveCount(0);

    await page.getByTestId('browse-tag').click();
    await page.getByRole('button', { name: 'shared（2 篇）' }).click();
    await expect(page.getByTestId('article-list').getByRole('button')).toHaveCount(2);
    await expect(page.getByRole('button', { name: /Alpha Two/ })).toBeVisible();

    await page.getByTestId('browse-timeline').click();
    await page.getByRole('button', { name: '2026 年 2 月（2 篇）' }).click();
    await expect(page.getByTestId('article-list').getByRole('button')).toHaveCount(2);
    await expect(page.getByRole('button', { name: /Beta Three/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Alpha Two/ })).toHaveCount(0);
    await expect(page).toHaveURL(before);
  } finally {
    await app.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('opens a local article image in an accessible keyboard lightbox', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-image-e2e-'));
  const articleRoot = path.join(root, 'images', 'sample');
  writeArticle(
    root,
    path.join('images', 'sample'),
    `---\ndate: 2026-03-01\ntags: [image]\n---\n# Image Article\n\n![Test diagram](diagram.png)\n`,
  );
  fs.writeFileSync(
    path.join(articleRoot, 'diagram.png'),
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lY1ZVQAAAABJRU5ErkJggg==',
      'base64',
    ),
  );

  const app = await launch({ ARCHIVE_CONTENT_ROOT: root });
  try {
    const page = await app.firstWindow();
    await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: /Image Article/ }).click();

    const image = page.getByRole('button', { name: '放大圖片：Test diagram' });
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('loading', 'lazy');
    await image.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: '圖片預覽：Test diagram' });
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('lightbox-image')).toHaveAttribute('alt', 'Test diagram');
    await expect(page.locator(':focus')).toHaveText('關閉圖片');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('關閉圖片');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(image).toBeFocused();
  } finally {
    await app.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
