import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  resolveLocale,
  translate,
  type LanguagePreference,
  type TranslationKey,
  type TranslationParams,
  type UiLocale,
} from './i18n';
import {
  adjustTextScale,
  applyReaderPreferences,
  loadReaderPreferences,
  resolveTheme,
  saveReaderPreferences,
  type ReaderPreferences,
  type ThemePreference,
} from './preferences';

const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

interface PreferencesContextValue {
  preferences: ReaderPreferences;
  locale: UiLocale;
  t(key: TranslationKey, params?: TranslationParams): string;
  formatNumber(value: number): string;
  formatDateTime(value: string | number | Date): string;
  setTheme(theme: ThemePreference): void;
  setLanguage(language: LanguagePreference): void;
  setTextScale(textScale: number): void;
  adjustTextScale(direction: -1 | 1): void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function systemLanguages(): readonly string[] {
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(() => loadReaderPreferences(window.localStorage));
  const [systemPrefersDark, setSystemPrefersDark] = useState(systemTheme.matches);
  const [languageRevision, setLanguageRevision] = useState(0);
  const resolvedThemeRef = useRef(resolveTheme(preferences.theme, systemTheme.matches));
  const locale = useMemo(
    () => resolveLocale(preferences.language, systemLanguages()),
    [preferences.language, languageRevision],
  );

  useEffect(() => {
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    systemTheme.addEventListener('change', onChange);
    return () => systemTheme.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onLanguageChange = () => setLanguageRevision((revision) => revision + 1);
    window.addEventListener('languagechange', onLanguageChange);
    return () => window.removeEventListener('languagechange', onLanguageChange);
  }, []);

  useEffect(() => {
    applyReaderPreferences(document, preferences, systemPrefersDark);
    saveReaderPreferences(window.localStorage, preferences);
    document.documentElement.lang = locale;
    document.title = translate(locale, 'app.title');
    void window.observatory.setLocale(locale).catch((error) => {
      void window.observatory
        .reportDiagnostic({
          area: 'preferences',
          code: 'locale-sync-failed',
          message: String(error),
        })
        .catch(() => undefined);
    });
    const resolved = resolveTheme(preferences.theme, systemPrefersDark);
    if (resolved !== resolvedThemeRef.current) {
      resolvedThemeRef.current = resolved;
      document.dispatchEvent(new Event('observatory-theme-change'));
    }
  }, [locale, preferences, systemPrefersDark]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === '+' || event.key === '=' || event.code === 'NumpadAdd') {
        event.preventDefault();
        setPreferences((current) => ({
          ...current,
          textScale: adjustTextScale(current.textScale, 1),
        }));
      } else if (event.key === '-' || event.code === 'NumpadSubtract') {
        event.preventDefault();
        setPreferences((current) => ({
          ...current,
          textScale: adjustTextScale(current.textScale, -1),
        }));
      } else if (event.key === '0' || event.code === 'Numpad0') {
        event.preventDefault();
        setPreferences((current) => ({ ...current, textScale: 1 }));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => translate(locale, key, params),
    [locale],
  );
  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      locale,
      t,
      formatNumber: (number) => number.toLocaleString(locale),
      formatDateTime: (date) => new Date(date).toLocaleString(locale),
      setTheme: (theme) => setPreferences((current) => ({ ...current, theme })),
      setLanguage: (language) => setPreferences((current) => ({ ...current, language })),
      setTextScale: (textScale) => setPreferences((current) => ({ ...current, textScale })),
      adjustTextScale: (direction) =>
        setPreferences((current) => ({
          ...current,
          textScale: adjustTextScale(current.textScale, direction),
        })),
    }),
    [locale, preferences, t],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used inside PreferencesProvider');
  return value;
}
