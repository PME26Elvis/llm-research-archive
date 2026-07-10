import { ResearchObservatoryApp } from '../packages/application/src/index.ts';
const app = new ResearchObservatoryApp('docs');
const list = app.listArticles();
if (!list.length) throw new Error('no articles');
app.getArticle(list[0].id);
app.search('AI');
app.manifest();
app.importPreview('# Demo');
console.log(`node smoke ok: ${list.length} articles`);
