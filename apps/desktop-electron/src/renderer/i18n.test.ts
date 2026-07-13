import { describe, expect, it } from 'vitest';
import { applyDocumentLocale, translate } from './i18n';

describe('desktop interface localization', () => {
  it('provides Traditional Chinese and English messages with interpolation', () => {
    expect(translate('zh-TW', 'browse.showingStatus', { count: 3 })).toBe('目前顯示 3 篇文章');
    expect(translate('en', 'browse.showingStatus', { count: 3 })).toBe('Showing 3 articles');
    expect(translate('en', 'import.source', { name: 'article.md' })).toBe('Source: article.md');
  });

  it('updates document language metadata immediately', () => {
    const root = { lang: '', dir: '', dataset: {} as Record<string, string> };
    const fakeDocument = { documentElement: root } as unknown as Document;
    applyDocumentLocale(fakeDocument, 'en');
    expect(root.lang).toBe('en');
    expect(root.dataset.locale).toBe('en');
    applyDocumentLocale(fakeDocument, 'zh-TW');
    expect(root.lang).toBe('zh-Hant-TW');
  });
});
