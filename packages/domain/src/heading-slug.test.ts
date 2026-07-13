import { describe, expect, it } from 'vitest';
import {
  asArticleId,
  asCategoryId,
  baseHeadingSlug,
  cleanHeadingText,
  HeadingSlugger,
  slugHeadings,
} from './index';

describe('domain identifiers and heading utilities', () => {
  it('brands article and category identifiers without changing their runtime values', () => {
    expect(asArticleId('llm/compute')).toBe('llm/compute');
    expect(asCategoryId('llm')).toBe('llm');
  });

  it('cleans Markdown images, links, formatting, HTML, and repeated whitespace', () => {
    expect(
      cleanHeadingText(
        '  ## **Model** [report](https://example.com) ![plot](plot.png) <span>v2</span>  ',
      ),
    ).toBe('Model report v2');
  });

  it('supports Chinese, English, mixed text, punctuation, normalization, and fallback slugs', () => {
    expect(baseHeadingSlug('模型')).toBe('模型');
    expect(baseHeadingSlug('Deep Heading')).toBe('deep-heading');
    expect(baseHeadingSlug('模型 Deep Heading ２')).toBe('模型-deep-heading-2');
    expect(baseHeadingSlug('Hello, world!')).toBe('hello-world');
    expect(baseHeadingSlug('ＡＩ　模型')).toBe('ai-模型');
    expect(baseHeadingSlug('***')).toBe('section');
  });

  it('deduplicates repeated headings deterministically', () => {
    const slugger = new HeadingSlugger();
    expect(slugger.slug('模型')).toBe('模型');
    expect(slugger.slug('模型')).toBe('模型-1');
    expect(slugger.slug('模型')).toBe('模型-2');
    expect(slugger.slug('Deep Heading')).toBe('deep-heading');
    expect(slugger.slug('Deep Heading')).toBe('deep-heading-1');
  });

  it('adds slugs while retaining the original heading fields and order', () => {
    expect(
      slugHeadings([
        { text: 'Overview', depth: 2 },
        { text: 'Overview', depth: 3 },
        { text: '模型', depth: 2 },
      ]),
    ).toEqual([
      { text: 'Overview', depth: 2, slug: 'overview' },
      { text: 'Overview', depth: 3, slug: 'overview-1' },
      { text: '模型', depth: 2, slug: '模型' },
    ]);
  });
});
