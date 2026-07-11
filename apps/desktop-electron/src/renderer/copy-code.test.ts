import { describe, expect, it, vi } from 'vitest';
import { copyText } from './copy-code';

describe('copyText', () => {
  it('uses the Clipboard API when it succeeds', async () => {
    const writeText = vi.fn(async () => undefined);
    const fallback = vi.fn(() => true);

    await expect(copyText('alpha', { clipboard: { writeText }, fallback })).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('alpha');
    expect(fallback).not.toHaveBeenCalled();
  });

  it('falls back when the Clipboard API rejects packaged renderer access', async () => {
    const writeText = vi.fn(async () => {
      throw new Error('NotAllowedError');
    });
    const fallback = vi.fn(() => true);

    await expect(copyText('beta', { clipboard: { writeText }, fallback })).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('beta');
    expect(fallback).toHaveBeenCalledWith('beta');
  });

  it('returns false when neither copy path succeeds', async () => {
    const fallback = vi.fn(() => false);

    await expect(copyText('gamma', { fallback })).resolves.toBe(false);
    expect(fallback).toHaveBeenCalledWith('gamma');
  });

  it('converts an unexpected fallback exception into a recoverable failure', async () => {
    const fallback = vi.fn(() => {
      throw new Error('copy unavailable');
    });

    await expect(copyText('delta', { fallback })).resolves.toBe(false);
  });
});
