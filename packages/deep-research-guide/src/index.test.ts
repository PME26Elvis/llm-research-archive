import { describe, expect, it } from 'vitest';
import {
  DeepResearchGuideSchema,
  GUIDE_RESEARCH_CUTOFF,
  GUIDE_VERSION,
  getDeepResearchGuide,
  getGuideDigest,
  isGuideSectionId,
  digestValue,
  stableStringify,
} from './index';

describe('Deep Research Guide canonical content', () => {
  it('validates both locales and stable structural counts', () => {
    for (const locale of ['zh-TW', 'en'] as const) {
      const guide = DeepResearchGuideSchema.parse(getDeepResearchGuide(locale));
      expect(guide.guideVersion).toBe(GUIDE_VERSION);
      expect(guide.researchCutoff).toBe(GUIDE_RESEARCH_CUTOFF);
      expect(guide.sections).toHaveLength(9);
      expect(guide.providers).toHaveLength(5);
      expect(guide.timeline).toHaveLength(15);
      expect(guide.sources).toHaveLength(15);
      expect(guide.verificationChecklist).toHaveLength(10);
    }
  });

  it('resolves every source reference and keeps all external URLs HTTPS-only', () => {
    const guide = getDeepResearchGuide('zh-TW');
    const ids = new Set(guide.sources.map((source) => source.id));
    for (const event of guide.timeline) {
      for (const sourceId of event.sourceIds) expect(ids.has(sourceId)).toBe(true);
    }
    for (const provider of guide.providers) {
      for (const sourceId of provider.sourceIds) expect(ids.has(sourceId)).toBe(true);
    }
    expect(guide.sources.every((source) => source.url.startsWith('https://'))).toBe(true);
  });

  it('preserves the DeepSeek naming asymmetry and avoids provider ranking', () => {
    const guide = getDeepResearchGuide('zh-TW');
    expect(guide.negativeFinding.finding).toContain('沒有官方資料');
    expect(
      guide.overview.namingRows.find((row) => row.providerId === 'deepseek')?.exactBrand,
    ).toContain('未找到');
    expect(guide.comparison.map((row) => row.label)).not.toContain('總分');
    expect(guide.providers.every((provider) => !('score' in provider))).toBe(true);
  });

  it('serializes canonical values independently of object insertion order', () => {
    expect(stableStringify(null)).toBe('null');
    expect(stableStringify(['a', 2, false])).toBe('["a",2,false]');
    expect(stableStringify({ beta: 2, alpha: { z: 1, a: 0 } })).toBe(
      '{"alpha":{"a":0,"z":1},"beta":2}',
    );
    expect(digestValue({ alpha: 1, beta: 2 })).toBe(digestValue({ beta: 2, alpha: 1 }));
    expect(digestValue({ alpha: 1 })).not.toBe(digestValue({ alpha: 2 }));
  });

  it('produces deterministic locale-specific digests and finite section IDs', () => {
    expect(getGuideDigest('zh-TW')).toMatch(/^drg1-[a-f0-9]{8}$/);
    expect(getGuideDigest('en')).toMatch(/^drg1-[a-f0-9]{8}$/);
    expect(getGuideDigest('zh-TW')).not.toBe(getGuideDigest('en'));
    expect(isGuideSectionId('guide.timeline')).toBe(true);
    expect(isGuideSectionId('../../timeline')).toBe(false);
  });
});
