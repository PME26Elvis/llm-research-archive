import { z } from 'zod';

export const ReadingStatsDtoSchema = z.object({
  displayCount: z.number().int().nonnegative(),
  cjkCharacters: z.number().int().nonnegative(),
  latinNumberTokens: z.number().int().nonnegative(),
  estimatedMinutes: z.number().int().nonnegative(),
});
export const ArticleSummaryDtoSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  date: z.string().min(1),
  updatedAt: z.string().min(1).optional(),
  category: z.string().min(1),
  tags: z.array(z.string()),
  excerpt: z.string(),
  sourcePath: z.string().min(1),
  assetRoot: z.string(),
  readingStats: ReadingStatsDtoSchema,
});
export const ArticleDtoSchema = ArticleSummaryDtoSchema.extend({
  markdown: z.string(),
  links: z.array(
    z.object({
      href: z.string(),
      label: z.string(),
      internal: z.boolean(),
      targetArticleId: z.string().optional(),
    }),
  ),
  headings: z.array(z.object({ depth: z.number().int(), text: z.string(), slug: z.string() })),
});

export const AppInfoResponseSchema = z.object({
  productName: z.string().min(1),
  version: z.string().min(1),
  commit: z.string().min(1),
  platform: z.string().min(1),
  packaged: z.boolean(),
  electronVersion: z.string().min(1),
  chromiumVersion: z.string().min(1),
  nodeVersion: z.string().min(1),
  contentArticleCount: z.number().int().nonnegative(),
  contentManifestHash: z.string().optional(),
});
export const SearchResultDtoSchema = ArticleSummaryDtoSchema.extend({
  score: z.number().nonnegative(),
});

export const StartupMilestoneSchema = z.enum([
  'process-start',
  'app-ready',
  'archive-ready',
  'window-created',
  'renderer-ready',
  'interactive',
]);
export const StartupTelemetrySchema = z.object({
  milestones: z.object({
    'process-start': z.number().nonnegative().optional(),
    'app-ready': z.number().nonnegative().optional(),
    'archive-ready': z.number().nonnegative().optional(),
    'window-created': z.number().nonnegative().optional(),
    'renderer-ready': z.number().nonnegative().optional(),
    interactive: z.number().nonnegative().optional(),
  }),
  interactiveMs: z.number().nonnegative().optional(),
  previousMedianMs: z.number().nonnegative().optional(),
  materialRegression: z.boolean(),
});
export const DiagnosticLevelSchema = z.enum(['info', 'warning', 'error']);
export const DiagnosticAreaSchema = z.enum([
  'main',
  'renderer',
  'preferences',
  'search-index',
  'workspace',
  'import',
]);
export const LocalDiagnosticEventSchema = z.object({
  timestamp: z.string().datetime(),
  level: DiagnosticLevelSchema,
  area: DiagnosticAreaSchema,
  code: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  message: z.string().min(1).max(500),
});
export const RendererDiagnosticRequestSchema = z.object({
  area: z.enum(['renderer', 'preferences', 'search-index']),
  code: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  message: z.string().min(1).max(500),
});
export const ArchiveDiagnosticsSchema = z.object({
  validArticles: z.number().int().nonnegative(),
  warnings: z.array(z.string()),
  invalidFiles: z.array(z.string()),
  brokenLinks: z.array(z.string()),
  missingAssets: z.array(z.string()),
  startup: StartupTelemetrySchema,
  events: z.array(LocalDiagnosticEventSchema),
});
export const SearchRequestSchema = z.object({ query: z.string().max(200) });
export const ArticleRequestSchema = z.object({
  id: z.string().min(1).max(300),
});
export const ExternalUrlSchema = z
  .string()
  .url()
  .refine((v) => ['https:', 'mailto:'].includes(new URL(v).protocol));
