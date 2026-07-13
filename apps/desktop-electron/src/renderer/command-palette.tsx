import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { DesktopCommand } from '@research-observatory/platform-contracts';
import { filterDesktopCommands } from './desktop-commands';
import { usePreferences } from './preferences-context';

interface CommandPaletteProps {
  open: boolean;
  onClose(): void;
  onExecute(command: DesktopCommand): void;
}

export function CommandPalette({ open, onClose, onExecute }: CommandPaletteProps) {
  const { locale, t } = usePreferences();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const results = useMemo(() => filterDesktopCommands(query, locale), [locale, query]);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setQuery('');
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      requestAnimationFrame(() => returnFocusRef.current?.focus());
    };
  }, [open]);

  useEffect(() => {
    if (activeIndex >= results.length) setActiveIndex(Math.max(0, results.length - 1));
  }, [activeIndex, results.length]);

  if (!open) return null;

  function execute(command: DesktopCommand) {
    onExecute(command);
    onClose();
    if (command !== 'search.focus') return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const search = document.querySelector<HTMLInputElement>('input[data-search-input]');
        search?.focus();
        search?.select();
      });
    });
  }

  return (
    <div className="modal-backdrop command-palette-backdrop" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="modal command-palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
          } else if (event.key === 'Tab' && dialogRef.current) {
            const focusable: HTMLElement[] = Array.from(
              dialogRef.current.querySelectorAll<HTMLElement>(
                'button, input, [href], [tabindex]:not([tabindex="-1"])',
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
          } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(results.length - 1, index + 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(0, index - 1));
          } else if (event.key === 'Enter' && results[activeIndex]) {
            event.preventDefault();
            execute(results[activeIndex].id);
          }
        }}
      >
        <h2 id="command-palette-title">{t('palette.title')}</h2>
        <input
          ref={inputRef}
          type="search"
          aria-label={t('palette.searchLabel')}
          placeholder={t('palette.placeholder')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
        />
        <div className="command-results" role="listbox" aria-label={t('palette.available')}>
          {results.map((command, index) => (
            <button
              key={command.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => execute(command.id)}
            >
              <span>{command.label}</span>
              {command.shortcut && <kbd>{command.shortcut}</kbd>}
            </button>
          ))}
          {!results.length && <p>{t('palette.empty')}</p>}
        </div>
      </section>
    </div>
  );
}
