import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { DesktopCommand } from '@research-observatory/platform-contracts';
import { filterDesktopCommands } from './desktop-commands';

interface CommandPaletteProps {
  open: boolean;
  onClose(): void;
  onExecute(command: DesktopCommand): void;
}

export function CommandPalette({ open, onClose, onExecute }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => filterDesktopCommands(query), [query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (activeIndex >= results.length) setActiveIndex(Math.max(0, results.length - 1));
  }, [activeIndex, results.length]);

  if (!open) return null;

  function execute(command: DesktopCommand) {
    onClose();
    requestAnimationFrame(() => onExecute(command));
  }

  return (
    <div className="modal-backdrop command-palette-backdrop" onMouseDown={onClose}>
      <section
        className="modal command-palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
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
        <h2 id="command-palette-title">指令面板</h2>
        <input
          ref={inputRef}
          type="search"
          aria-label="搜尋指令"
          placeholder="輸入指令名稱…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
        />
        <div className="command-results" role="listbox" aria-label="可用指令">
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
          {!results.length && <p>沒有符合的指令</p>}
        </div>
      </section>
    </div>
  );
}
