import { scanArchive, createManifest } from '@research-observatory/content-engine';
import { searchArticles } from '@research-observatory/search-engine';
export class ResearchObservatoryApp {
  constructor(private root = 'docs') {}
  listArticles() {
    return scanArchive(this.root);
  }
  getArticle(id: string) {
    const a = this.listArticles().find((x) => x.id === id);
    if (!a) throw new Error('article-not-found');
    return a;
  }
  search(query: string) {
    return searchArticles(this.listArticles(), query);
  }
  manifest() {
    return createManifest(this.root);
  }
  diagnostics() {
    const articles = this.listArticles();
    return {
      validArticles: articles.length,
      warnings: [],
      invalidFiles: [],
      brokenLinks: [],
      missingAssets: [],
    };
  }
  importPreview(sourceMarkdown: string) {
    return {
      title: sourceMarkdown.match(/^#\s+(.+)$/m)?.[1] || 'Untitled',
      warnings: [],
      files: ['index.md'],
    };
  }
}
