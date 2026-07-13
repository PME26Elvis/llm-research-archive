import { describe, expect, it } from 'vitest';
import { nativeLocaleText } from './native-locale';

describe('native locale text', () => {
  it('provides complete Traditional Chinese and English native surfaces', () => {
    const zh = nativeLocaleText('zh-TW');
    const en = nativeLocaleText('en');
    expect(Object.keys(en)).toEqual(Object.keys(zh));
    expect(zh.navigation).toBe('導覽');
    expect(en.navigation).toBe('Navigate');
    expect(en.chooseMarkdown).toContain('Markdown');
  });
});
