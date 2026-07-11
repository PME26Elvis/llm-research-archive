import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from './electron-test';

function writeArticle(root: string, markdown: string) {
  const directory = path.join(root, 'notes', 'footnotes');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.md'), markdown);
}

test('navigates repeated footnotes and back references inside the reader', async ({
  launchElectron,
}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-footnotes-e2e-'));
  writeArticle(
    root,
    `---\ndate: 2026-04-02\ntags: [footnotes]\n---\n# Footnote Article\n\n第一次引用[^來源]，第二次引用[^來源]，以及 inline note.^[行內補充]\n\n[^來源]: 這是一段中文註腳。\n\n    第二段仍屬於同一個註腳。\n`,
  );

  const { page } = await launchElectron({
    env: { ARCHIVE_CONTENT_ROOT: root },
    cleanupPaths: [root],
  });
  await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: /Footnote Article/ }).click();

  const reader = page.getByTestId('reader');
  await expect(reader.locator('section.footnotes')).toHaveAttribute('aria-label', '註腳');
  await expect(reader.locator('.footnote-item')).toHaveCount(2);
  await expect(reader.locator('#fnref-1')).toHaveAttribute('aria-label', '註腳 1');
  await expect(reader.locator('#fnref-1-2')).toHaveAttribute('aria-label', '註腳 1');
  await expect(reader.locator('#fn-1')).toContainText('第二段仍屬於同一個註腳');
  await expect(reader.locator('script, iframe, object, embed')).toHaveCount(0);

  const before = page.url();
  await reader.locator('#fnref-1-2').click();
  await expect(reader.locator('#fn-1')).toBeFocused();
  await expect(reader.locator('#fn-1')).toBeInViewport();
  await expect(page).toHaveURL(before);

  const secondBackref = reader.getByRole('link', {
    name: '返回註腳 1 的第 2 個引用位置',
  });
  await secondBackref.click();
  await expect(reader.locator('#fnref-1-2')).toBeFocused();
  await expect(reader.locator('#fnref-1-2')).toBeInViewport();
  await expect(page).toHaveURL(before);
});
