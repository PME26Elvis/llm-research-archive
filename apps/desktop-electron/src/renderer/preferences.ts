import type { AppLocale } from '@research-observatory/platform-contracts';
import { applyDocumentLocale, DEFAULT_APP_LOCALE } from './i18n';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface ReaderPreferences {
  schemaVersion: 2;
  theme: ThemePreference;
  textScale: number;
  locale: AppLocale;
}

interface LegacyPreferences {
  theme?: unknown;
  fontScale?: unknown;
  textScale?: unknown;
  locale?: unknown;
}

export const PREFERENCES_STORAGE_KEY = 'research-observatory.preferences';
export const CORRUPT_PREFERENCES_STORAGE_KEY = 'research-observatory.preferences.corrupt';
export const MIN_TEXT_SCALE = 0.8;
export const MAX_TEXT_SCALE = 1.4;
export const TEXT_SCALE_STEP = 0.1;

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  schemaVersion: 2,
  theme: 'system',
  textScale: 1,
  locale: DEFAULT_APP_LOCALE,
};

function validTheme(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function validLocale(value: unknown): value is AppLocale {
  return value === 'zh-TW' || value === 'en';
}

export function normalizeTextScale(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 1;
  const clamped = Math.min(MAX_TEXT_SCALE, Math.max(MIN_TEXT_SCALE, value));
  return Math.round(clamped * 10) / 10;
}

export function parseReaderPreferences(raw: string | null): ReaderPreferences {
  if (!raw) return { ...DEFAULT_READER_PREFERENCES };

  const parsed = JSON.parse(raw) as LegacyPreferences & { schemaVersion?: unknown };
  const theme = validTheme(parsed.theme) ? parsed.theme : DEFAULT_READER_PREFERENCES.theme;
  const sourceScale =
    parsed.schemaVersion === 1 || parsed.schemaVersion === 2
      ? parsed.textScale
      : (parsed.textScale ?? parsed.fontScale);

  return {
    schemaVersion: 2,
    theme,
    textScale: normalizeTextScale(sourceScale),
    locale: validLocale(parsed.locale) ? parsed.locale : DEFAULT_APP_LOCALE,
  };
}

export function loadReaderPreferences(storage: Storage): ReaderPreferences {
  const raw = storage.getItem(PREFERENCES_STORAGE_KEY);
  try {
    return parseReaderPreferences(raw);
  } catch {
    if (raw) storage.setItem(CORRUPT_PREFERENCES_STORAGE_KEY, raw);
    storage.removeItem(PREFERENCES_STORAGE_KEY);
    return { ...DEFAULT_READER_PREFERENCES };
  }
}

export function saveReaderPreferences(storage: Storage, preferences: ReaderPreferences): void {
  storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}

export function resolveTheme(theme: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (theme === 'system') return systemPrefersDark ? 'dark' : 'light';
  return theme;
}

export function applyReaderPreferences(
  document: Document,
  preferences: ReaderPreferences,
  systemPrefersDark: boolean,
): void {
  const resolved = resolveTheme(preferences.theme, systemPrefersDark);
  document.documentElement.dataset.themePreference = preferences.theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  document.documentElement.style.setProperty('--reader-text-scale', String(preferences.textScale));
  applyDocumentLocale(document, preferences.locale);
}

export function adjustTextScale(current: number, direction: -1 | 1): number {
  return normalizeTextScale(current + direction * TEXT_SCALE_STEP);
}