export const UiLocaleSchema = z.enum(['zh-TW', 'en']);
export const LocaleUpdateRequestSchema = z.object({ locale: UiLocaleSchema });
export const DesktopCommandSchema = z.enum([
  'palette.open',
  'search.focus',
  'navigation.back',
  'navigation.forward',
  'about.open',
  'workspace.open',
  'import.open',
  'observatory.open',
]);
export const WorkspaceInfoSchema = z.object({
  kind: z.enum(['bundled', 'local']),
  rootPath: z.string().min(1),
  displayName: z.string().min(1),
  articleCount: z.number().int().nonnegative(),
  warnings: z.array(z.string()),
  invalidFiles: z.array(z.string()),
});
export const WorkspaceSelectionResultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('cancelled') }),
  z.object({ status: z.literal('selected'), workspace: WorkspaceInfoSchema }),
  z.object({ status: z.literal('rejected'), message: z.string().min(1) }),
]);
export const ImportSourceKindSchema = z.enum(['markdown-file', 'article-folder']);
export const ImportMetadataDtoSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  tags: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export const ImportCleanupSummaryDtoSchema = z.object({
  citationMarkersRemoved: z.number().int().nonnegative(),
  entityWrappersUnwrapped: z.number().int().nonnegative(),
  imagePlaceholdersRemoved: z.number().int().nonnegative(),
  nonPortableImagesRemoved: z.number().int().nonnegative(),
});
export const ImportIssueCodeSchema = z.enum([
  'source-not-found',
  'unsupported-source',
  'source-symlink',
  'source-escape',
  'article-not-found',
  'invalid-frontmatter',
  'invalid-metadata',
  'category-fallback',
  'slug-fallback',
  'ignored-source-entry',
  'asset-symlink',
  'asset-escape',
  'missing-asset-reference',
  'target-symlink',
]);
export const ImportIssueDtoSchema = z.object({
  severity: z.enum(['warning', 'error']),
  code: ImportIssueCodeSchema,
  message: z.string().min(1).max(500),
  path: z.string().min(1).max(300).optional(),
});
export const ImportConflictDtoSchema = z.object({
  code: z.literal('target-exists'),
  message: z.string().min(1).max(500),
  path: z.string().min(1).max(300),
});
export const ImportAssetPreviewDtoSchema = z.object({
  relativePath: z.string().min(1).max(300),
  outputPath: z.string().min(1).max(300),
  sizeBytes: z.number().int().nonnegative(),
});
export const ImportOutputFilePreviewDtoSchema = z.object({
  kind: z.enum(['article', 'asset']),
  relativePath: z.string().min(1).max(300),
  sizeBytes: z.number().int().nonnegative(),
});
export const ImportPlanPreviewDtoSchema = z
  .object({
    planId: z.string().regex(/^[a-f0-9]{64}$/),
    source: z.object({
      kind: ImportSourceKindSchema,
      displayName: z.string().min(1).max(200),
    }),
    targetWorkspaceName: z.string().min(1).max(200),
    targetArticleRelativePath: z.string().min(1).max(300),
    metadata: ImportMetadataDtoSchema,
    cleanup: ImportCleanupSummaryDtoSchema,
    assets: z.array(ImportAssetPreviewDtoSchema).max(5000),
    outputFiles: z.array(ImportOutputFilePreviewDtoSchema).min(1).max(5001),
    warnings: z.array(ImportIssueDtoSchema).max(1000),
    conflicts: z.array(ImportConflictDtoSchema).max(100),
    requiresMetadataConfirmation: z.boolean(),
    canCommit: z.boolean(),
  })
  .strict();
