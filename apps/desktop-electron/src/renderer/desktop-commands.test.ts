import { describe, expect, it } from 'vitest';
import { filterDesktopCommands, getDesktopCommands } from './desktop-commands';

describe('desktop command catalog', () => {
  it('returns a deterministic localized catalog for an empty query', () => {
    expect(filterDesktopCommands('', 'zh-TW')).toEqual(getDesktopCommands('zh-TW'));
    expect(getDesktopCommands('en').find((command) => command.id === 'search.focus')?.label).toBe(
      'Focus search',
    );
  });

  it('matches Traditional Chinese labels and English aliases in either locale', () => {
    expect(filterDesktopCommands('搜尋', 'zh-TW').map((command) => command.id)).toEqual([
      'search.focus',
    ]);
    expect(filterDesktopCommands('previous', 'en').map((command) => command.id)).toEqual([
      'navigation.back',
    ]);
    expect(filterDesktopCommands('version', 'en').map((command) => command.id)).toEqual([
      'about.open',
    ]);
    expect(filterDesktopCommands('匯入', 'en').map((command) => command.id)).toEqual([
      'import.open',
    ]);
    expect(filterDesktopCommands('字數', 'en').map((command) => command.id)).toEqual([
      'observatory.open',
    ]);
    expect(filterDesktopCommands('deep research', 'en').map((command) => command.id)).toEqual([
      'guide.open',
    ]);
    expect(filterDesktopCommands('保存', 'zh-TW').map((command) => command.id)).toEqual([
      'guide.archive',
    ]);
  });

  it('returns no arbitrary action for an unknown query', () => {
    expect(filterDesktopCommands('delete everything', 'en')).toEqual([]);
  });
});
