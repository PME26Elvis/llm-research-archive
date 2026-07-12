import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanImportMarkdown, createImportPlan, normalizeImportKebabCase } from './index';

const temporaryRoots: string[] = [];

function temporaryRoot(prefix: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  temporaryRoots.push(root);
  return root;
}

afterEach(() => {
  while (temporaryRoots.length) {
    fs.rmSync(temporaryRoots.pop()!, { recursive: true, force: true });
  }
});

describe('article import preview', () => {
  it('creates a deterministic write-free plan for a single Markdown file', () => {
    const root = temporaryRoot('import-file-');
    const workspace = path.join(root, 'workspace');
    const source = path.join(root, 'agent-model-study.md');
    fs.mkdirSync(workspace);
    fs.writeFileSync(
      source,
      [
        '# Agent Model Study',
        '',
        'An AI agent benchmark. \uE200cite\uE202turn0search0\uE201',
        '\uE200entity\uE202["turn0entity0","OpenAI"]\uE201 builds models.',
        '\uE200image_group\uE202temporary\uE201',
        '![draft](sandbox:/mnt/data/draft.png)',
      ].join('\n'),
    );

    const first = createImportPlan({
      sourcePath: source,
      workspaceRoot: workspace,
      publicationDate: '2026-07-12',
    });
    const second = createImportPlan({
      sourcePath: source,
      workspaceRoot: workspace,
      publicationDate: '2026-07-12',
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.plan.planId).toBe(second.plan.planId);
    expect(first.plan.metadata).toEqual({
      title: 'Agent Model Study',
      category: 'llm',
      slug: 'agent-model-study',
      tags: ['LLM', 'Agentic AI', 'Benchmark'],
      date: '2026-07-12',
    });
    expect(first.plan.cleanup).toEqual({
      citationMarkersRemoved: 1,
      entityWrappersUnwrapped: 1,
      imagePlaceholdersRemoved: 1,
      nonPortableImagesRemoved: 1,
    });
    expect(first.plan.articleContent).toContain('OpenAI builds models.');
    expect(first.plan.articleContent).not.toMatch(/\uE200|sandbox:/u);
    expect(first.plan.targetArticleRelativePath).toBe('llm/agent-model-study/index.md');
    expect(first.plan.outputFiles).toHaveLength(1);
    expect(first.plan.canCommit).toBe(true);
    expect(fs.existsSync(first.plan.targetDirectory)).toBe(false);
    expect(fs.existsSync(source)).toBe(true);
  });

  it('plans a folder appendix and sorted nested assets without mutating the source', () => {
    const root = temporaryRoot('import-folder-');
    const workspace = path.join(root, 'workspace');
    const source = path.join(root, 'carbon-report');
    fs.mkdirSync(path.join(source, 'assets', 'charts'), { recursive: true });
    fs.mkdirSync(workspace);
    fs.writeFileSync(
      path.join(source, 'article.md'),
      '---\ntags: [能源, Climate]\n---\n# 台灣能源與碳排報告\n\n![chart](assets/charts/a.png)\n',
    );
    fs.writeFileSync(
      path.join(source, 'research-activity.md'),
      '研究紀錄 \uE200cite\uE202turn0search0\uE201',
    );
    fs.writeFileSync(path.join(source, 'assets', 'z.txt'), 'z');
    fs.writeFileSync(path.join(source, 'assets', 'charts', 'a.png'), 'png');

    const result = createImportPlan({
      sourcePath: source,
      workspaceRoot: workspace,
      publicationDate: '2026-07-12',
      overrides: { slug: 'taiwan-energy-carbon-report' },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.metadata.category).toBe('carbon');
    expect(result.plan.metadata.slug).toBe('taiwan-energy-carbon-report');
    expect(result.plan.metadata.tags).toEqual(['Carbon', '能源', 'Climate']);
    expect(result.plan.assets.map((asset) => asset.outputPath)).toEqual([
      'assets/charts/a.png',
      'assets/z.txt',
    ]);
    expect(result.plan.articleContent).toContain('<summary>附件（展開）</summary>');
    expect(result.plan.articleContent).toContain('研究紀錄');
    expect(result.plan.articleContent).not.toContain('\uE200cite');
    expect(result.plan.warnings).toEqual([]);
    expect(result.plan.outputFiles.map((file) => file.relativePath)).toEqual([
      'carbon/taiwan-energy-carbon-report/index.md',
      'carbon/taiwan-energy-carbon-report/assets/charts/a.png',
      'carbon/taiwan-energy-carbon-report/assets/z.txt',
    ]);
    expect(fs.existsSync(path.join(source, 'article.md'))).toBe(true);
  });

  it('returns a preview with a blocking conflict instead of overwriting a target', () => {
    const root = temporaryRoot('import-conflict-');
    const workspace = path.join(root, 'workspace');
    const source = path.join(root, 'report.md');
    fs.mkdirSync(path.join(workspace, 'llm', 'report'), { recursive: true });
    fs.writeFileSync(source, '# Report\n\nLLM model benchmark.');

    const result = createImportPlan({
      sourcePath: source,
      workspaceRoot: workspace,
      publicationDate: '2026-07-12',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.conflicts).toEqual([expect.objectContaining({ code: 'target-exists' })]);
    expect(result.plan.canCommit).toBe(false);
  });

  it('requires explicit category confirmation when no rule matches', () => {
    const root = temporaryRoot('import-category-');
    const workspace = path.join(root, 'workspace');
    const source = path.join(root, '生活筆記.md');
    fs.mkdirSync(workspace);
    fs.writeFileSync(source, '# 生活筆記\n\n今天整理房間。');

    const result = createImportPlan({
      sourcePath: source,
      workspaceRoot: workspace,
      publicationDate: '2026-07-12',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.metadata.category).toBe('uncategorized');
    expect(result.plan.metadata.slug).toMatch(/^article-[a-f0-9]{12}$/u);
    expect(result.plan.requiresMetadataConfirmation).toBe(true);
    expect(result.plan.canCommit).toBe(false);
    expect(result.plan.warnings.map((warning) => warning.code)).toEqual([
      'category-fallback',
      'slug-fallback',
    ]);
  });

  it('rejects traversal-shaped metadata before constructing a target path', () => {
    const root = temporaryRoot('import-metadata-');
    const workspace = path.join(root, 'workspace');
    const source = path.join(root, 'report.md');
    fs.mkdirSync(workspace);
    fs.writeFileSync(source, '# Report\n\nSoftware algorithm report.');

    const result = createImportPlan({
      sourcePath: source,
      workspaceRoot: workspace,
      publicationDate: '2026-07-12',
      overrides: { category: '../escape', slug: '../outside' },
    });

    expect(result).toEqual({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: 'invalid-metadata',
          severity: 'error',
        }),
      ]),
    });
  });

  it('reports missing local images and exposes cleanup as a reusable pure operation', () => {
    const cleaned = cleanImportMarkdown(
      'Text \uE200cite\uE202x\uE201 ![draft](attachment://draft.png)',
    );
    expect(cleaned.markdown).toBe('Text draft');
    expect(cleaned.cleanup.citationMarkersRemoved).toBe(1);
    expect(cleaned.cleanup.nonPortableImagesRemoved).toBe(1);

    const root = temporaryRoot('import-image-');
    const workspace = path.join(root, 'workspace');
    const source = path.join(root, 'report.md');
    fs.mkdirSync(workspace);
    fs.writeFileSync(source, '# GPU Report\n\n![missing](assets/missing.png)');
    const result = createImportPlan({
      sourcePath: source,
      workspaceRoot: workspace,
      publicationDate: '2026-07-12',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.warnings).toEqual([
      expect.objectContaining({
        code: 'missing-asset-reference',
        path: 'assets/missing.png',
      }),
    ]);
  });

  it('normalizes only safe English kebab-case path segments', () => {
    expect(normalizeImportKebabCase('  Local LLM / GPU Report  ')).toBe('local-llm-gpu-report');
    expect(normalizeImportKebabCase('../escape')).toBe('escape');
    expect(normalizeImportKebabCase('純中文')).toBe('');
  });
});
