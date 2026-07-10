import './style.css';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { renderMarkdown } from '@research-observatory/renderer-ui';
import type {
  ArticleDto,
  ArticleSummaryDto,
  SearchResultDto,
} from '@research-observatory/platform-contracts';

declare global {
  interface Window {
    observatory: {
      listArticles(): Promise<ArticleSummaryDto[]>;
      getArticle(id: string): Promise<ArticleDto>;
      search(query: string): Promise<SearchResultDto[]>;
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
  const [articles, setArticles] = useState<ArticleSummaryDto[]>([]);
  const [shown, setShown] = useState<(ArticleSummaryDto | SearchResultDto)[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ArticleDto | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    window.observatory
      .listArticles()
      .then((a) => {
        setArticles(a);
        setShown(a);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(() => {
      if (!q) {
        setShown(articles);
        return;
      }
      window.observatory
        .search(q)
        .then(setShown)
        .catch((e) => setError(String(e)));
    }, 150);
    return () => clearTimeout(t);
  }, [query, articles]);
  async function open(id: string) {
    setError('');
    try {
      setSelected(await window.observatory.getArticle(id));
    } catch (e) {
      setError(`文章載入失敗：${String(e)}`);
    }
  }
  function onArticleClick(e: React.MouseEvent<HTMLElement>) {
    const a = (e.target as HTMLElement).closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (/^https:/.test(href) || /^mailto:/.test(href)) {
      e.preventDefault();
      window.observatory.openExternal(href);
      return;
    }
    if (/^(http:|javascript:|data:|file:)/i.test(href)) {
      e.preventDefault();
      setError('已阻擋不安全連結');
      return;
    }
    const link = selected?.links.find((l) => l.href === href && l.targetArticleId);
    if (link?.targetArticleId) {
      e.preventDefault();
      open(link.targetArticleId);
      return;
    }
    if (href) {
      e.preventDefault();
      setError('找不到內部文章連結');
    }
  }
  return (
    <main className="app" data-testid="app-ready" data-article-count={articles.length}>
      <aside>
        <h1>Research Observatory</h1>
        <label>
          搜尋文章
          <input aria-label="搜尋文章" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        {loading && <p>載入中…</p>}
        {!loading && !shown.length && <p data-testid="empty-results">沒有符合的文章</p>}
        <ul data-testid="article-list">
          {shown.map((a) => (
            <li key={a.id}>
              <button onClick={() => open(a.id)}>
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
              <p data-testid="article-meta">
                {selected.date} · 約 {selected.readingStats.estimatedMinutes} 分鐘 ·{' '}
                {selected.tags.join('、')}
              </p>
            </header>
            <section
              data-testid="reader"
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
