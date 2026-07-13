import type { UiLocale } from '@research-observatory/platform-contracts';

const messages = {
  'zh-TW': {
    navigation: '導覽',
    back: '上一個閱讀位置',
    forward: '下一個閱讀位置',
    search: '聚焦搜尋',
    workspace: '開啟本機工作區',
    import: '匯入文章…',
    view: '檢視',
    palette: '指令面板',
    observatory: 'Observatory 摘要',
    help: '說明',
    about: '關於 Research Observatory',
    workspaceDialog: '選擇 Research Observatory 工作區',
    workspaceRejected:
      '無法開啟工作區；請確認資料夾包含可讀取的 Markdown 文章且未使用符號連結。',
    markdownDialog: '選擇要匯入的 Markdown 檔案',
    folderDialog: '選擇要匯入的文章資料夾',
    markdownFilter: 'Markdown',
  },
  en: {
    navigation: 'Navigation',
    back: 'Previous reading location',
    forward: 'Next reading location',
    search: 'Focus search',
    workspace: 'Open local workspace',
    import: 'Import article…',
    view: 'View',
    palette: 'Command palette',
    observatory: 'Observatory summary',
    help: 'Help',
    about: 'About Research Observatory',
    workspaceDialog: 'Choose a Research Observatory workspace',
    workspaceRejected:
      'The workspace could not be opened. Make sure it contains readable Markdown articles and does not use symbolic links.',
    markdownDialog: 'Choose a Markdown file to import',
    folderDialog: 'Choose an article folder to import',
    markdownFilter: 'Markdown',
  },
} as const;

export type MainTranslationKey = keyof (typeof messages)['zh-TW'];

export function mainTranslate(locale: UiLocale, key: MainTranslationKey): string {
  return messages[locale][key];
}
