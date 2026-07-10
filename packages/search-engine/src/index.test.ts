import { expect, it } from 'vitest';
import { searchArticles } from './index';
const article: any = {
  id: 'llm/compute',
  slug: 'compute',
  title: '算力遠遠不夠 compute',
  date: '2026-03-20',
  category: 'llm',
  tags: ['AI'],
  markdown: '中文算力 and compute body',
  excerpt: 'excerpt',
  sourcePath: 'llm/compute/index.md',
  assetRoot: 'llm/compute',
  readingStats: { displayCount: 10, cjkCharacters: 4, latinNumberTokens: 6, estimatedMinutes: 1 },
};
it('returns complete renderer-safe metadata for English query', () => {
  const r = searchArticles([article], 'compute');
  expect(r[0].readingStats.estimatedMinutes).toBe(1);
  expect(r[0].date).toBe('2026-03-20');
  expect(r[0].tags).toEqual(['AI']);
});
it('handles empty, no-result and CJK query', () => {
  expect(searchArticles([article], '')).toEqual([]);
  expect(searchArticles([article], 'missing')).toEqual([]);
  expect(searchArticles([article], '算力')[0].id).toBe('llm/compute');
});
