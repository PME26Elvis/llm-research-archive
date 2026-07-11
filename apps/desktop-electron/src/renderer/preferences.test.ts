import { describe, expect, it } from 'vitest';
import {
  CORRUPT_PREFERENCES_STORAGE_KEY,
  DEFAULT_READER_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  adjustTextScale,
  loadReaderPreferences,
  normalizeTextScale,
  parseReaderPreferences,
  resolveTheme,
  saveReaderPreferences,
} from './preferences';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe('reader preferences', () => {
  it('returns defaults for an empty store', () => {
    expect(parseReaderPreferences(null)).toEqual(DEFAULT_READER_PREFERENCES);
  });

  it('migrates the legacy fontScale shape and clamps values', () => {
    expect(parseReaderPreferences('{"theme":"dark","fontScale":1.28}')).toEqual({
      schemaVersion: 1,
      theme: 'dark',
      textScale: 1.3,
    });
    expect(normalizeTextScale(4)).toBe(1.4);
    expect(normalizeTextScale(0)).toBe(0.8);
  });

  it('backs up corrupt data and resets safely', () => {
    const storage = new MemoryStorage();
    storage.setItem(PREFERENCES_STORAGE_KEY, '{broken');

    expect(loadReaderPreferences(storage)).toEqual(DEFAULT_READER_PREFERENCES);
    expect(storage.getItem(CORRUPT_PREFERENCES_STORAGE_KEY)).toBe('{broken');
    expect(storage.getItem(PREFERENCES_STORAGE_KEY)).toBeNull();
  });

  it('persists a normalized versioned payload', () => {
    const storage = new MemoryStorage();
    const preferences = { schemaVersion: 1 as const, theme: 'light' as const, textScale: 1.2 };

    saveReaderPreferences(storage, preferences);
    expect(loadReaderPreferences(storage)).toEqual(preferences);
  });

  it('resolves the system theme and bounded keyboard steps', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(adjustTextScale(1, 1)).toBe(1.1);
    expect(adjustTextScale(0.8, -1)).toBe(0.8);
    expect(adjustTextScale(1.4, 1)).toBe(1.4);
  });
});
