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
import { copyText } from './copy-code';
import { mountFootnoteNavigation } from './footnotes';
import { mountMermaidBlocks } from './mermaid-dom';
import {
  canNavigateBack,
  canNavigateForward,
  createNavigationHistory,
  currentNavigationLocation,
  moveNavigation,
  pushNavigationLocation,
  replaceNavigationLocation,
  type NavigationLocation,
} from './navigation-history';
import { ReaderSettings } from './reader-settings';
import { mountSyntaxHighlighting } from './syntax-highlight';

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

interface LightboxImage {
  src: string;
  alt: string;
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

function ImageLightbox({ image, onClose }: { image: LightboxImage; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop lightbox-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="modal lightbox-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`圖片預覽：${image.alt}`}
        data-testid="image-lightbox"
      >
        <img src={image.src} alt={image.alt} data-testid="lightbox-image" />
        <p>{image.alt}</p>
        <button ref={closeRef} type="button" onClick={onClose}>
          關閉圖片
        </button>
      </section>
    </div>
  );
}

function decorateCodeBlocks(reader: HTMLElement): void {
  for (const pre of reader.querySelectorAll<HTMLPreElement>('pre')) {
    if (pre.parentElement?.classList.contains('code-block')) continue;
    const code = pre.querySelector<HTMLElement>('code');
    if (!code) continue;

    const languageClass = [...code.classList].find((name) => name.startsWith('language-'));
    const language = languageClass?.slice('language-'.length) || '';
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    const toolbar = document.createElement('div');
    toolbar.className = 'code-toolbar';
    const label = document.createElement('span');
    label.className = 'code-language';
    label.textContent = language || '程式碼';
    const status = document.createElement('span');
    status.className = 'copy-code-status';
    status.dataset.copyCodeStatus = '';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.dataset.copyCode = '';
    button.setAttribute('aria-label', language ? `複製 ${language} 程式碼` : '複製程式碼');
    button.textContent = '複製';

    toolbar.append(label, status, button);
    pre.replaceWith(wrapper);
    wrapper.append(toolbar, pre);
  }
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
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);
  const [navigationHistory, setNavigationHistory] = useState(createNavigationHistory);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);
  const readerRef = useRef<HTMLElement>(null);
  const lightboxTriggerRef = useRef<HTMLImageElement | null>(null);
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

  function navigationSnapshot(overrides: Partial<NavigationLocation> = {}): NavigationLocation {
    return {
      articleId: selected?.id ?? '',
      fragment: '',
      query,
      browseMode,
      selectedFacet,
      ...overrides,
    };
  }

  function pushNavigation(overrides: Partial<NavigationLocation>) {
    setNavigationHistory((history) =>
      pushNavigationLocation(history, navigationSnapshot(overrides)),
    );
  }

  function replaceNavigation(overrides: Partial<NavigationLocation>) {
    setNavigationHistory((history) =>
      replaceNavigationLocation(history, {
        ...currentNavigationLocation(history),
        ...overrides,
      }),
    );
  }

  async function applyNavigation(location: NavigationLocation) {
    setError('');
    setLightbox(null);
    setQuery(location.query);
    setBrowseMode(location.browseMode);
    setSelectedFacet(location.selectedFacet);
    setPendingFragment('');
    if (!location.articleId) {
      setSelected(null);
      return;
    }
    if (selected?.id === location.articleId) {
      setPendingFragment(location.fragment);
      return;
    }
    try {
      const article = await window.observatory.getArticle(location.articleId);
      setSelected(article);
      setPendingFragment(location.fragment);
    } catch (error) {
      setError(`文章載入失敗：${String(error)}`);
    }
  }

  function travelHistory(delta: -1 | 1) {
    const next = moveNavigation(navigationHistory, delta);
    if (next === navigationHistory) return;
    setNavigationHistory(next);
    void applyNavigation(currentNavigationLocation(next));
  }

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
    const onNavigationKey = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        travelHistory(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        travelHistory(1);
      }
    };
    document.addEventListener('keydown', onNavigationKey);
    return () => document.removeEventListener('keydown', onNavigationKey);
  }, [navigationHistory, selected, query, browseMode, selectedFacet]);

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

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader) return;
    for (const image of reader.querySelectorAll<HTMLImageElement>('img')) {
      const description = image.alt.trim() || '文章圖片';
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', `放大圖片：${description}`);
      image.loading = 'lazy';
      image.decoding = 'async';
    }
    const cleanupMermaid = mountMermaidBlocks(reader);
    decorateCodeBlocks(reader);
    const cleanupHighlighting = mountSyntaxHighlighting(reader);
    const cleanupFootnotes = mountFootnoteNavigation(reader);
    return () => {
      cleanupFootnotes();
      cleanupHighlighting();
      cleanupMermaid();
    };
  }, [selected]);

  async function open(id: string, fragment = '') {
    setError('');
    setPendingFragment('');
    setLightbox(null);
    try {
      const article = await window.observatory.getArticle(id);
      setSelected(article);
      setPendingFragment(fragment);
      pushNavigation({ articleId: id, fragment });
    } catch (error) {
      setError(`文章載入失敗：${String(error)}`);
    }
  }

  async function openInternalLink(id: string, href: string, fragment = '') {
    setError('');
    setPendingFragment('');
    setLightbox(null);
    try {
      const article = await window.observatory.getArticle(id);
      setSelected(article);
      setPendingFragment(fragment);
      pushNavigation({ articleId: id, fragment });
    } catch {
      setError(`找不到內部文章連結：${href}`);
    }
  }

  function scrollCurrentArticleToFragment(fragment: string) {
    setError('');
    setPendingFragment('');
    requestAnimationFrame(() => {
      const target = document.getElementById(fragment);
      if (target) {
        target.scrollIntoView();
        pushNavigation({ articleId: selected?.id ?? '', fragment });
      } else setError(`找不到標題片段：${fragment}`);
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
    pushNavigation({ browseMode: mode, selectedFacet: '' });
  }

  function selectFacet(facet: string) {
    setSelectedFacet(facet);
    pushNavigation({ selectedFacet: facet });
  }

  function clearFacet() {
    setSelectedFacet('');
    pushNavigation({ selectedFacet: '' });
  }

  function openImageLightbox(image: HTMLImageElement) {
    const src = image.currentSrc || image.src;
    if (!src) return;
    lightboxTriggerRef.current = image;
    setLightbox({ src, alt: image.alt.trim() || '文章圖片' });
  }

  function closeImageLightbox() {
    const trigger = lightboxTriggerRef.current;
    setLightbox(null);
    requestAnimationFrame(() => trigger?.focus());
  }

  async function copyCodeBlock(button: HTMLButtonElement) {
    if (button.dataset.copyPending === 'true') return;
    const block = button.closest('.code-block');
    const code = block?.querySelector<HTMLElement>('pre > code');
    const status = block?.querySelector<HTMLElement>('[data-copy-code-status]');
    if (!code || !status) return;

    button.dataset.copyPending = 'true';
    button.setAttribute('aria-busy', 'true');
    const copied = await copyText(code.textContent || '');
    button.textContent = copied ? '已複製' : '複製失敗';
    button.dataset.copyState = copied ? 'success' : 'error';
    status.textContent = copied ? '程式碼已複製到剪貼簿' : '無法存取剪貼簿，請手動選取程式碼';

    window.setTimeout(() => {
      if (!button.isConnected) return;
      delete button.dataset.copyPending;
      delete button.dataset.copyState;
      button.removeAttribute('aria-busy');
      button.textContent = '複製';
      status.textContent = '';
    }, 1800);
  }

  function onArticleClick(e: React.MouseEvent<HTMLElement>) {
    const target = e.target as HTMLElement;
    const copyButton = target.closest('button[data-copy-code]') as HTMLButtonElement | null;
    if (copyButton) {
      e.preventDefault();
      void copyCodeBlock(copyButton);
      return;
    }

    const image = target.closest('img[role="button"]') as HTMLImageElement | null;
    if (image) {
      e.preventDefault();
      openImageLightbox(image);
      return;
    }

    const a = target.closest('a');
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

  function onArticleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const image = (e.target as HTMLElement).closest(
      'img[role="button"]',
    ) as HTMLImageElement | null;
    if (!image) return;
    e.preventDefault();
    openImageLightbox(image);
  }

  return (
    <main className="app" data-testid="app-ready" data-article-count={articles.length}>
      <aside>
        <div className="app-header">
          <h1>Research Observatory</h1>
          <div className="app-header-actions">
            <ReaderSettings />
            <button ref={aboutButtonRef} type="button" onClick={openAbout}>
              關於
            </button>
          </div>
        </div>
        <label>
          搜尋文章
          <input
            aria-label="搜尋文章"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              replaceNavigation({ query: event.target.value });
            }}
          />
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
          <section
            className="facet-panel"
            aria-label={`${browseModes.find((x) => x.mode === browseMode)?.label}篩選`}
          >
            <div className="facet-heading">
              <strong>
                {selectedFacet
                  ? `已篩選 ${shown.length} 篇`
                  : `選擇${browseModes.find((x) => x.mode === browseMode)?.label}`}
              </strong>
              {selectedFacet && (
                <button type="button" className="clear-filter" onClick={clearFacet}>
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
                  onClick={() => selectFacet(facet.key)}
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
              <button
                type="button"
                aria-current={selected?.id === a.id ? 'page' : undefined}
                onClick={() => open(a.id)}
              >
                {a.title}
                <small>
                  {a.category} · {a.date} · 約 {a.readingStats.estimatedMinutes} 分鐘
                </small>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <article onClick={onArticleClick} onKeyDown={onArticleKeyDown}>
        <nav className="navigation-toolbar" aria-label="閱讀歷史">
          <button
            type="button"
            aria-label="上一個位置"
            disabled={!canNavigateBack(navigationHistory)}
            onClick={() => travelHistory(-1)}
          >
            ← 上一頁
          </button>
          <span aria-live="polite" data-testid="history-position">
            {navigationHistory.index + 1} / {navigationHistory.entries.length}
          </span>
          <button
            type="button"
            aria-label="下一個位置"
            disabled={!canNavigateForward(navigationHistory)}
            onClick={() => travelHistory(1)}
          >
            下一頁 →
          </button>
        </nav>
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
              ref={readerRef}
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
      {lightbox && <ImageLightbox image={lightbox} onClose={closeImageLightbox} />}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
