import { expect, it } from 'vitest';
import { ResearchObservatoryApp } from './index';

it('runs node-only core flow', () => {
  const app = new ResearchObservatoryApp('docs');
  const articles = app.listArticles();
  expect(articles.length).toBe(6);
  expect(app.search('AI').length).toBeGreaterThan(0);
  expect(app.getArticle(articles[0].id).markdown.length).toBeGreaterThan(100);
  expect(app.diagnostics().validArticles).toBe(6);
});
