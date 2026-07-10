import { describe, expect, it } from 'vitest';
import { baseHeadingSlug, HeadingSlugger } from './index';

describe('heading slugger', () => {
  it('supports Chinese, English, mixed text, punctuation, and normalization', () => {
    expect(baseHeadingSlug('模型')).toBe('模型');
    expect(baseHeadingSlug('Deep Heading')).toBe('deep-heading');
    expect(baseHeadingSlug('模型 Deep Heading ２')).toBe('模型-deep-heading-2');
    expect(baseHeadingSlug('Hello, world!')).toBe('hello-world');
    expect(baseHeadingSlug('ＡＩ　模型')).toBe('ai-模型');
  });

  it('deduplicates repeated Chinese and English headings deterministically', () => {
    const slugger = new HeadingSlugger();
    expect(slugger.slug('模型')).toBe('模型');
    expect(slugger.slug('模型')).toBe('模型-1');
    expect(slugger.slug('模型')).toBe('模型-2');
    expect(slugger.slug('Deep Heading')).toBe('deep-heading');
    expect(slugger.slug('Deep Heading')).toBe('deep-heading-1');
  });
});
