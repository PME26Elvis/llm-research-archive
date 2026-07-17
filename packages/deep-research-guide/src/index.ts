import { DeepResearchGuideSchema, type GuideLocale, type GuideSectionId } from './model';
import { digestValue } from './digest';
import { getGuideContent, GUIDE_RESEARCH_CUTOFF, GUIDE_VERSION, providerOrder } from './content';

const parsedGuides = {
  'zh-TW': DeepResearchGuideSchema.parse(getGuideContent('zh-TW')),
  en: DeepResearchGuideSchema.parse(getGuideContent('en')),
};

export const guideDigests = {
  'zh-TW': digestValue(parsedGuides['zh-TW']),
  en: digestValue(parsedGuides.en),
} as const;

export function getDeepResearchGuide(locale: GuideLocale) {
  return parsedGuides[locale];
}

export function isGuideSectionId(value: unknown): value is GuideSectionId {
  return (
    typeof value === 'string' && parsedGuides.en.sections.some((section) => section.id === value)
  );
}

export function getGuideDigest(locale: GuideLocale): string {
  return guideDigests[locale];
}

export { GUIDE_RESEARCH_CUTOFF, GUIDE_VERSION, providerOrder };
export * from './model';
export { digestValue, stableStringify } from './digest';
