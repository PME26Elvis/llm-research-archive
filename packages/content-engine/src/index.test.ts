import { describe, it, expect } from 'vitest';
import { readingStats, createManifest, scanArchive } from './index';

describe('content engine', () => {
  it('matches Python hook counting rules for cjk, latin, code, html and citations', () => {
    expect(
      readingStats(
        '你好 world `inline` ```code``` <b>x</b> cite [link text](https://example.com)',
      ).displayCount,
    ).toBe(7);
    expect(readingStats('').estimatedMinutes).toBe(0);
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
