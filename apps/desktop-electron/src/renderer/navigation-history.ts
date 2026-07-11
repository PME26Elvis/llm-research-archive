import type { BrowseMode } from '@research-observatory/renderer-ui';

export interface NavigationLocation {
  articleId: string;
  fragment: string;
  query: string;
  browseMode: BrowseMode;
  selectedFacet: string;
}

export interface NavigationHistory {
  entries: NavigationLocation[];
  index: number;
}

export const DEFAULT_NAVIGATION_LOCATION: NavigationLocation = {
  articleId: '',
  fragment: '',
  query: '',
  browseMode: 'all',
  selectedFacet: '',
};

const MAX_HISTORY_ENTRIES = 100;

function normalizeLocation(location: NavigationLocation): NavigationLocation {
  return {
    articleId: location.articleId,
    fragment: location.fragment,
    query: location.query,
    browseMode: location.browseMode,
    selectedFacet: location.selectedFacet,
  };
}

function sameLocation(left: NavigationLocation, right: NavigationLocation): boolean {
  return (
    left.articleId === right.articleId &&
    left.fragment === right.fragment &&
    left.query === right.query &&
    left.browseMode === right.browseMode &&
    left.selectedFacet === right.selectedFacet
  );
}

export function createNavigationHistory(
  initial: NavigationLocation = DEFAULT_NAVIGATION_LOCATION,
): NavigationHistory {
  return { entries: [normalizeLocation(initial)], index: 0 };
}

export function currentNavigationLocation(history: NavigationHistory): NavigationLocation {
  return history.entries[history.index] ?? DEFAULT_NAVIGATION_LOCATION;
}

export function pushNavigationLocation(
  history: NavigationHistory,
  location: NavigationLocation,
): NavigationHistory {
  const normalized = normalizeLocation(location);
  if (sameLocation(currentNavigationLocation(history), normalized)) return history;

  const entries = history.entries.slice(0, history.index + 1).concat(normalized);
  const bounded = entries.slice(-MAX_HISTORY_ENTRIES);
  return { entries: bounded, index: bounded.length - 1 };
}

export function replaceNavigationLocation(
  history: NavigationHistory,
  location: NavigationLocation,
): NavigationHistory {
  const normalized = normalizeLocation(location);
  if (sameLocation(currentNavigationLocation(history), normalized)) return history;
  const entries = [...history.entries];
  entries[history.index] = normalized;
  return { entries, index: history.index };
}

export function moveNavigation(history: NavigationHistory, delta: -1 | 1): NavigationHistory {
  const index = Math.min(history.entries.length - 1, Math.max(0, history.index + delta));
  return index === history.index ? history : { entries: history.entries, index };
}

export function canNavigateBack(history: NavigationHistory): boolean {
  return history.index > 0;
}

export function canNavigateForward(history: NavigationHistory): boolean {
  return history.index < history.entries.length - 1;
}
