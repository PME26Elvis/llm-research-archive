import { describe, expect, it } from 'vitest';
import { resolveLocale, translate } from './i18n';

describe('renderer internationalization', () => {
  it('resolves system language deterministically', () => {
    expect(resolveLocale('system', ['zh-Hant-TW', 'en-US'])).toBe('zh-TW');
    expect(resolveLocale('system', ['en-US'])).toBe('en');
    expect(resolveLocale('en', ['zh-TW'])).toBe('en');
  });

  it('renders both locale catalogs and interpolates variables', () => {
    expect(translate('zh-TW', 'search.shownStatus', { count: 3 })).toBe('目前顯示 3 篇文章');
    expect(translate('en', 'search.shownStatus', { count: 3 })).toBe('Showing 3 articles');
    expect(translate('en', 'lightbox.title', { alt: 'Diagram' })).toBe('Image preview: Diagram');
  });

  it('keeps article-content translation outside the UI localization contract', () => {
    expect(translate('en', 'settings.language.hint')).toContain(
      'Article content is not translated',
    );
  });
});
