import { expect, test, _electron as electron } from '@playwright/test';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);

function writeArticle(root: string, relativePath: string, markdown: string) {
  const file = path.join(root, relativePath, 'index.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, markdown);
}

async function launch(root: string) {
  return electron.launch({
    executablePath: require('electron'),
    args: ['.', '--no-sandbox'],
    env: { ...(process.env as Record<string, string>), ARCHIVE_CONTENT_ROOT: root },
  });
}

test('renders valid Mermaid near the viewport and preserves invalid source as fallback', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-mermaid-e2e-'));
  writeArticle(
    root,
    path.join('diagram', 'valid'),
    `---\ndate: 2026-03-03\ntags: [mermaid]\n---\n# Valid Diagram\n\n\`\`\`mermaid\nflowchart TD\n  A[開始] --> B[完成]\n  click A "https://example.com"\n\`\`\`\n`,
  );
  writeArticle(
    root,
    path.join('diagram', 'invalid'),
    `---\ndate: 2026-03-04\ntags: [mermaid]\n---\n# Invalid Diagram\n\n\`\`\`mermaid\nthis is not a Mermaid diagram\n\`\`\`\n`,
  );

  const app = await launch(root);
  try {
    const page = await app.firstWindow();
    const articleTitle = page.locator('article header h2');
    await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: /Valid Diagram/ }).click();
    await expect(articleTitle).toHaveText('Valid Diagram');

    const figure = page.locator('figure.mermaid-diagram');
    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toHaveAttribute('data-mermaid-state', 'rendered', { timeout: 30000 });
    await expect(figure.locator('svg[role="img"]')).toHaveAttribute('aria-label', 'Mermaid 圖表');
    await expect(figure.locator('svg')).toContainText('開始');
    await expect(figure.locator('svg')).toContainText('完成');
    await expect(figure.locator('script, foreignObject, iframe, object, embed')).toHaveCount(0);
    await expect(figure.locator('[href^="http"], [xlink\\:href^="http"]')).toHaveCount(0);
    await expect(figure.getByRole('status')).toHaveText('Mermaid 圖表已完成');

    const sourceDetails = figure.locator('details.mermaid-source');
    await expect(sourceDetails).not.toHaveAttribute('open', '');
    await figure.getByText('查看 Mermaid 原始碼', { exact: true }).click();
    await expect(sourceDetails).toHaveAttribute('open', '');
    await expect(figure.getByRole('button', { name: '複製 mermaid 程式碼' })).toBeVisible();

    await page.getByRole('button', { name: /Invalid Diagram/ }).click();
    await expect(articleTitle).toHaveText('Invalid Diagram');
    const invalidFigure = page.locator('figure.mermaid-diagram');
    await expect(invalidFigure).toBeVisible();
    await invalidFigure.scrollIntoViewIfNeeded();
    await expect(invalidFigure).toHaveAttribute('data-mermaid-state', 'error', { timeout: 30000 });
    await expect(invalidFigure.getByRole('alert')).toHaveText('Mermaid 圖表無法渲染，已保留原始碼');
    await expect(invalidFigure.locator('details.mermaid-source')).toHaveAttribute('open', '');
    await expect(invalidFigure).toContainText('this is not a Mermaid diagram');
  } finally {
    await app.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