export const ImportSourceSelectionRequestSchema = z.object({
  kind: ImportSourceKindSchema,
});
export const ImportPreviewRefreshRequestSchema = z.object({
  planId: z.string().regex(/^[a-f0-9]{64}$/),
  metadata: ImportMetadataDtoSchema,
});
export const ImportPreviewResultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('cancelled') }),
  z.object({
    status: z.literal('preview'),
    preview: ImportPlanPreviewDtoSchema,
  }),
  z.object({
    status: z.literal('rejected'),
    code: z.enum(['workspace-read-only', 'plan-not-found', 'invalid-source', 'invalid-metadata']),
    message: z.string().min(1).max(1000),
  }),
]);
export const ImportCommitRequestSchema = z.object({
  planId: z.string().regex(/^[a-f0-9]{64}$/),
  removeSource: z.boolean().default(false),
});
export const ImportCommitErrorCodeSchema = z.enum([
  'workspace-read-only',
  'plan-not-found',
  'plan-not-committable',
  'stale-plan',
  'target-conflict',
  'commit-in-progress',
  'stage-failed',
  'validation-failed',
  'commit-failed',
  'rollback-failed',
]);
export const ImportCommitResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('committed'),
    articleId: z.string().min(1).max(300),
    workspace: WorkspaceInfoSchema,
    sourceStatus: z.enum(['retained', 'removed', 'removal-failed']),
    message: z.string().min(1).max(1000).optional(),
  }),
  z.object({
    status: z.literal('rejected'),
    code: ImportCommitErrorCodeSchema,
    message: z.string().min(1).max(1000),
  }),
]);
export const ArticleListResponseSchema = z.array(ArticleSummaryDtoSchema);
export const SearchResponseSchema = z.array(SearchResultDtoSchema);
export type UiLocale = z.infer<typeof UiLocaleSchema>;
export type LocaleUpdateRequest = z.infer<typeof LocaleUpdateRequestSchema>;
export type DesktopCommand = z.infer<typeof DesktopCommandSchema>;

export type StartupMilestone = z.infer<typeof StartupMilestoneSchema>;
export type StartupTelemetryDto = z.infer<typeof StartupTelemetrySchema>;
export type DiagnosticLevel = z.infer<typeof DiagnosticLevelSchema>;
export type DiagnosticArea = z.infer<typeof DiagnosticAreaSchema>;
export type LocalDiagnosticEventDto = z.infer<typeof LocalDiagnosticEventSchema>;
export type RendererDiagnosticRequest = z.infer<typeof RendererDiagnosticRequestSchema>;
export type ArchiveDiagnosticsDto = z.infer<typeof ArchiveDiagnosticsSchema>;
export type WorkspaceInfoDto = z.infer<typeof WorkspaceInfoSchema>;
export type WorkspaceSelectionResult = z.infer<typeof WorkspaceSelectionResultSchema>;
export type ImportSourceKind = z.infer<typeof ImportSourceKindSchema>;
export type ImportMetadataDto = z.infer<typeof ImportMetadataDtoSchema>;
export type ImportIssueDto = z.infer<typeof ImportIssueDtoSchema>;
export type ImportPlanPreviewDto = z.infer<typeof ImportPlanPreviewDtoSchema>;
export type ImportSourceSelectionRequest = z.infer<typeof ImportSourceSelectionRequestSchema>;
export type ImportPreviewRefreshRequest = z.infer<typeof ImportPreviewRefreshRequestSchema>;
export type ImportPreviewResult = z.infer<typeof ImportPreviewResultSchema>;
export type ImportCommitRequest = z.infer<typeof ImportCommitRequestSchema>;
export type ImportCommitResult = z.infer<typeof ImportCommitResultSchema>;
export type ArticleSummaryDto = z.infer<typeof ArticleSummaryDtoSchema>;
export type ArticleDto = z.infer<typeof ArticleDtoSchema>;
export type SearchResultDto = z.infer<typeof SearchResultDtoSchema>;
export type AppInfoDto = z.infer<typeof AppInfoResponseSchema>;
export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type ArticleRequest = z.infer<typeof ArticleRequestSchema>;
export interface ArchiveRepositoryPort {
  listArticles(): Promise<unknown[]>;
  getArticle(id: string): Promise<unknown>;
}
export interface WorkspacePort {
  selectWorkspace(): Promise<string | undefined>;
}
export interface SearchIndexPort {
  search(query: string): Promise<unknown[]>;
}
export interface PreferencesPort {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}
export interface ExternalLinkPort {
  openExternal(url: string): Promise<void>;
}
export interface FileDialogPort {
  chooseFile(): Promise<string | undefined>;
}
export interface LoggingPort {
  info(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}
export interface ApplicationInfoPort {
  getInfo(): Promise<{ version: string; commit: string; platform: string }>;
}
