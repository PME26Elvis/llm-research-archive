import { describe, expect, it } from 'vitest';
import { asArticleId, asCategoryId, type Article } from '@research-observatory/domain';
import { SearchIndex, searchArticles } from './index';

function article(overrides: Partial<Article> = {}): Article {
  return {
    id: asArticleId('llm/compute'),
    slug: 'compute',
    title: '算力遠遠不夠 compute',
    date: '2026-03-20',
    category: asCategoryId('llm'),
    tags: ['AI'],
    markdown: '中文算力 and compute body',
    excerpt: 'excerpt',
    sourcePath: 'llm/compute/index.md',
    assetRoot: 'llm/compute',
    readingStats: {
      displayCount: 10,
      cjkCharacters: 4,
      latinNumberTokens: 6,
      estimatedMinutes: 1,
    },
    links: [],
    headings: [],
    ...overrides,
  };
}

describe('SearchIndex', () => {
  it('returns complete renderer-safe metadata for English, CJK, and facet queries', () => {
    const index = new SearchIndex([
      article(),
      article({
        id: asArticleId('carbon/grid'),
        slug: 'grid',
        title: 'Grid report',
        category: asCategoryId('carbon'),
        tags: ['energy'],
        markdown: 'compute grid',
        date: '2026-02-10',
      }),
    ]);
    const result = index.search('compute');
    expect(result[0].readingStats.estimatedMinutes).toBe(1);
    expect(result[0].date).toBe('2026-03-20');
    expect(result[0].tags).toEqual(['AI']);
    expect(index.search('算力')[0].id).toBe('llm/compute');
    expect(index.search('compute', { mode: 'category', facet: 'carbon' })).toHaveLength(1);
    expect(index.filter({ mode: 'timeline', facet: '2026-03' })[0].id).toBe('llm/compute');
  });

  it('supports deterministic incremental updates and removal', () => {
    const index = new SearchIndex([article()]);
    index.upsert(article({ title: 'Updated compute', markdown: 'updated needle' }));
    expect(index.size()).toBe(1);
    expect(index.search('needle')[0].title).toBe('Updated compute');
    expect(index.remove('llm/compute')).toBe(true);
    expect(index.search('needle')).toEqual([]);
  });

  it('round-trips a versioned serialized index without changing order or results', () => {
    const index = new SearchIndex([
      article(),
      article({
        id: asArticleId('llm/second'),
        slug: 'second',
        title: 'Second compute',
        sourcePath: 'llm/second/index.md',
        assetRoot: 'llm/second',
      }),
    ]);
    const restored = SearchIndex.deserialize(index.serialize());
    expect(restored.filter().map((item) => item.id)).toEqual(['llm/compute', 'llm/second']);
    expect(restored.search('compute')).toEqual(index.search('compute'));
  });

  it('rejects corrupt serialized payloads', () => {
    expect(() => SearchIndex.deserialize('{"schemaVersion":2,"documents":[]}')).toThrow(
      'unsupported-search-index-version',
    );
    expect(() =>
      SearchIndex.deserialize('{"schemaVersion":1,"documents":[{"ordinal":0}]}'),
    ).toThrow();
  });
});

it('keeps the searchArticles compatibility helper behavior', () => {
  expect(searchArticles([article()], '')).toEqual([]);
  expect(searchArticles([article()], 'missing')).toEqual([]);
  expect(searchArticles([article()], '算力')[0].id).toBe('llm/compute');
});
