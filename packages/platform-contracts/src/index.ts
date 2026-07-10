import { z } from 'zod';
export const SearchRequestSchema = z.object({ query: z.string().max(200) });
export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export const ArticleRequestSchema = z.object({ id: z.string().min(1).max(300) });
export type ArticleRequest = z.infer<typeof ArticleRequestSchema>;
export const ExternalUrlSchema = z
  .string()
  .url()
  .refine((v) => ['https:', 'http:', 'mailto:'].includes(new URL(v).protocol));
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
