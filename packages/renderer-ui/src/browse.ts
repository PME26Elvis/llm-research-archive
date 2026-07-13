import type { AppLocale } from '@research-observatory/platform-contracts';

export type BrowseMode = 'all' | 'category' | 'tag' | 'timeline';

export interface BrowsableArticle {
  category: string;
  tags: readonly string[];
  date: string;
}

export interface BrowseFacet {
  key: string;
  label: string;
  count: number;
}

export interface ArchiveBrowseModel {
  categories: BrowseFacet[];
  tags: BrowseFacet[];
  timeline: BrowseFacet[];
}

function increment(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) || 0) + 1);
}

export function articleMonthKey(date: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(date);
  return match ? `${match[1]}-${match[2]}` : 'unknown';
}

function monthLabel(key: string, locale: AppLocale): string {
  if (key === 'unknown') return locale === 'en' ? 'Unknown date' : '日期不明';
  const [year, month] = key.split('-').map(Number);
  return locale === 'en'
    ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(
        new Date(Date.UTC(year, month - 1, 1)),
      )
    : `${year} 年 ${month} 月`;
}

function alphabeticalFacets(counts: Map<string, number>, locale: AppLocale): BrowseFacet[] {
  return [...counts]
    .map(([key, count]) => ({ key, label: key, count }))
    .sort((a, b) => a.label.localeCompare(b.label, locale === 'en' ? 'en' : 'zh-Hant'));
}

export function buildArchiveBrowseModel(
  articles: readonly BrowsableArticle[],
  locale: AppLocale = 'zh-TW',
): ArchiveBrowseModel {
  const categories = new Map<string, number>();
  const tags = new Map<string, number>();
  const timeline = new Map<string, number>();

  for (const article of articles) {
    increment(categories, article.category);
    for (const tag of new Set(article.tags)) increment(tags, tag);
    increment(timeline, articleMonthKey(article.date));
  }

  return {
    categories: alphabeticalFacets(categories, locale),
    tags: alphabeticalFacets(tags, locale),
    timeline: [...timeline]
      .map(([key, count]) => ({ key, label: monthLabel(key, locale), count }))
      .sort((a, b) => {
        if (a.key === 'unknown') return 1;
        if (b.key === 'unknown') return -1;
        return b.key.localeCompare(a.key);
      }),
  };
}

export function filterArticlesByBrowse<T extends BrowsableArticle>(
  articles: readonly T[],
  mode: BrowseMode,
  selectedFacet: string,
): T[] {
  if (mode === 'all' || !selectedFacet) return [...articles];
  if (mode === 'category') return articles.filter((article) => article.category === selectedFacet);
  if (mode === 'tag') return articles.filter((article) => article.tags.includes(selectedFacet));
  return articles.filter((article) => articleMonthKey(article.date) === selectedFacet);
}
