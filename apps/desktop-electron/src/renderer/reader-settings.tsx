import React, { useEffect, useRef, useState } from 'react';
import type { LanguagePreference } from './i18n';
import { usePreferences } from './preferences-context';
import type { ThemePreference } from './preferences';

interface SettingsDialogProps {
  onClose(): void;
}

function SettingsDialog({ onClose }: SettingsDialogProps) {
  const { preferences, t, setTheme, setLanguage, setTextScale, adjustTextScale } = usePreferences();
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
      ).filter((element) => !element.hasAttribute('disabled'));
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

  const themes: readonly [ThemePreference, string][] = [
    ['system', t('settings.theme.system')],
    ['light', t('settings.theme.light')],
    ['dark', t('settings.theme.dark')],
  ];
  const languages: readonly [LanguagePreference, string][] = [
    ['system', t('settings.language.system')],
    ['zh-TW', t('settings.language.zhTW')],
    ['en', t('settings.language.en')],
  ];

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
          {themes.map(([value, label]) => (
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
        <fieldset className="settings-language">
          <legend>{t('settings.language')}</legend>
          {languages.map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="language"
                value={value}
                checked={preferences.language === value}
                onChange={() => setLanguage(value)}
              />
              {label}
            </label>
          ))}
          <p className="settings-hint">{t('settings.language.hint')}</p>
        </fieldset>
        <section className="settings-text" aria-labelledby="text-size-title">
          <h3 id="text-size-title">{t('settings.textSize')}</h3>
          <div className="text-scale-controls">
            <button
              type="button"
              aria-label={t('settings.textSmaller')}
              onClick={() => adjustTextScale(-1)}
            >
              A−
            </button>
            <button
              type="button"
              aria-label={t('settings.textReset')}
              onClick={() => setTextScale(1)}
            >
              <output data-testid="settings-text-scale">
                {Math.round(preferences.textScale * 100)}%
              </output>
            </button>
            <button
              type="button"
              aria-label={t('settings.textLarger')}
              onClick={() => adjustTextScale(1)}
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

export function ReaderSettings() {
  const { t } = usePreferences();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  return (
    <>
      <button ref={buttonRef} type="button" onClick={() => setOpen(true)}>
        {t('settings.button')}
      </button>
      {open && <SettingsDialog onClose={close} />}
    </>
  );
}
