import { describe, expect, it } from 'vitest';
import { buildArchiveBrowseModel, filterArticlesByBrowse } from './browse';

const articles = [
  { id: 'alpha', category: 'AI', tags: ['LLM', 'Shared', 'Shared'], date: '2026-02-10' },
  { id: 'beta', category: 'AI', tags: ['Agents', 'Shared'], date: '2026-01-05' },
  { id: 'gamma', category: 'Hardware', tags: ['GPU'], date: '2026-02-01' },
  { id: 'legacy', category: 'Archive', tags: [], date: 'unknown' },
];

describe('archive browse model', () => {
  it('builds deterministic category, tag, and month facets', () => {
    expect(buildArchiveBrowseModel(articles)).toEqual({
      categories: [
        { key: 'AI', label: 'AI', count: 2 },
        { key: 'Archive', label: 'Archive', count: 1 },
        { key: 'Hardware', label: 'Hardware', count: 1 },
      ],
      tags: [
        { key: 'Agents', label: 'Agents', count: 1 },
        { key: 'GPU', label: 'GPU', count: 1 },
        { key: 'LLM', label: 'LLM', count: 1 },
        { key: 'Shared', label: 'Shared', count: 2 },
      ],
      timeline: [
        { key: '2026-02', label: '2026 年 2 月', count: 2 },
        { key: '2026-01', label: '2026 年 1 月', count: 1 },
        { key: 'unknown', label: '日期不明', count: 1 },
      ],
    });
  });

  it('filters articles without mutating their source order', () => {
    expect(filterArticlesByBrowse(articles, 'category', 'AI').map((article) => article.id)).toEqual(
      ['alpha', 'beta'],
    );
    expect(filterArticlesByBrowse(articles, 'tag', 'Shared').map((article) => article.id)).toEqual([
      'alpha',
      'beta',
    ]);
    expect(
      filterArticlesByBrowse(articles, 'timeline', '2026-02').map((article) => article.id),
    ).toEqual(['alpha', 'gamma']);
    expect(filterArticlesByBrowse(articles, 'all', '')).toEqual(articles);
  });
  it('localizes timeline labels for English without changing stable keys', () => {
    const model = buildArchiveBrowseModel(articles, 'en');
    expect(model.timeline[0]).toMatchObject({ key: '2026-02', label: 'February 2026' });
  });
});
