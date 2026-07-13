import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from './electron-test';

function writeArticle(root: string) {
  const directory = path.join(root, 'language', 'sample');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'index.md'),
    `---\ndate: 2026-07-13\ntags: [language]\n---\n# Bilingual Article\n\nBody with a footnote.[^1]\n\n[^1]: Localized footnote.\n`,
  );
}

test('switches the complete desktop chrome to English and persists it across restart', async ({
  launchElectron,
}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-locale-content-'));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-locale-profile-'));
  writeArticle(root);

  const first = await launchElectron({
    args: [`--user-data-dir=${profile}`],
    env: { ARCHIVE_CONTENT_ROOT: root },
  });
  await expect(first.page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await first.page.getByRole('button', { name: '設定' }).click();
  await first.page.getByLabel('語言').selectOption('en');

  await expect(first.page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(first.page.locator('html')).toHaveAttribute('data-locale', 'en');
  await expect(first.page.getByRole('heading', { name: 'Reading settings' })).toBeVisible();
  await first.page.getByRole('button', { name: 'Close settings' }).click();
  await expect(first.page.getByLabel('Search articles')).toBeVisible();
  await expect(first.page.getByRole('button', { name: 'Import article' })).toBeVisible();
  await first.page.getByRole('button', { name: 'Observatory' }).click();
  await expect(
    first.page.getByRole('heading', { name: 'Observatory archive summary' }),
  ).toBeVisible();
  await first.page.getByRole('button', { name: 'Close' }).click();

  const menuLabels = await first.app.evaluate(
    ({ Menu }) => Menu.getApplicationMenu()?.items.map((item) => item.label) ?? [],
  );
  expect(menuLabels).toEqual(expect.arrayContaining(['Navigate', 'View', 'Help']));
  await first.app.close();

  const second = await launchElectron({
    args: [`--user-data-dir=${profile}`],
    env: { ARCHIVE_CONTENT_ROOT: root },
    cleanupPaths: [root, profile],
  });
  await expect(second.page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await expect(second.page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(second.page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await second.page.getByRole('button', { name: /Bilingual Article/ }).click();
  await expect(second.page.getByRole('region', { name: 'Footnotes' })).toBeVisible();
});
