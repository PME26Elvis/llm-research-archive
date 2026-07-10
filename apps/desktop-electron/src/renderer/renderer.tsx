import './style.css';
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { renderMarkdown } from '@research-observatory/renderer-ui';
type ArticleSummary = {
  id: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  readingStats: { estimatedMinutes: number };
};
type Article = ArticleSummary & { markdown: string; assetRoot: string };
declare global {
  interface Window {
    observatory: {
      listArticles(): Promise<ArticleSummary[]>;
      getArticle(id: string): Promise<Article>;
      search(query: string): Promise<ArticleSummary[]>;
      openExternal(url: string): Promise<void>;
    };
  }
}
function rewriteAssetLinks(markdown: string, assetRoot: string): string {
  return markdown.replace(
    /!\[([^\]]*)\]\((?!https?:|data:)([^)]+)\)/g,
    (_m, alt, src) => `![${alt}](app-asset:///${assetRoot}/${src})`,
  );
}
function App() {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Article | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    window.observatory
      .listArticles()
      .then((a) => {
        setArticles(a);
        if (a[0]) return open(a[0].id);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);
  async function open(id: string) {
    setError('');
    try {
      setSelected(await window.observatory.getArticle(id));
    } catch (e) {
      setError(String(e));
    }
  }
  const [results, setResults] = useState<ArticleSummary[] | null>(null);
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    const t = setTimeout(
      () =>
        window.observatory
          .search(q)
          .then(setResults)
          .catch((e) => setError(String(e))),
      150,
    );
    return () => clearTimeout(t);
  }, [query]);
  const shown = results ?? articles;
  function onArticleClick(e: React.MouseEvent<HTMLElement>) {
    const a = (e.target as HTMLElement).closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (/^https:/.test(href) || /^mailto:/.test(href)) {
      e.preventDefault();
      window.observatory.openExternal(href);
    }
  }
  return (
    <main className="app">
      <aside>
        <h1>Research Observatory</h1>
        <label>
          搜尋文章
          <input aria-label="搜尋文章" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        {loading && <p>載入中…</p>}
        {!loading && !shown.length && <p>沒有符合的文章</p>}
        <ul>
          {shown.map((a) => (
            <li key={a.id}>
              <button onClick={() => open(a.id)} autoFocus={selected?.id === a.id}>
                {a.title}
                <small>
                  {a.date} · 約 {a.readingStats.estimatedMinutes} 分鐘
                </small>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <article onClick={onArticleClick}>
        {error && <p role="alert">{error}</p>}
        {selected ? (
          <>
            <header>
              <h2>{selected.title}</h2>
              <p>
                {selected.date} · 約 {selected.readingStats.estimatedMinutes} 分鐘 ·{' '}
                {selected.tags.join('、')}
              </p>
            </header>
            <section
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(rewriteAssetLinks(selected.markdown, selected.assetRoot)),
              }}
            />
          </>
        ) : (
          <p>請選擇文章</p>
        )}
      </article>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
