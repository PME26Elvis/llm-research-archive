import type { DesktopCommand } from '@research-observatory/platform-contracts';
import { translate, type TranslationKey, type UiLocale } from './i18n';

export interface DesktopCommandDescriptor {
  id: DesktopCommand;
  label: string;
  keywords: string[];
  shortcut?: string;
}

interface DesktopCommandDefinition {
  id: DesktopCommand;
  labelKey: TranslationKey;
  keywords: string[];
  shortcut?: string;
}

const COMMAND_DEFINITIONS: DesktopCommandDefinition[] = [
  {
    id: 'search.focus',
    labelKey: 'command.search',
    keywords: ['search', 'find', '搜尋', '查找'],
    shortcut: 'Ctrl+F',
  },
  {
    id: 'navigation.back',
    labelKey: 'command.back',
    keywords: ['back', 'previous', '返回', '上一頁'],
    shortcut: 'Alt+←',
  },
  {
    id: 'navigation.forward',
    labelKey: 'command.forward',
    keywords: ['forward', 'next', '前進', '下一頁'],
    shortcut: 'Alt+→',
  },
  {
    id: 'workspace.open',
    labelKey: 'command.workspace',
    keywords: ['workspace', 'folder', 'archive', '工作區', '資料夾', '封存'],
    shortcut: 'Ctrl+O',
  },
  {
    id: 'import.open',
    labelKey: 'command.import',
    keywords: ['import', 'markdown', 'publish', '匯入', '文章', '發布'],
    shortcut: 'Ctrl+Shift+I',
  },
  {
    id: 'observatory.open',
    labelKey: 'command.observatory',
    keywords: ['observatory', 'statistics', 'summary', '字數', '統計', '摘要', '修訂'],
    shortcut: 'Ctrl+Shift+O',
  },
  {
    id: 'about.open',
    labelKey: 'command.about',
    keywords: ['about', 'version', 'build', '關於', '版本'],
  },
];

export function getDesktopCommands(locale: UiLocale): DesktopCommandDescriptor[] {
  return COMMAND_DEFINITIONS.map((command) => ({
    id: command.id,
    label: translate(locale, command.labelKey),
    keywords: command.keywords,
    ...(command.shortcut ? { shortcut: command.shortcut } : {}),
  }));
}

export function filterDesktopCommands(
  query: string,
  locale: UiLocale = 'zh-TW',
): DesktopCommandDescriptor[] {
  const commands = getDesktopCommands(locale);
  const normalized = query.trim().toLocaleLowerCase(locale);
  if (!normalized) return commands;
  return commands.filter((command) =>
    [command.label, command.id, ...command.keywords]
      .join(' ')
      .toLocaleLowerCase(locale)
      .includes(normalized),
  );
}
