import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderMarkdown } from '@research-observatory/renderer-ui';
import { readingStats, createManifest, scanArchive, parseArticle } from './index';

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
});
