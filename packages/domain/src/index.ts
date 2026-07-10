export type ArticleId = string & { readonly __brand: 'ArticleId' };
export type CategoryId = string & { readonly __brand: 'CategoryId' };
export interface ReadingStats {
  displayCount: number;
  cjkCharacters: number;
  latinNumberTokens: number;
  estimatedMinutes: number;
}
export interface ArticleLink {
  href: string;
  label: string;
  internal: boolean;
}
export interface ArticleHeading {
  depth: number;
  text: string;
  slug: string;
}
export interface Article {
  id: ArticleId;
  slug: string;
  title: string;
  date: string;
  updatedAt?: string;
  category: CategoryId;
  tags: readonly string[];
  sourcePath: string;
  assetRoot: string;
  markdown: string;
  excerpt: string;
  readingStats: ReadingStats;
  links: readonly ArticleLink[];
  headings: readonly ArticleHeading[];
}
export interface ArticleManifestEntry {
  id: ArticleId;
  slug: string;
  title: string;
  date: string;
  category: CategoryId;
  tags: readonly string[];
  excerpt: string;
  readingStats: ReadingStats;
  sourcePath: string;
}
export interface ArchiveManifestV1 {
  schemaVersion: 1;
  generatedAt: string;
  contentHash: string;
  generatedBy: string;
  articles: ArticleManifestEntry[];
  categories: { id: CategoryId; title: string; count: number }[];
  tags: { tag: string; count: number }[];
}
export const asArticleId = (value: string) => value as ArticleId;
export const asCategoryId = (value: string) => value as CategoryId;
