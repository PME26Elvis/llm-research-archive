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
  targetArticleId?: ArticleId;
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
  updatedAt?: string;
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

export function cleanHeadingText(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~>#|]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function baseHeadingSlug(text: string): string {
  const normalized = cleanHeadingText(text)
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\p{Separator}\s]+/gu, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '');
  return normalized || 'section';
}

export class HeadingSlugger {
  private readonly counts = new Map<string, number>();

  slug(text: string): string {
    const base = baseHeadingSlug(text);
    const count = this.counts.get(base) || 0;
    this.counts.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  }
}

export function slugHeadings<T extends { text: string }>(
  headings: readonly T[],
): (T & { slug: string })[] {
  const slugger = new HeadingSlugger();
  return headings.map((heading) => ({ ...heading, slug: slugger.slug(heading.text) }));
}
