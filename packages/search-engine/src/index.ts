import { Article } from '@research-observatory/domain';
export interface SearchResult {
  id: string;
  title: string;
  score: number;
  excerpt: string;
}
export function searchArticles(articles: Article[], query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return articles
    .map((a) => {
      const text = (a.title + ' ' + a.tags.join(' ') + ' ' + a.markdown).toLowerCase();
      return { id: a.id, title: a.title, score: text.split(q).length - 1, excerpt: a.excerpt };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}
