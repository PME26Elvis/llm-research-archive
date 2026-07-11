import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from './electron-test';

function writeArticle(root: string, markdown: string) {
  const directory = path.join(root, 'code', 'highlighting');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.md'), markdown);
}

test('highlights registered fenced languages lazily and preserves safe copy text', async ({
  launchElectron,
}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-highlight-e2e-'));
  writeArticle(
    root,
    `---\ndate: 2026-04-01\ntags: [code]\n---\n# Highlight Article\n\n\`\`\`ts\nconst answer: number = 42;\n\`\`\`\n\n\`\`\`brainfuck\n+++[>+++<-]\n\`\`\`\n\n\`\`\`html\n<script>alert(1)</script>\n\`\`\`\n`,
  );

  const { app, page } = await launchElectron({
    env: { ARCHIVE_CONTENT_ROOT: root },
    cleanupPaths: [root],
  });
  await app.evaluate(({ clipboard }) => clipboard.writeText('before'));
  await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: /Highlight Article/ }).click();

  const blocks = page.locator('.code-block pre > code');
  await expect(blocks).toHaveCount(3);

  const typescript = blocks.nth(0);
  await typescript.scrollIntoViewIfNeeded();
  await expect(typescript).toHaveAttribute('data-highlight-state', 'highlighted');
  await expect(typescript).toHaveAttribute('data-highlight-language', 'typescript');
  await expect(typescript.locator('.hljs-keyword')).toContainText('const');
  await expect(typescript).toHaveText('const answer: number = 42;\n');

  const unknown = blocks.nth(1);
  await unknown.scrollIntoViewIfNeeded();
  await expect(unknown).toHaveAttribute('data-highlight-state', 'plain');
  await expect(unknown.locator('span')).toHaveCount(0);
  await expect(unknown).toHaveText('+++[>+++<-]\n');

  const html = blocks.nth(2);
  await html.scrollIntoViewIfNeeded();
  await expect(html).toHaveAttribute('data-highlight-state', 'highlighted');
  await expect(html.locator('script, iframe, object, embed, img')).toHaveCount(0);
  await expect(html).toHaveText('<script>alert(1)</script>\n');

  await page.getByRole('button', { name: '複製 ts 程式碼' }).click();
  await expect
    .poll(() => app.evaluate(({ clipboard }) => clipboard.readText()))
    .toBe('const answer: number = 42;\n');
});
