import './style.css';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { renderMarkdown } from '@research-observatory/renderer-ui';
import type {
  AppInfoDto,
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
      appInfo(): Promise<AppInfoDto>;
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
function hrefParts(href: string) {
  const [path, fragment] = href.split('#');
  return { path, fragment: fragment ? decodeURIComponent(fragment) : '' };
}
function AboutModal({ info, onClose }: { info: AppInfoDto; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="about-title">
        <h2 id="about-title">關於 Research Observatory</h2>
        <dl>
          <dt>Product name</dt>
          <dd>{info.productName}</dd>
          <dt>Version</dt>
          <dd data-testid="about-version">{info.version}</dd>
          <dt>Commit SHA</dt>
          <dd>{info.commit}</dd>
          <dt>Platform</dt>
          <dd data-testid="about-platform">{info.platform}</dd>
          <dt>Mode</dt>
          <dd>{info.packaged ? 'Packaged' : 'Development'}</dd>
          <dt>Electron</dt>
          <dd>{info.electronVersion}</dd>
          <dt>Chromium</dt>
          <dd>{info.chromiumVersion}</dd>
          <dt>Node</dt>
          <dd>{info.nodeVersion}</dd>
          <dt>Content article count</dt>
          <dd>{info.contentArticleCount}</dd>
          <dt>Content manifest hash</dt>
          <dd>{info.contentManifestHash || 'Unavailable'}</dd>
        </dl>
        <button ref={closeRef} onClick={onClose}>
          關閉
        </button>
      </section>
    </div>
  );
}
function App() {
  const [articles, setArticles] = useState<ArticleSummaryDto[]>([]);
  const [shown, setShown] = useState<(ArticleSummaryDto | SearchResultDto)[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ArticleDto | null>(null);
  const [pendingFragment, setPendingFragment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [about, setAbout] = useState<AppInfoDto | null>(null);
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
  useEffect(() => {
    if (!pendingFragment) return;
    requestAnimationFrame(() => {
      const target = document.getElementById(pendingFragment);
      if (target) target.scrollIntoView();
      else setError(`找不到標題片段：${pendingFragment}`);
      setPendingFragment('');
    });
  }, [selected, pendingFragment]);
  async function open(id: string, fragment = '') {
    setError('');
    try {
      setPendingFragment(fragment);
      setSelected(await window.observatory.getArticle(id));
    } catch (e) {
      setError(`文章載入失敗：${String(e)}`);
    }
  }
  async function openAbout() {
    setError('');
    try {
      setAbout(await window.observatory.appInfo());
    } catch (e) {
      setError(`About 資訊載入失敗：${String(e)}`);
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
    const { fragment } = hrefParts(href);
    const link = selected?.links.find((l) => l.href === href && l.targetArticleId);
    if (link?.targetArticleId) {
      e.preventDefault();
      open(link.targetArticleId, fragment);
      return;
    }
    if (href) {
      e.preventDefault();
      setError(`找不到內部文章連結：${href}`);
    }
  }
  return (
    <main className="app" data-testid="app-ready" data-article-count={articles.length}>
      <aside>
        <div className="app-header">
          <h1>Research Observatory</h1>
          <button type="button" onClick={openAbout}>
            關於
          </button>
        </div>
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
      {about && <AboutModal info={about} onClose={() => setAbout(null)} />}
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
