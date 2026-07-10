import './style.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  buildArchiveBrowseModel,
  filterArticlesByBrowse,
  renderMarkdown,
  type BrowseMode,
} from '@research-observatory/renderer-ui';
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

const browseModes: { mode: BrowseMode; label: string }[] = [
  { mode: 'all', label: '全部' },
  { mode: 'category', label: '分類' },
  { mode: 'tag', label: '標籤' },
  { mode: 'timeline', label: '時間軸' },
];

function rewriteAssetLinks(markdown: string, assetRoot: string): string {
  return markdown.replace(
    /!\[([^\]]*)\]\((?!https?:|data:)([^)]+)\)/g,
    (_m, alt, src) => `![${alt}](app-asset:///${assetRoot}/${src})`,
  );
}

function hrefParts(href: string) {
  const hash = href.indexOf('#');
  if (hash < 0) return { path: href, fragment: '' };
  const path = href.slice(0, hash);
  const rawFragment = href.slice(hash + 1);
  try {
    return { path, fragment: rawFragment ? decodeURIComponent(rawFragment) : '' };
  } catch {
    return { path, fragment: rawFragment };
  }
}

function AboutModal({ info, onClose }: { info: AppInfoDto; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
      >
        <h2 id="about-title">關於 Research Observatory</h2>
        <dl>
          <dt>Product name</dt>
          <dd>{info.productName}</dd>
          <dt>Version</dt>
          <dd data-testid="about-version">{info.version}</dd>
          <dt>Commit SHA</dt>
          <dd data-testid="about-commit">{info.commit}</dd>
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
        <button ref={closeRef} type="button" onClick={onClose}>
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
  const [browseMode, setBrowseMode] = useState<BrowseMode>('all');
  const [selectedFacet, setSelectedFacet] = useState('');
  const [selected, setSelected] = useState<ArticleDto | null>(null);
  const [pendingFragment, setPendingFragment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [about, setAbout] = useState<AppInfoDto | null>(null);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);
  const browseModel = useMemo(() => buildArchiveBrowseModel(articles), [articles]);
  const filteredArticles = useMemo(
    () => filterArticlesByBrowse(articles, browseMode, selectedFacet),
    [articles, browseMode, selectedFacet],
  );
  const facets =
    browseMode === 'category'
      ? browseModel.categories
      : browseMode === 'tag'
        ? browseModel.tags
        : browseMode === 'timeline'
          ? browseModel.timeline
          : [];

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
    const timer = setTimeout(() => {
      if (!q) {
        setShown(filteredArticles);
        return;
      }
      window.observatory
        .search(q)
        .then((results) => setShown(filterArticlesByBrowse(results, browseMode, selectedFacet)))
        .catch((e) => setError(String(e)));
    }, 150);
    return () => clearTimeout(timer);
  }, [query, filteredArticles, browseMode, selectedFacet]);

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
    setPendingFragment('');
    try {
      const article = await window.observatory.getArticle(id);
      setSelected(article);
      setPendingFragment(fragment);
    } catch (e) {
      setError(`文章載入失敗：${String(e)}`);
    }
  }

  async function openInternalLink(id: string, href: string, fragment = '') {
    setError('');
    setPendingFragment('');
    try {
      const article = await window.observatory.getArticle(id);
      setSelected(article);
      setPendingFragment(fragment);
    } catch {
      setError(`找不到內部文章連結：${href}`);
    }
  }

  function scrollCurrentArticleToFragment(fragment: string) {
    setError('');
    setPendingFragment('');
    requestAnimationFrame(() => {
      const target = document.getElementById(fragment);
      if (target) target.scrollIntoView();
      else setError(`找不到標題片段：${fragment}`);
    });
  }

  function closeAbout() {
    setAbout(null);
    requestAnimationFrame(() => aboutButtonRef.current?.focus());
  }

  async function openAbout() {
    setError('');
    try {
      setAbout(await window.observatory.appInfo());
    } catch (e) {
      setError(`About 資訊載入失敗：${String(e)}`);
    }
  }

  function selectBrowseMode(mode: BrowseMode) {
    setBrowseMode(mode);
    setSelectedFacet('');
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
    const { path, fragment } = hrefParts(href);
    if (!path && fragment) {
      e.preventDefault();
      scrollCurrentArticleToFragment(fragment);
      return;
    }
    const link = selected?.links.find(
      (l) => l.targetArticleId && (l.href === href || hrefParts(l.href).path === path),
    );
    if (link?.targetArticleId) {
      e.preventDefault();
      openInternalLink(link.targetArticleId, href, fragment);
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
          <button ref={aboutButtonRef} type="button" onClick={openAbout}>
            關於
          </button>
        </div>
        <label>
          搜尋文章
          <input aria-label="搜尋文章" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <nav className="browse-tabs" aria-label="瀏覽文章">
          {browseModes.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              aria-pressed={browseMode === mode}
              data-testid={`browse-${mode}`}
              onClick={() => selectBrowseMode(mode)}
            >
              {label}
            </button>
          ))}
        </nav>
        {browseMode !== 'all' && (
          <section className="facet-panel" aria-label={`${browseModes.find((x) => x.mode === browseMode)?.label}篩選`}>
            <div className="facet-heading">
              <strong>{selectedFacet ? `已篩選 ${shown.length} 篇` : `選擇${browseModes.find((x) => x.mode === browseMode)?.label}`}</strong>
              {selectedFacet && (
                <button type="button" className="clear-filter" onClick={() => setSelectedFacet('')}>
                  清除
                </button>
              )}
            </div>
            <div className="facet-list" data-testid="facet-list">
              {facets.map((facet) => (
                <button
                  key={facet.key}
                  type="button"
                  aria-label={`${facet.label}（${facet.count} 篇）`}
                  aria-pressed={selectedFacet === facet.key}
                  onClick={() => setSelectedFacet(facet.key)}
                >
                  <span>{facet.label}</span>
                  <small>{facet.count}</small>
                </button>
              ))}
            </div>
          </section>
        )}
        {loading && <p>載入中…</p>}
        {!loading && !shown.length && <p data-testid="empty-results">沒有符合的文章</p>}
        <ul className="article-list" data-testid="article-list">
          {shown.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => open(a.id)}>
                {a.title}
                <small>
                  {a.category} · {a.date} · 約 {a.readingStats.estimatedMinutes} 分鐘
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
      {about && <AboutModal info={about} onClose={closeAbout} />}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
