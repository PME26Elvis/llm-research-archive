import { z } from 'zod';

export const GuideLocaleSchema = z.enum(['zh-TW', 'en']);
export const GuideSectionIdSchema = z.enum([
  'guide.overview',
  'guide.workflow',
  'guide.distinctions',
  'guide.timeline',
  'guide.providers',
  'guide.comparison',
  'guide.archive',
  'guide.verify',
  'guide.sources',
]);
export const ProviderIdSchema = z.enum(['google', 'openai', 'xai', 'anthropic', 'deepseek']);
export const SourceRecordSchema = z.object({
  id: z.string().min(1),
  provider: z.string().min(1),
  title: z.string().min(1),
  url: z
    .string()
    .url()
    .refine((value) => new URL(value).protocol === 'https:'),
  publicationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  accessedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  authority: z.enum([
    'official-product-announcement',
    'official-product-guidance',
    'official-help-documentation',
    'official-model-announcement',
    'official-change-log',
  ]),
  claimScope: z.array(z.string().min(1)).min(1),
  editorialNote: z.string().optional(),
});
export const TimelineEventSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  providerId: ProviderIdSchema,
  title: z.string().min(1),
  modelContext: z.string().min(1),
  summary: z.string().min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
  attribution: z.enum(['verified-fact', 'vendor-claim', 'repository-synthesis']),
});
export const ProviderProfileSchema = z.object({
  id: ProviderIdSchema,
  provider: z.string().min(1),
  productName: z.string().min(1),
  namingNote: z.string().min(1),
  launchDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  modelContext: z.string().min(1),
  summary: z.string().min(1),
  characteristics: z.array(z.string().min(1)).min(1),
  limitations: z.array(z.string().min(1)).min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
});
export const GuideSectionSchema = z.object({
  id: GuideSectionIdSchema,
  label: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().min(1),
});
export const GuideComparisonRowSchema = z.object({
  label: z.string().min(1),
  values: z.record(ProviderIdSchema, z.string().min(1)),
});
export const DeepResearchGuideSchema = z.object({
  schemaVersion: z.literal(1),
  guideVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  locale: GuideLocaleSchema,
  researchCutoff: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  disclaimer: z.string().min(1),
  ui: z.object({
    open: z.string().min(1),
    close: z.string().min(1),
    source: z.string().min(1),
    openOfficialSource: z.string().min(1),
    researchCutoff: z.string().min(1),
    providerClaim: z.string().min(1),
    verifiedFact: z.string().min(1),
    repositorySynthesis: z.string().min(1),
    sourceCount: z.string().min(1),
    firstLaunchTitle: z.string().min(1),
    firstLaunchBody: z.string().min(1),
    firstLaunchOpen: z.string().min(1),
    firstLaunchDismiss: z.string().min(1),
    aboutArchive: z.string().min(1),
    field: z.string().min(1),
    launch: z.string().min(1),
    modelContext: z.string().min(1),
    characteristics: z.string().min(1),
    limitations: z.string().min(1),
    published: z.string().min(1),
    accessed: z.string().min(1),
    authority: z.string().min(1),
    claimScope: z.string().min(1),
    editorialMethod: z.string().min(1),
    notStated: z.string().min(1),
    whyPreserve: z.string().min(1),
    whatPreserved: z.string().min(1),
    notGuaranteed: z.string().min(1),
  }),
  sections: z.array(GuideSectionSchema).length(9),
  overview: z.object({
    definition: z.string().min(1),
    umbrellaNote: z.string().min(1),
    namingRows: z
      .array(
        z.object({
          providerId: ProviderIdSchema,
          provider: z.string().min(1),
          productName: z.string().min(1),
          exactBrand: z.string().min(1),
        }),
      )
      .length(5),
  }),
  workflow: z.array(z.object({ title: z.string(), detail: z.string() })).length(7),
  distinctions: z.array(z.object({ title: z.string(), detail: z.string() })).length(4),
  timeline: z.array(TimelineEventSchema).min(10),
  providers: z.array(ProviderProfileSchema).length(5),
  comparison: z.array(GuideComparisonRowSchema).min(5),
  archive: z.object({
    rationale: z.array(z.string().min(1)).min(1),
    preserves: z.array(z.string().min(1)).min(1),
    doesNotGuarantee: z.array(z.string().min(1)).min(1),
  }),
  verificationChecklist: z.array(z.string().min(1)).length(10),
  sources: z.array(SourceRecordSchema).min(10),
  editorialRules: z.array(z.string().min(1)).min(5),
  negativeFinding: z.object({
    provider: z.literal('DeepSeek'),
    finding: z.string().min(1),
    handlingRule: z.string().min(1),
  }),
});

export type GuideLocale = z.infer<typeof GuideLocaleSchema>;
export type GuideSectionId = z.infer<typeof GuideSectionIdSchema>;
export type ProviderId = z.infer<typeof ProviderIdSchema>;
export type SourceRecord = z.infer<typeof SourceRecordSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type ProviderProfile = z.infer<typeof ProviderProfileSchema>;
export type DeepResearchGuide = z.infer<typeof DeepResearchGuideSchema>;
