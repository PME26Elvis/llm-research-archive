import { describe, expect, it } from 'vitest';
import { mainTranslate } from './main-i18n';

describe('main-process localization', () => {
  it('localizes native menu and dialog labels without renderer imports', () => {
    expect(mainTranslate('zh-TW', 'navigation')).toBe('導覽');
    expect(mainTranslate('en', 'navigation')).toBe('Navigation');
    expect(mainTranslate('en', 'workspaceDialog')).toContain('workspace');
  });
});
