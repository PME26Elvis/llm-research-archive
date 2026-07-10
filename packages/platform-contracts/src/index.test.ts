import { expect, it } from 'vitest';
import {
  ArticleListResponseSchema,
  SearchRequestSchema,
  SearchResponseSchema,
  ExternalUrlSchema,
} from './index';
it('validates ipc request and response dtos', () => {
  expect(SearchRequestSchema.parse({ query: 'x' }).query).toBe('x');
  expect(() => ExternalUrlSchema.parse('file:///tmp/x')).toThrow();
  const summary = {
    id: 'a',
    slug: 'a',
    title: 'A',
    date: '2026-01-01',
    category: 'c',
    tags: [],
    excerpt: '',
    sourcePath: 'c/a/index.md',
    assetRoot: 'c/a',
    readingStats: { displayCount: 1, cjkCharacters: 1, latinNumberTokens: 0, estimatedMinutes: 1 },
  };
  expect(ArticleListResponseSchema.parse([summary])[0].title).toBe('A');
  expect(SearchResponseSchema.parse([{ ...summary, score: 1 }])[0].score).toBe(1);
});
