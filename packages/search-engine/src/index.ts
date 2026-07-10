import { Article } from '@research-observatory/domain';
import { SearchResultDto } from '@research-observatory/platform-contracts';
export function searchArticles(articles: Article[], query: string): SearchResultDto[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return articles
    .map((a) => {
      const text = `${a.title} ${a.tags.join(' ')} ${a.markdown}`.toLowerCase();
      const score = text.split(q).length - 1;
      return { ...summarizeArticle(a), score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}
export function summarizeArticle(a: Article) {
  const { id, slug, title, date, category, tags, excerpt, sourcePath, assetRoot, readingStats } = a;
  return {
    id,
    slug,
    title,
    date,
    category,
    tags: [...tags],
    excerpt,
    sourcePath,
    assetRoot,
    readingStats,
  };
}
