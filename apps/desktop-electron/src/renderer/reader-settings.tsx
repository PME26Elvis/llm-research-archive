import React, { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_READER_PREFERENCES,
  adjustTextScale,
  applyReaderPreferences,
  loadReaderPreferences,
  resolveTheme,
  saveReaderPreferences,
  type ReaderPreferences,
  type ThemePreference,
} from './preferences';

const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const initialPreferences = loadReaderPreferences(window.localStorage);
applyReaderPreferences(document, initialPreferences, systemTheme.matches);

interface SettingsDialogProps {
  preferences: ReaderPreferences;
  onChange(preferences: ReaderPreferences): void;
  onClose(): void;
}

function SettingsDialog({ preferences, onChange, onClose }: SettingsDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function setTheme(theme: ThemePreference) {
    onChange({ ...preferences, theme });
  }

  function setTextScale(textScale: number) {
    onChange({ ...preferences, textScale });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="modal settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <h2 id="settings-title">閱讀設定</h2>
        <fieldset className="settings-theme">
          <legend>外觀</legend>
          {(
            [
              ['system', '跟隨系統'],
              ['light', '淺色'],
              ['dark', '深色'],
            ] as const
          ).map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="theme"
                value={value}
                checked={preferences.theme === value}
                onChange={() => setTheme(value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <section className="settings-text" aria-labelledby="text-size-title">
          <h3 id="text-size-title">文章文字大小</h3>
          <div className="text-scale-controls">
            <button
              type="button"
              aria-label="縮小文章文字"
              onClick={() => setTextScale(adjustTextScale(preferences.textScale, -1))}
            >
              A−
            </button>
            <button type="button" aria-label="重設文章文字大小" onClick={() => setTextScale(1)}>
              <output data-testid="settings-text-scale">
                {Math.round(preferences.textScale * 100)}%
              </output>
            </button>
            <button
              type="button"
              aria-label="放大文章文字"
              onClick={() => setTextScale(adjustTextScale(preferences.textScale, 1))}
            >
              A+
            </button>
          </div>
          <p className="settings-hint">快捷鍵：Ctrl++、Ctrl+-、Ctrl+0</p>
        </section>
        <button ref={closeRef} type="button" onClick={onClose}>
          關閉設定
        </button>
      </section>
    </div>
  );
}

export function ReaderSettings() {
  const [preferences, setPreferences] = useState<ReaderPreferences>(initialPreferences);
  const [systemPrefersDark, setSystemPrefersDark] = useState(systemTheme.matches);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const resolvedThemeRef = useRef(resolveTheme(initialPreferences.theme, systemTheme.matches));

  useEffect(() => {
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    systemTheme.addEventListener('change', onChange);
    return () => systemTheme.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    applyReaderPreferences(document, preferences, systemPrefersDark);
    saveReaderPreferences(window.localStorage, preferences);
    const resolved = resolveTheme(preferences.theme, systemPrefersDark);
    if (resolved !== resolvedThemeRef.current) {
      resolvedThemeRef.current = resolved;
      document.dispatchEvent(new Event('observatory-theme-change'));
    }
  }, [preferences, systemPrefersDark]);

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

  function close() {
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  return (
    <>
      <button ref={buttonRef} type="button" onClick={() => setOpen(true)}>
        設定
      </button>
      {open && (
        <SettingsDialog preferences={preferences} onChange={setPreferences} onClose={close} />
      )}
    </>
  );
}

export const __test__ = { initialPreferences, defaults: DEFAULT_READER_PREFERENCES };
