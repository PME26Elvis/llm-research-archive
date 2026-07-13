import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderMarkdown } from '@research-observatory/renderer-ui';
import {
  readingStats,
  createManifest,
  scanArchive,
  scanArchiveWithDiagnostics,
  parseArticle,
  isArticlePath,
  titleFromMarkdown,
  resolveInternalArticleId,
} from './index';

describe('content engine', () => {
  it('matches Python hook counting rules for cjk, latin, code, html and citations', () => {
    expect(
      readingStats(
        '你好 world `inline` ```code``` <b>x</b> cite [link text](https://example.com)',
      ).displayCount,
    ).toBe(7);
    expect(readingStats('').estimatedMinutes).toBe(0);
  });

  it('emits heading slugs that match rendered DOM IDs for Unicode and duplicates', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'content-slug-'));
    const dir = path.join(root, 'alpha', 'slug-test');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'index.md');
    fs.writeFileSync(
      file,
      '---\ndate: 2026-01-01\ntags: [test]\n---\n# 模型\n\n## 模型\n\n## Deep Heading\n',
    );
    const article = parseArticle(file, root)!;
    const html = renderMarkdown(article.markdown);
    for (const heading of article.headings) expect(html).toContain(`id="${heading.slug}"`);
    expect(article.headings.map((h) => h.slug)).toEqual(['模型', '模型-1', 'deep-heading']);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('reports invalid formal index articles without flagging supporting Markdown', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'content-diagnostics-'));
    const valid = path.join(root, 'alpha', 'valid');
    const broken = path.join(root, 'alpha', 'broken');
    fs.mkdirSync(valid, { recursive: true });
    fs.mkdirSync(broken, { recursive: true });
    fs.writeFileSync(
      path.join(valid, 'index.md'),
      '---\ndate: 2026-01-01\ntags: [test]\n---\n# Valid\n',
    );
    fs.writeFileSync(path.join(valid, 'research-activity.md'), '# Supporting appendix\n');
    fs.writeFileSync(path.join(broken, 'index.md'), '---\ndate: [invalid\n---\n# Broken\n');

    const result = scanArchiveWithDiagnostics(root);
    expect(result.articles.map((article) => article.title)).toEqual(['Valid']);
    expect(result.diagnostics.invalidFiles).toEqual(['alpha/broken/index.md']);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('scans only dated formal articles with H1 titles', () => {
    const articles = scanArchive('docs');
    expect(articles).toHaveLength(6);
    expect(articles.some((a) => a.sourcePath === 'index.md')).toBe(false);
    expect(articles.every((a) => a.date && a.title !== a.slug)).toBe(true);
  });

  it('creates a deterministic manifest content hash from article entries', () => {
    const a = createManifest('docs');
    const b = createManifest('docs');
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.articles.length).toBe(6);
  });

  it('handles article path, title, and internal link edge cases deterministically', () => {
    expect(isArticlePath('README.md', { date: '2026-01-01', tags: [] })).toBe(false);
    expect(isArticlePath('alpha/article.md', { date: '2026-01-01', tags: ['x'] })).toBe(true);
    expect(isArticlePath('alpha/article.md', { tags: ['x'] })).toBe(false);
    expect(titleFromMarkdown('# **Clean** title', 'Fallback')).toBe('Clean title');
    expect(titleFromMarkdown('Body only', 'Fallback_Name')).toBe('Fallback_Name');
    expect(resolveInternalArticleId('alpha/source/index.md', '')).toBeUndefined();
    expect(resolveInternalArticleId('alpha/source/index.md', '#local')).toBeUndefined();
    expect(resolveInternalArticleId('alpha/source/index.md', 'https://example.com')).toBeUndefined();
    expect(resolveInternalArticleId('alpha/source/index.md', '../target/')).toBe('alpha/target');
    expect(resolveInternalArticleId('alpha/source/index.md', '../target/index.md#part')).toBe(
      'alpha/target',
    );
    expect(resolveInternalArticleId('alpha/source/index.md', '../../outside.md')).toBeUndefined();
  });

  it('parses root-level metadata fallbacks and revision dates', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'content-root-level-'));
    const file = path.join(root, 'standalone.md');
    fs.writeFileSync(
      file,
      '---\ndate: 2026-01-02\nupdated: 2026-01-03\ntags: [test]\ntitle: Standalone Report\n---\nBody only.\n',
    );
    const article = parseArticle(file, root)!;
    expect(article).toMatchObject({
      category: '未分類',
      slug: 'standalone-report',
      title: 'Standalone Report',
      date: '2026-01-02',
      updatedAt: '2026-01-03',
      sourcePath: 'standalone.md',
    });
    expect(article.excerpt).toBe('Body only.');
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('diagnoses symlinks, broken internal links, and missing local assets', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'content-links-'));
    const articleRoot = path.join(root, 'alpha', 'source');
    fs.mkdirSync(articleRoot, { recursive: true });
    fs.writeFileSync(
      path.join(articleRoot, 'index.md'),
      [
        '---',
        'date: 2026-01-01',
        'tags: [test]',
        '---',
        '# Source',
        '',
        '[Missing](../missing/)',
        '![Missing](assets/missing.png)',
        '![External](https://example.com/ok.png)',
        '![Data](data:image/png;base64,abc)',
      ].join('\n'),
    );
    if (process.platform !== 'win32') {
      fs.symlinkSync(path.join(articleRoot, 'index.md'), path.join(root, 'linked.md'));
    }
    const result = scanArchiveWithDiagnostics(root);
    expect(result.articles.map((article) => article.id)).toEqual(['alpha/source']);
    expect(result.diagnostics.brokenLinks).toEqual(['alpha/source/index.md: ../missing/']);
    expect(result.diagnostics.missingAssets).toEqual([
      'alpha/source/index.md: assets/missing.png',
    ]);
    if (process.platform !== 'win32') {
      expect(result.diagnostics.warnings).toEqual(['linked.md: symlink skipped']);
    }
    fs.rmSync(root, { recursive: true, force: true });
  });
});
