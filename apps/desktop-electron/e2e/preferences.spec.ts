import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from './electron-test';

function writeArticle(root: string) {
  const directory = path.join(root, 'settings', 'sample');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'index.md'),
    `---\ndate: 2026-04-03\ntags: [settings]\n---\n# Preference Article\n\nReadable body.\n\n\`\`\`mermaid\nflowchart TD\n  A[Start] --> B[Finish]\n\`\`\`\n`,
  );
}

test('persists theme and text size across an Electron restart', async ({ launchElectron }) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-preferences-content-'));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-preferences-profile-'));
  writeArticle(root);

  const first = await launchElectron({
    args: [`--user-data-dir=${profile}`],
    env: { ARCHIVE_CONTENT_ROOT: root },
  });
  await expect(first.page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await first.page.getByRole('button', { name: /Preference Article/ }).click();

  const figure = first.page.locator('figure.mermaid-diagram');
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute('data-mermaid-state', 'rendered', { timeout: 30000 });

  await first.page.getByRole('button', { name: '設定' }).click();
  await first.page.getByLabel('深色').check();
  await expect(first.page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(figure).toHaveAttribute('data-mermaid-theme', 'dark');
  await first.page.getByLabel('淺色').check();
  await expect(first.page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(figure).toHaveAttribute('data-mermaid-theme', 'light', { timeout: 30000 });

  await first.page.getByRole('button', { name: '放大文章文字' }).click();
  await first.page.getByRole('button', { name: '放大文章文字' }).click();
  await expect(first.page.getByTestId('settings-text-scale')).toHaveText('120%');
  await first.page.keyboard.press('Escape');
  await expect(first.page.getByRole('dialog')).toHaveCount(0);
  await expect(first.page.getByRole('button', { name: '設定' })).toBeFocused();
  await expect(first.page.locator('html')).toHaveCSS('--reader-text-scale', '1.2');

  await first.page.keyboard.press('Control+-');
  await expect(first.page.locator('html')).toHaveCSS('--reader-text-scale', '1.1');
  await first.page.keyboard.press('Control+0');
  await expect(first.page.locator('html')).toHaveCSS('--reader-text-scale', '1');
  await first.page.keyboard.press('Control+=');
  await first.page.keyboard.press('Control+=');
  await expect(first.page.locator('html')).toHaveCSS('--reader-text-scale', '1.2');

  await first.app.close();

  const second = await launchElectron({
    args: [`--user-data-dir=${profile}`],
    env: { ARCHIVE_CONTENT_ROOT: root },
    cleanupPaths: [root, profile],
  });
  await expect(second.page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await expect(second.page.locator('html')).toHaveAttribute('data-theme-preference', 'light');
  await expect(second.page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(second.page.locator('html')).toHaveCSS('--reader-text-scale', '1.2');
  await second.page.getByRole('button', { name: '設定' }).click();
  await expect(second.page.getByLabel('淺色')).toBeChecked();
  await expect(second.page.getByTestId('settings-text-scale')).toHaveText('120%');
});
