import { describe, expect, it } from 'vitest';
import { DesktopCommandSchema } from './index';

describe('DesktopCommandSchema', () => {
  it('accepts the finite application command allowlist', () => {
    expect(DesktopCommandSchema.parse('palette.open')).toBe('palette.open');
    expect(DesktopCommandSchema.parse('search.focus')).toBe('search.focus');
    expect(DesktopCommandSchema.parse('navigation.back')).toBe('navigation.back');
    expect(DesktopCommandSchema.parse('navigation.forward')).toBe('navigation.forward');
    expect(DesktopCommandSchema.parse('import.open')).toBe('import.open');
    expect(DesktopCommandSchema.parse('about.open')).toBe('about.open');
    expect(DesktopCommandSchema.parse('observatory.open')).toBe('observatory.open');
  });

  it('rejects arbitrary command strings', () => {
    expect(DesktopCommandSchema.safeParse('shell.exec').success).toBe(false);
    expect(DesktopCommandSchema.safeParse('../../delete').success).toBe(false);
  });
});
