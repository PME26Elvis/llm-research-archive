import { expect, it } from 'vitest';
import { ResearchObservatoryApp } from './index';
it('runs node-only core flow', () => {
  const app = new ResearchObservatoryApp('docs');
  expect(app.listArticles().length).toBeGreaterThan(0);
  expect(app.search('AI').length).toBeGreaterThan(0);
  expect(app.diagnostics().validArticles).toBeGreaterThan(0);
});
