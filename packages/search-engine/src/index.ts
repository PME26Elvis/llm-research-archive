import type { Article } from '@research-observatory/domain';
import {
  ArticleSummaryDtoSchema,
  type ArticleSummaryDto,
  type SearchResultDto,
} from '@research-observatory/platform-contracts';

export type SearchFilterMode = 'all' | 'category' | 'tag' | 'timeline';

export interface SearchFilter {
  mode: SearchFilterMode;
  facet: string;
}

interface IndexedDocument {
  summary: ArticleSummaryDto;
  searchText: string;
  ordinal: number;
}

interface SerializedSearchIndexV1 {
  schemaVersion: 1;
  documents: IndexedDocument[];
}

function normalizedSearchText(article: Pick<Article, 'title' | 'tags' | 'markdown'>): string {
  return `${article.title} ${article.tags.join(' ')} ${article.markdown}`
    .normalize('NFKC')
    .toLocaleLowerCase();
}

function articleMonthKey(date: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(date);
  return match ? `${match[1]}-${match[2]}` : 'unknown';
}

function matchesFilter(summary: ArticleSummaryDto, filter?: SearchFilter): boolean {
  if (!filter || filter.mode === 'all' || !filter.facet) return true;
  if (filter.mode === 'category') return summary.category === filter.facet;
  if (filter.mode === 'tag') return summary.tags.includes(filter.facet);
  return articleMonthKey(summary.date) === filter.facet;
}

function countOccurrences(text: string, query: string): number {
  let count = 0;
  let offset = 0;
  while (offset <= text.length - query.length) {
    const found = text.indexOf(query, offset);
    if (found < 0) break;
    count += 1;
    offset = found + Math.max(1, query.length);
  }
  return count;
}

function validateSerializedDocument(value: unknown): IndexedDocument {
  if (!value || typeof value !== 'object') throw new Error('invalid-search-index-document');
  const candidate = value as Partial<IndexedDocument>;
  const summary = ArticleSummaryDtoSchema.parse(candidate.summary);
  if (typeof candidate.searchText !== 'string') throw new Error('invalid-search-index-text');
  if (!Number.isInteger(candidate.ordinal) || (candidate.ordinal ?? -1) < 0) {
    throw new Error('invalid-search-index-ordinal');
  }
  return { summary, searchText: candidate.searchText, ordinal: candidate.ordinal as number };
}

export class SearchIndex {
  private readonly documents = new Map<string, IndexedDocument>();
  private nextOrdinal = 0;

  constructor(articles: readonly Article[] = []) {
    this.replaceAll(articles);
  }

  replaceAll(articles: readonly Article[]): void {
    this.documents.clear();
    this.nextOrdinal = 0;
    for (const article of articles) this.upsert(article);
  }

  upsert(article: Article): void {
    const existing = this.documents.get(article.id);
    const ordinal = existing?.ordinal ?? this.nextOrdinal++;
    this.documents.set(article.id, {
      summary: summarizeArticle(article),
      searchText: normalizedSearchText(article),
      ordinal,
    });
  }

  remove(articleId: string): boolean {
    return this.documents.delete(articleId);
  }

  size(): number {
    return this.documents.size;
  }

  search(query: string, filter?: SearchFilter): SearchResultDto[] {
    const normalized = query.trim().normalize('NFKC').toLocaleLowerCase();
    if (!normalized) return [];
    return [...this.documents.values()]
      .filter((document) => matchesFilter(document.summary, filter))
      .map((document) => ({
        ...document.summary,
        score: countOccurrences(document.searchText, normalized),
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  }

  filter(filter?: SearchFilter): ArticleSummaryDto[] {
    return [...this.documents.values()]
      .filter((document) => matchesFilter(document.summary, filter))
      .sort((a, b) => a.ordinal - b.ordinal)
      .map((document) => ({ ...document.summary, tags: [...document.summary.tags] }));
  }

  serialize(): string {
    const payload: SerializedSearchIndexV1 = {
      schemaVersion: 1,
      documents: [...this.documents.values()]
        .sort((a, b) => a.ordinal - b.ordinal)
        .map((document) => ({
          summary: { ...document.summary, tags: [...document.summary.tags] },
          searchText: document.searchText,
          ordinal: document.ordinal,
        })),
    };
    return JSON.stringify(payload);
  }

  static deserialize(serialized: string): SearchIndex {
    const value = JSON.parse(serialized) as Partial<SerializedSearchIndexV1>;
    if (value.schemaVersion !== 1 || !Array.isArray(value.documents)) {
      throw new Error('unsupported-search-index-version');
    }
    const index = new SearchIndex();
    for (const rawDocument of value.documents) {
      const document = validateSerializedDocument(rawDocument);
      if (index.documents.has(document.summary.id)) throw new Error('duplicate-search-index-id');
      index.documents.set(document.summary.id, document);
      index.nextOrdinal = Math.max(index.nextOrdinal, document.ordinal + 1);
    }
    return index;
  }
}

export function searchArticles(articles: Article[], query: string): SearchResultDto[] {
  return new SearchIndex(articles).search(query);
}

export function summarizeArticle(article: Article): ArticleSummaryDto {
  const {
    id,
    slug,
    title,
    date,
    updatedAt,
    category,
    tags,
    excerpt,
    sourcePath,
    assetRoot,
    readingStats,
  } = article;
  return ArticleSummaryDtoSchema.parse({
    id,
    slug,
    title,
    date,
    updatedAt,
    category,
    tags: [...tags],
    excerpt,
    sourcePath,
    assetRoot,
    readingStats,
  });
}
