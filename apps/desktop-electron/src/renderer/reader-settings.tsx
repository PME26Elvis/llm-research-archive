import React, { useEffect, useRef, useState } from 'react';
import type { AppLocale } from '@research-observatory/platform-contracts';
import { adjustTextScale, type ReaderPreferences, type ThemePreference } from './preferences';
import { translate } from './i18n';

interface SettingsDialogProps {
  preferences: ReaderPreferences;
  onChange(preferences: ReaderPreferences): void;
  onClose(): void;
}

function SettingsDialog({ preferences, onChange, onClose }: SettingsDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const t = (key: Parameters<typeof translate>[1]) => translate(preferences.locale, key);

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

  const update = (patch: Partial<ReaderPreferences>) => onChange({ ...preferences, ...patch });

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="modal settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <h2 id="settings-title">{t('settings.title')}</h2>
        <fieldset className="settings-theme">
          <legend>{t('settings.appearance')}</legend>
          {(
            [
              ['system', 'settings.theme.system'],
              ['light', 'settings.theme.light'],
              ['dark', 'settings.theme.dark'],
            ] as const
          ).map(([value, key]) => (
            <label key={value}>
              <input
                type="radio"
                name="theme"
                value={value}
                checked={preferences.theme === value}
                onChange={() => update({ theme: value as ThemePreference })}
              />
              {t(key)}
            </label>
          ))}
        </fieldset>
        <section className="settings-language" aria-labelledby="language-title">
          <h3 id="language-title">{t('settings.language')}</h3>
          <select
            aria-label={t('settings.language')}
            value={preferences.locale}
            onChange={(event) => update({ locale: event.target.value as AppLocale })}
          >
            <option value="zh-TW">{t('settings.language.zhTW')}</option>
            <option value="en">{t('settings.language.en')}</option>
          </select>
          <p className="settings-hint">{t('settings.language.description')}</p>
        </section>
        <section className="settings-text" aria-labelledby="text-size-title">
          <h3 id="text-size-title">{t('settings.textSize')}</h3>
          <div className="text-scale-controls">
            <button
              type="button"
              aria-label={t('settings.textSmaller')}
              onClick={() => update({ textScale: adjustTextScale(preferences.textScale, -1) })}
            >
              A−
            </button>
            <button
              type="button"
              aria-label={t('settings.textReset')}
              onClick={() => update({ textScale: 1 })}
            >
              <output data-testid="settings-text-scale">
                {Math.round(preferences.textScale * 100)}%
              </output>
            </button>
            <button
              type="button"
              aria-label={t('settings.textLarger')}
              onClick={() => update({ textScale: adjustTextScale(preferences.textScale, 1) })}
            >
              A+
            </button>
          </div>
          <p className="settings-hint">{t('settings.shortcuts')}</p>
        </section>
        <button ref={closeRef} type="button" onClick={onClose}>
          {t('settings.close')}
        </button>
      </section>
    </div>
  );
}

interface ReaderSettingsProps {
  preferences: ReaderPreferences;
  onChange(preferences: ReaderPreferences): void;
}

export function ReaderSettings({ preferences, onChange }: ReaderSettingsProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const t = (key: Parameters<typeof translate>[1]) => translate(preferences.locale, key);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  return (
    <>
      <button ref={buttonRef} type="button" onClick={() => setOpen(true)}>
        {t('settings.button')}
      </button>
      {open && <SettingsDialog preferences={preferences} onChange={onChange} onClose={close} />}
    </>
  );
}
