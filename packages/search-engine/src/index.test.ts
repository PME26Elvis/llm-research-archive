import { expect, it } from 'vitest';
import { searchArticles } from './index';
it('finds article text', () => {
  expect(
    searchArticles(
      [{ id: 'a', title: 'Alpha', tags: [], markdown: 'beta', excerpt: 'beta' } as any],
      'beta',
    )[0].id,
  ).toBe('a');
});
