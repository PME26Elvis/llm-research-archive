import type { AppLocale } from '@research-observatory/platform-contracts';

export interface NativeLocaleText {
  navigation: string;
  previousLocation: string;
  nextLocation: string;
  focusSearch: string;
  openWorkspace: string;
  importArticle: string;
  view: string;
  commandPalette: string;
  observatorySummary: string;
  help: string;
  about: string;
  bundledArchive: string;
  recoveredWorkspace: string;
  selectWorkspace: string;
  workspaceRejected: string;
  chooseMarkdown: string;
  chooseArticleFolder: string;
}

const catalogs: Record<AppLocale, NativeLocaleText> = {
  'zh-TW': {
    navigation: '導覽',
    previousLocation: '上一個閱讀位置',
    nextLocation: '下一個閱讀位置',
    focusSearch: '聚焦搜尋',
    openWorkspace: '開啟本機工作區',
    importArticle: '匯入文章…',
    view: '檢視',
    commandPalette: '指令面板',
    observatorySummary: 'Observatory 摘要',
    help: '說明',
    about: '關於 Research Observatory',
    bundledArchive: '內建封存',
    recoveredWorkspace: '先前工作區無法使用，已回復內建封存',
    selectWorkspace: '選擇 Research Observatory 工作區',
    workspaceRejected: '無法開啟工作區；請確認資料夾包含可讀取的 Markdown 文章且未使用符號連結。',
    chooseMarkdown: '選擇要匯入的 Markdown 檔案',
    chooseArticleFolder: '選擇要匯入的文章資料夾',
  },
  en: {
    navigation: 'Navigate',
    previousLocation: 'Previous reading location',
    nextLocation: 'Next reading location',
    focusSearch: 'Focus search',
    openWorkspace: 'Open local workspace',
    importArticle: 'Import article…',
    view: 'View',
    commandPalette: 'Command Palette',
    observatorySummary: 'Observatory summary',
    help: 'Help',
    about: 'About Research Observatory',
    bundledArchive: 'Bundled archive',
    recoveredWorkspace: 'The previous workspace is unavailable. The bundled archive was restored.',
    selectWorkspace: 'Choose a Research Observatory workspace',
    workspaceRejected:
      'The workspace could not be opened. Confirm that the folder contains readable Markdown articles and does not use symbolic links.',
    chooseMarkdown: 'Choose a Markdown file to import',
    chooseArticleFolder: 'Choose an article folder to import',
  },
};

export function nativeLocaleText(locale: AppLocale): NativeLocaleText {
  return catalogs[locale];
}
