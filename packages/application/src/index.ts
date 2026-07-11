import {
  createManifest,
  scanArchiveWithDiagnostics,
  type ArchiveDiagnostics,
} from '@research-observatory/content-engine';
import type { Article } from '@research-observatory/domain';
import { searchArticles } from '@research-observatory/search-engine';

export class ResearchObservatoryApp {
  private articles: Article[] = [];
  private archiveDiagnostics: ArchiveDiagnostics = {
    warnings: [],
    invalidFiles: [],
    brokenLinks: [],
    missingAssets: [],
  };

  constructor(private root = 'docs') {
    this.reload(root);
  }

  reload(root = this.root): void {
    const snapshot = scanArchiveWithDiagnostics(root);
    this.root = root;
    this.articles = snapshot.articles;
    this.archiveDiagnostics = snapshot.diagnostics;
  }

  listArticles(): Article[] {
    return this.articles;
  }

  getArticle(id: string): Article {
    const article = this.articles.find((candidate) => candidate.id === id);
    if (!article) throw new Error('article-not-found');
    return article;
  }

  search(query: string) {
    return searchArticles(this.articles, query);
  }

  manifest() {
    return createManifest(this.root);
  }

  diagnostics() {
    return { validArticles: this.articles.length, ...this.archiveDiagnostics };
  }

  importPreview(sourceMarkdown: string) {
    return {
      title: sourceMarkdown.match(/^#\s+(.+)$/m)?.[1] || 'Untitled',
      warnings: [],
      files: ['index.md'],
    };
  }
}
