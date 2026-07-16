import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from './electron-test';

interface MermaidFence {
  label: string;
  source: string;
}

function writeArticle(root: string, relativePath: string, markdown: string) {
  const file = path.join(root, relativePath, 'index.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, markdown);
}

function collectMermaidFences(root: string): MermaidFence[] {
  const fences: MermaidFence[] = [];
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolute);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const markdown = fs.readFileSync(absolute, 'utf8');
      const pattern = /^[ \t]*(`{3,})[ \t]*mermaid(?:[^\n]*)\r?\n([\s\S]*?)^[ \t]*\1[ \t]*$/gim;
      for (const match of markdown.matchAll(pattern)) {
        const line = markdown.slice(0, match.index).split(/\r?\n/).length;
        fences.push({
          label: `${path.relative(root, absolute).replaceAll(path.sep, '/')}:${line}`,
          source: match[2],
        });
      }
    }
  };
  visit(root);
  return fences;
}

async function expectAllFiguresRendered(page: import('@playwright/test').Page, labels: string[]) {
  const figures = page.locator('figure.mermaid-diagram');
  await expect(figures).toHaveCount(labels.length);
  for (const [index, label] of labels.entries()) {
    const figure = figures.nth(index);
    await figure.scrollIntoViewIfNeeded();
    await expect
      .poll(() => figure.getAttribute('data-mermaid-state'), {
        message: `Mermaid diagram did not settle: ${label}`,
        timeout: 30000,
      })
      .toMatch(/^(?:rendered|error)$/);
    expect(await figure.getAttribute('data-mermaid-state'), `Mermaid failed: ${label}`).toBe(
      'rendered',
    );
    await expect(figure.locator('svg[role="img"]')).toHaveCount(1);
  }
}

test('renders supported Mermaid syntax near the viewport and preserves invalid source', async ({
  launchElectron,
}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-mermaid-e2e-'));
  const validDiagrams: MermaidFence[] = [
    {
      label: 'flowchart with BOM and CRLF',
      source: '\uFEFFflowchart TD\r\n  A[開始] --> B[完成]\r\n  click A "https://example.com"',
    },
    {
      label: 'sequence diagram',
      source: 'sequenceDiagram\n  participant U as User\n  participant A as Archive\n  U->>A: Open article\n  A-->>U: Render content',
    },
    {
      label: 'state diagram',
      source: 'stateDiagram-v2\n  [*] --> Idle\n  Idle --> Reading\n  Reading --> Idle',
    },
    {
      label: 'class diagram',
      source: 'classDiagram\n  class Article {\n    +String title\n    +render()\n  }',
    },
    {
      label: 'entity relationship diagram',
      source: 'erDiagram\n  ARTICLE ||--o{ TAG : has\n  ARTICLE {\n    string title\n  }',
    },
  ];
  writeArticle(
    root,
    path.join('diagram', 'valid'),
    `---\ndate: 2026-03-03\ntags: [mermaid]\n---\n# Valid Diagram\n\n${validDiagrams
      .map(({ label, source }) => `## ${label}\n\n\`\`\`mermaid\n${source}\n\`\`\``)
      .join('\n\n')}\n`,
  );
  writeArticle(
    root,
    path.join('diagram', 'invalid'),
    `---\ndate: 2026-03-04\ntags: [mermaid]\n---\n# Invalid Diagram\n\n\`\`\`mermaid\nthis is not a Mermaid diagram\n\`\`\`\n`,
  );

  const { page } = await launchElectron({
    env: { ARCHIVE_CONTENT_ROOT: root },
    cleanupPaths: [root],
  });
  const articleTitle = page.locator('article header h2');
  await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: /Valid Diagram/ }).click();
  await expect(articleTitle).toHaveText('Valid Diagram');

  await expectAllFiguresRendered(
    page,
    validDiagrams.map(({ label }) => label),
  );
  const firstFigure = page.locator('figure.mermaid-diagram').first();
  await expect(firstFigure.locator('svg')).toContainText('開始');
  await expect(firstFigure.locator('svg')).toContainText('完成');
  await expect(firstFigure.locator('script, foreignObject, iframe, object, embed')).toHaveCount(0);
  await expect(firstFigure.locator('[href^="http"], [xlink\\:href^="http"]')).toHaveCount(0);
  await expect(firstFigure.getByRole('status')).toHaveText('Mermaid 圖表已完成');

  const sourceDetails = firstFigure.locator('details.mermaid-source');
  await expect(sourceDetails).not.toHaveAttribute('open', '');
  await firstFigure.getByText('查看 Mermaid 原始碼', { exact: true }).click();
  await expect(sourceDetails).toHaveAttribute('open', '');
  await expect(firstFigure.getByRole('button', { name: '複製 mermaid 程式碼' })).toBeVisible();

  await page.getByRole('button', { name: /Invalid Diagram/ }).click();
  await expect(articleTitle).toHaveText('Invalid Diagram');
  const invalidFigure = page.locator('figure.mermaid-diagram');
  await expect(invalidFigure).toBeVisible();
  await invalidFigure.scrollIntoViewIfNeeded();
  await expect(invalidFigure).toHaveAttribute('data-mermaid-state', 'error', { timeout: 30000 });
  await expect(invalidFigure.getByRole('alert')).toHaveText('Mermaid 圖表無法渲染，已保留原始碼');
  await expect(invalidFigure.locator('details.mermaid-source')).toHaveAttribute('open', '');
  await expect(invalidFigure).toContainText('this is not a Mermaid diagram');
});

test('renders every Mermaid fence in the bundled Markdown corpus', async ({ launchElectron }) => {
  const docsRoot = path.resolve(process.cwd(), 'docs');
  const fences = collectMermaidFences(docsRoot);
  expect(fences.length, 'The bundled corpus should contain Mermaid coverage').toBeGreaterThan(0);

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-mermaid-corpus-e2e-'));
  writeArticle(
    root,
    path.join('diagram', 'corpus'),
    `---\ndate: 2026-07-17\ntags: [mermaid, corpus]\n---\n# Bundled Mermaid Corpus\n\n${fences
      .map(({ label, source }) => `## ${label}\n\n\`\`\`mermaid\n${source}\n\`\`\``)
      .join('\n\n')}\n`,
  );

  const { page } = await launchElectron({
    env: { ARCHIVE_CONTENT_ROOT: root },
    cleanupPaths: [root],
  });
  await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: /Bundled Mermaid Corpus/ }).click();
  await expect(page.locator('article header h2')).toHaveText('Bundled Mermaid Corpus');
  await expectAllFiguresRendered(
    page,
    fences.map(({ label }) => label),
  );
});
