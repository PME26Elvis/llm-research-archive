import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ResearchObservatoryApp } from './index';

const temporaryRoots: string[] = [];
function fixture(title = 'Fixture Article', body = 'searchable benchmark body') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'application-core-'));
  temporaryRoots.push(root);
  const directory = path.join(root, 'quality', 'fixture');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'index.md'),
    `---\ndate: 2026-07-13\nupdated: 2026-07-14\ntags: [quality, fixture]\n---\n# ${title}\n\n${body}\n`,
  );
  return root;
}
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('ResearchObservatoryApp', () => {
  it('runs the bundled node-only core flow', () => {
    const app = new ResearchObservatoryApp('docs');
    const articles = app.listArticles();
    expect(articles.length).toBe(6);
    expect(app.search('AI').length).toBeGreaterThan(0);
    expect(app.getArticle(articles[0].id).markdown.length).toBeGreaterThan(100);
    expect(app.diagnostics().validArticles).toBe(6);
  });

  it('reloads a different archive, rebuilds search, manifest, and diagnostics', () => {
    const first = fixture('First Article', 'first needle');
    const second = fixture('Second Article', 'second needle');
    const app = new ResearchObservatoryApp(first);
    expect(app.search('first')).toHaveLength(1);
    expect(app.manifest().articles).toHaveLength(1);
    app.reload(second);
    expect(app.listArticles().map((article) => article.title)).toEqual(['Second Article']);
    expect(app.search('first')).toEqual([]);
    expect(app.search('second')[0].title).toBe('Second Article');
    expect(app.diagnostics()).toMatchObject({
      validArticles: 1,
      invalidFiles: [],
      missingAssets: [],
    });
  });

  it('throws a stable error for an unknown article id', () => {
    const app = new ResearchObservatoryApp(fixture());
    expect(() => app.getArticle('missing')).toThrow('article-not-found');
  });

  it('creates deterministic lightweight import previews with title and fallback', () => {
    const app = new ResearchObservatoryApp(fixture());
    expect(app.importPreview('# Imported Title\n\nBody')).toEqual({
      title: 'Imported Title',
      warnings: [],
      files: ['index.md'],
    });
    expect(app.importPreview('Body without heading')).toEqual({
      title: 'Untitled',
      warnings: [],
      files: ['index.md'],
    });
  });
});
