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
export const SearchRequestSchema = z.object({ query: z.string().max(200) });
export const ArticleRequestSchema = z.object({ id: z.string().min(1).max(300) });
export const ExternalUrlSchema = z
  .string()
  .url()
  .refine((v) => ['https:', 'mailto:'].includes(new URL(v).protocol));
export const DesktopCommandSchema = z.enum([
  'palette.open',
  'search.focus',
  'navigation.back',
  'navigation.forward',
  'about.open',
]);
export const ArticleListResponseSchema = z.array(ArticleSummaryDtoSchema);
export const SearchResponseSchema = z.array(SearchResultDtoSchema);
export type DesktopCommand = z.infer<typeof DesktopCommandSchema>;
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
