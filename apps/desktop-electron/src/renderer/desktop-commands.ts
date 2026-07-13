import type { AppLocale, DesktopCommand } from '@research-observatory/platform-contracts';
import { translate } from './i18n';

export interface DesktopCommandDescriptor {
  id: DesktopCommand;
  label: string;
  keywords: string[];
  shortcut?: string;
}

export function desktopCommands(locale: AppLocale): DesktopCommandDescriptor[] {
  return [
    {
      id: 'search.focus',
      label: translate(locale, 'command.search'),
      keywords: ['search', 'find', '搜尋', '查找'],
      shortcut: 'Ctrl+F',
    },
    {
      id: 'navigation.back',
      label: translate(locale, 'command.back'),
      keywords: ['back', 'previous', '返回', '上一頁'],
      shortcut: 'Alt+←',
    },
    {
      id: 'navigation.forward',
      label: translate(locale, 'command.forward'),
      keywords: ['forward', 'next', '前進', '下一頁'],
      shortcut: 'Alt+→',
    },
    {
      id: 'workspace.open',
      label: translate(locale, 'command.workspace'),
      keywords: ['workspace', 'folder', 'archive', '工作區', '資料夾', '封存'],
      shortcut: 'Ctrl+O',
    },
    {
      id: 'import.open',
      label: translate(locale, 'command.import'),
      keywords: ['import', 'markdown', 'publish', '匯入', '文章', '發布'],
      shortcut: 'Ctrl+Shift+I',
    },
    {
      id: 'observatory.open',
      label: translate(locale, 'command.observatory'),
      keywords: ['observatory', 'statistics', 'summary', '字數', '統計', '摘要', '修訂'],
      shortcut: 'Ctrl+Shift+O',
    },
    {
      id: 'about.open',
      label: translate(locale, 'command.about'),
      keywords: ['about', 'version', 'build', '關於', '版本'],
    },
  ];
}

export const DESKTOP_COMMANDS = desktopCommands('zh-TW');

export function filterDesktopCommands(
  query: string,
  locale: AppLocale = 'zh-TW',
): DesktopCommandDescriptor[] {
  const commands = desktopCommands(locale);
  const normalized = query.trim().toLocaleLowerCase(locale === 'en' ? 'en-US' : 'zh-TW');
  if (!normalized) return commands;
  return commands.filter((command) =>
    [command.label, command.id, ...command.keywords]
      .join(' ')
      .toLocaleLowerCase(locale === 'en' ? 'en-US' : 'zh-TW')
      .includes(normalized),
  );
}
