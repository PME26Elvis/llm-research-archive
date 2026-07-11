import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NAVIGATION_LOCATION,
  canNavigateBack,
  canNavigateForward,
  createNavigationHistory,
  currentNavigationLocation,
  moveNavigation,
  pushNavigationLocation,
  replaceNavigationLocation,
} from './navigation-history';

const article = (articleId: string, fragment = '') => ({
  ...DEFAULT_NAVIGATION_LOCATION,
  articleId,
  fragment,
});

describe('navigation history', () => {
  it('pushes distinct locations and exposes back/forward availability', () => {
    let history = createNavigationHistory();
    history = pushNavigationLocation(history, article('alpha'));
    history = pushNavigationLocation(history, article('beta', '結論'));

    expect(canNavigateBack(history)).toBe(true);
    expect(canNavigateForward(history)).toBe(false);
    expect(currentNavigationLocation(history)).toEqual(article('beta', '結論'));

    history = moveNavigation(history, -1);
    expect(currentNavigationLocation(history)).toEqual(article('alpha'));
    expect(canNavigateForward(history)).toBe(true);
  });

  it('does not duplicate the current location', () => {
    const initial = createNavigationHistory(article('alpha'));
    expect(pushNavigationLocation(initial, article('alpha'))).toBe(initial);
  });

  it('replaces transient search state without adding a history entry', () => {
    const initial = createNavigationHistory();
    const replaced = replaceNavigationLocation(initial, {
      ...DEFAULT_NAVIGATION_LOCATION,
      query: '算力',
      browseMode: 'tag',
      selectedFacet: 'ai',
    });

    expect(replaced.entries).toHaveLength(1);
    expect(currentNavigationLocation(replaced).query).toBe('算力');
    expect(currentNavigationLocation(replaced).selectedFacet).toBe('ai');
  });

  it('truncates the forward branch after navigating from an older entry', () => {
    let history = createNavigationHistory();
    history = pushNavigationLocation(history, article('alpha'));
    history = pushNavigationLocation(history, article('beta'));
    history = moveNavigation(history, -1);
    history = pushNavigationLocation(history, article('gamma'));

    expect(history.entries.map((entry) => entry.articleId)).toEqual(['', 'alpha', 'gamma']);
    expect(canNavigateForward(history)).toBe(false);
  });

  it('clamps movement at both history boundaries', () => {
    const initial = createNavigationHistory();
    expect(moveNavigation(initial, -1)).toBe(initial);

    const withArticle = pushNavigationLocation(initial, article('alpha'));
    expect(moveNavigation(withArticle, 1)).toBe(withArticle);
  });
});
