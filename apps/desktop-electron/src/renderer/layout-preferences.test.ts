import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LAYOUT_PREFERENCES,
  LAYOUT_PREFERENCES_KEY,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  adjustSidebarWidth,
  loadLayoutPreferences,
  saveLayoutPreferences,
} from './layout-preferences';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe('layout preferences', () => {
  it('uses defaults when no persisted value exists', () => {
    expect(loadLayoutPreferences(new MemoryStorage())).toEqual(DEFAULT_LAYOUT_PREFERENCES);
  });

  it('clamps widths and preserves the collapsed state', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LAYOUT_PREFERENCES_KEY,
      JSON.stringify({ schemaVersion: 1, sidebarWidth: 9999, sidebarCollapsed: true }),
    );
    expect(loadLayoutPreferences(storage)).toEqual({
      schemaVersion: 1,
      sidebarWidth: MAX_SIDEBAR_WIDTH,
      sidebarCollapsed: true,
    });
  });

  it('recovers from malformed JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(LAYOUT_PREFERENCES_KEY, '{broken');
    expect(loadLayoutPreferences(storage)).toEqual(DEFAULT_LAYOUT_PREFERENCES);
  });

  it('normalizes before saving', () => {
    const storage = new MemoryStorage();
    expect(
      saveLayoutPreferences(storage, {
        schemaVersion: 1,
        sidebarWidth: 12,
        sidebarCollapsed: false,
      }),
    ).toEqual({ schemaVersion: 1, sidebarWidth: MIN_SIDEBAR_WIDTH, sidebarCollapsed: false });
  });

  it('adjusts with keyboard-sized steps inside the allowed range', () => {
    expect(adjustSidebarWidth(MIN_SIDEBAR_WIDTH, -20)).toBe(MIN_SIDEBAR_WIDTH);
    expect(adjustSidebarWidth(360, 20)).toBe(380);
    expect(adjustSidebarWidth(MAX_SIDEBAR_WIDTH, 20)).toBe(MAX_SIDEBAR_WIDTH);
  });
});
