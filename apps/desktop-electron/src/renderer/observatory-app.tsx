import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildArchiveBrowseModel,
  filterArticlesByBrowse,
  renderMarkdown,
  type BrowseMode,
} from '@research-observatory/renderer-ui';
import type {
  AppInfoDto,
  ArchiveDiagnosticsDto,
  ArticleDto,
  ArticleSummaryDto,
  SearchResultDto,
  DesktopCommand,
  WorkspaceInfoDto,
  WorkspaceSelectionResult,
  ImportCommitRequest,
  ImportCommitResult,
  ImportPreviewRefreshRequest,
  ImportPreviewResult,
  ImportSourceKind,
  RendererDiagnosticRequest,
  RendererImplementation,
  RendererImplementationInfoDto,
  StartupMilestone,
  StartupTelemetryDto,
} from '@research-observatory/platform-contracts';
import { CommandPalette } from './command-palette';
import { copyText } from './copy-code';
import { mountFootnoteNavigation } from './footnotes';
import { mountMermaidBlocks } from './mermaid-dom';
import { ImportWizard } from './import-wizard';
import { ObservatoryModal } from './observatory-modal';
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
import { usePreferences } from './preferences-context';
import type { Translator } from './i18n';
import { ResizableLayout } from './resizable-layout';
import { RendererImplementationControl } from './renderer-implementation';
import { mountSyntaxHighlighting } from './syntax-highlight';

declare global {
  interface Window {
    observatory: {
      listArticles(): Promise<ArticleSummaryDto[]>;
      getArticle(id: string): Promise<ArticleDto>;
      search(query: string): Promise<SearchResultDto[]>;
      appInfo(): Promise<AppInfoDto>;
      openExternal(url: string): Promise<void>;
      onCommand(listener: (command: DesktopCommand) => void): void;
      clearCommandHandler(): void;
      workspaceInfo(): Promise<WorkspaceInfoDto>;
      selectWorkspace(): Promise<WorkspaceSelectionResult>;
      selectImportSource(kind: ImportSourceKind): Promise<ImportPreviewResult>;
      refreshImportPreview(request: ImportPreviewRefreshRequest): Promise<ImportPreviewResult>;
      commitImport(request: ImportCommitRequest): Promise<ImportCommitResult>;
      diagnostics(): Promise<ArchiveDiagnosticsDto>;
      clearDiagnostics(): Promise<ArchiveDiagnosticsDto>;
      reportDiagnostic(request: RendererDiagnosticRequest): Promise<void>;
      markStartup(milestone: StartupMilestone): Promise<StartupTelemetryDto>;
      setLocale(locale: 'zh-TW' | 'en'): Promise<void>;
      rendererInfo(): Promise<RendererImplementationInfoDto>;
      setRenderer(implementation: RendererImplementation): Promise<void>;
    };
  }
}

interface LightboxImage {
  src: string;
  alt: string;
}

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
    return {
      path,
      fragment: rawFragment ? decodeURIComponent(rawFragment) : '',
    };
  } catch {
    return { path, fragment: rawFragment };
  }
}

function AboutModal({ info, onClose }: { info: AppInfoDto; onClose: () => void }) {
  const { t } = usePreferences();
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
        <h2 id="about-title">{t('about.title')}</h2>
        <dl>
          <dt>{t('about.productName')}</dt>
          <dd>{info.productName}</dd>
          <dt>{t('about.version')}</dt>
          <dd data-testid="about-version">{info.version}</dd>
          <dt>{t('about.commit')}</dt>
          <dd data-testid="about-commit">{info.commit}</dd>
          <dt>{t('about.platform')}</dt>
          <dd data-testid="about-platform">{info.platform}</dd>
          <dt>{t('about.mode')}</dt>
          <dd>{info.packaged ? t('about.packaged') : t('about.development')}</dd>
          <dt>{t('about.electron')}</dt>
          <dd>{info.electronVersion}</dd>
          <dt>{t('about.chromium')}</dt>
          <dd>{info.chromiumVersion}</dd>
          <dt>{t('about.node')}</dt>
          <dd>{info.nodeVersion}</dd>
          <dt>{t('about.contentCount')}</dt>
          <dd>{info.contentArticleCount}</dd>
          <dt>{t('about.manifestHash')}</dt>
          <dd>{info.contentManifestHash || t('common.unavailable')}</dd>
        </dl>
        <button ref={closeRef} type="button" onClick={onClose}>
          {t('common.close')}
        </button>
      </section>
    </div>
  );
}

function ImageLightbox({ image, onClose }: { image: LightboxImage; onClose: () => void }) {
  const { t } = usePreferences();
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
        aria-label={t('lightbox.title', { alt: image.alt })}
        data-testid="image-lightbox"
      >
        <img src={image.src} alt={image.alt} data-testid="lightbox-image" />
        <p>{image.alt}</p>
        <button ref={closeRef} type="button" onClick={onClose}>
          {t('lightbox.close')}
        </button>
      </section>
    </div>
  );
}

function decorateCodeBlocks(reader: HTMLElement, t: Translator): void {
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
    label.textContent = language || t('reader.code');
    const status = document.createElement('span');
    status.className = 'copy-code-status';
    status.dataset.copyCodeStatus = '';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.dataset.copyCode = '';
    button.setAttribute(
      'aria-label',
      language ? t('reader.copyLanguageCode', { language }) : t('reader.copyCode'),
    );
    button.textContent = t('reader.copy');

    toolbar.append(label, status, button);
    pre.replaceWith(wrapper);
    wrapper.append(toolbar, pre);
  }
}

export function ObservatoryApp({
  implementation = 'classic',
}: {
  implementation?: RendererImplementation;
}) {
  const { t, locale, formatNumber, formatDateTime } = usePreferences();
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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceInfoDto | null>(null);
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [observatoryOpen, setObservatoryOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<ArchiveDiagnosticsDto | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const observatoryButtonRef = useRef<HTMLButtonElement>(null);
  const interactiveMarkedRef = useRef(false);
  const readerRef = useRef<HTMLElement>(null);
  const lightboxTriggerRef = useRef<HTMLImageElement | null>(null);
  const browseModes = useMemo(
    () => [
      { mode: 'all' as const, label: t('browse.all') },
      { mode: 'category' as const, label: t('browse.category') },
      { mode: 'tag' as const, label: t('browse.tag') },
      { mode: 'timeline' as const, label: t('browse.timeline') },
    ],
    [t],
  );
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

  function reportDiagnostic(
    area: RendererDiagnosticRequest['area'],
    code: string,
    message: string,
  ) {
    void window.observatory.reportDiagnostic({ area, code, message }).catch(() => undefined);
  }

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
      setError(t('error.articleLoad'));
      reportDiagnostic('renderer', 'article-load-failed', String(error));
    }
  }

  function travelHistory(delta: -1 | 1) {
    const next = moveNavigation(navigationHistory, delta);
    if (next === navigationHistory) return;
    setNavigationHistory(next);
    void applyNavigation(currentNavigationLocation(next));
  }

  async function refreshWorkspace(nextWorkspace?: WorkspaceInfoDto) {
    setLoading(true);
    setError('');
    try {
      const [nextArticles, info, nextDiagnostics] = await Promise.all([
        window.observatory.listArticles(),
        nextWorkspace ? Promise.resolve(nextWorkspace) : window.observatory.workspaceInfo(),
        window.observatory.diagnostics(),
      ]);
      setWorkspace(info);
      setDiagnostics(nextDiagnostics);
      setArticles(nextArticles);
      setShown(nextArticles);
      setSelected(null);
      setQuery('');
      setBrowseMode('all');
      setSelectedFacet('');
      setNavigationHistory(createNavigationHistory());
    } catch (error) {
      setError(t('error.workspaceRefresh'));
      reportDiagnostic('renderer', 'workspace-refresh-failed', String(error));
    } finally {
      setLoading(false);
      if (!interactiveMarkedRef.current) {
        interactiveMarkedRef.current = true;
        void window.observatory
          .markStartup('interactive')
          .then((startup) =>
            setDiagnostics((current) => (current ? { ...current, startup } : current)),
          )
          .catch(() => undefined);
      }
    }
  }

  async function chooseWorkspace() {
    setError('');
    const result = await window.observatory.selectWorkspace();
    if (result.status === 'cancelled') return;
    if (result.status === 'rejected') {
      setError(result.message);
      return;
    }
    await refreshWorkspace(result.workspace);
  }

  function closeImportWizard() {
    setImportWizardOpen(false);
    requestAnimationFrame(() => importButtonRef.current?.focus());
  }

  async function handleImportCommitted(
    result: Extract<ImportCommitResult, { status: 'committed' }>,
  ) {
    await refreshWorkspace(result.workspace);
    await open(result.articleId);
    if (result.message) setError(result.message);
  }

  function executeDesktopCommand(command: DesktopCommand) {
    if (command === 'palette.open') {
      setCommandPaletteOpen(true);
    } else if (command === 'search.focus') {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    } else if (command === 'navigation.back') {
      travelHistory(-1);
    } else if (command === 'navigation.forward') {
      travelHistory(1);
    } else if (command === 'workspace.open') {
      void chooseWorkspace();
    } else if (command === 'import.open') {
      setImportWizardOpen(true);
    } else if (command === 'about.open') {
      void openAbout();
    } else if (command === 'observatory.open') {
      setObservatoryOpen(true);
    }
  }

  useEffect(() => {
    window.observatory.onCommand(executeDesktopCommand);
    const onShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLocaleLowerCase();
      if (event.shiftKey && key === 'i') {
        event.preventDefault();
        executeDesktopCommand('import.open');
      } else if (event.shiftKey && key === 'o') {
        event.preventDefault();
        executeDesktopCommand('observatory.open');
      } else if (event.shiftKey) return;
      else if (key === 'k') {
        event.preventDefault();
        executeDesktopCommand('palette.open');
      } else if (key === 'f') {
        event.preventDefault();
        executeDesktopCommand('search.focus');
      } else if (key === 'o') {
        event.preventDefault();
        executeDesktopCommand('workspace.open');
      }
    };
    document.addEventListener('keydown', onShortcut);
    return () => {
      document.removeEventListener('keydown', onShortcut);
      window.observatory.clearCommandHandler();
    };
  }, [navigationHistory, selected, query, browseMode, selectedFacet]);

  useEffect(() => {
    void window.observatory.markStartup('renderer-ready').catch(() => undefined);
    void refreshWorkspace();
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
        .catch((error) => {
          setError(t('error.search'));
          reportDiagnostic('search-index', 'search-query-failed', String(error));
        });
    }, 150);
    return () => clearTimeout(timer);
  }, [query, filteredArticles, browseMode, selectedFacet]);

  useEffect(() => {
    if (!pendingFragment) return;
    requestAnimationFrame(() => {
      const target = document.getElementById(pendingFragment);
      if (target) target.scrollIntoView();
      else setError(t('error.fragment', { fragment: pendingFragment }));
      setPendingFragment('');
    });
  }, [selected, pendingFragment]);

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader) return;
    for (const image of reader.querySelectorAll<HTMLImageElement>('img')) {
      const description = image.alt.trim() || t('reader.image');
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', t('reader.enlargeImage', { alt: description }));
      image.loading = 'lazy';
      image.decoding = 'async';
    }
    const cleanupMermaid = mountMermaidBlocks(reader, {
      labels: {
        diagram: t('mermaid.diagram'),
        pending: t('mermaid.pending'),
        source: t('mermaid.source'),
        rendering: t('mermaid.rendering'),
        done: t('mermaid.done'),
        failed: t('mermaid.failed'),
      },
    });
    decorateCodeBlocks(reader, t);
    const cleanupHighlighting = mountSyntaxHighlighting(reader);
    const cleanupFootnotes = mountFootnoteNavigation(reader);
    return () => {
      cleanupFootnotes();
      cleanupHighlighting();
      cleanupMermaid();
    };
  }, [selected, t]);

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
      setError(t('error.articleLoad'));
      reportDiagnostic('renderer', 'article-load-failed', String(error));
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
      setError(t('error.internalLink', { href }));
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
      } else setError(t('error.fragment', { fragment }));
    });
  }

  function closeObservatory() {
    setObservatoryOpen(false);
    requestAnimationFrame(() => observatoryButtonRef.current?.focus());
  }

  async function clearDiagnostics() {
    try {
      setDiagnostics(await window.observatory.clearDiagnostics());
    } catch (error) {
      setError(t('error.clearDiagnostics'));
      reportDiagnostic('renderer', 'diagnostics-clear-failed', String(error));
    }
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
      setError(t('error.about', { message: String(e) }));
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
    setLightbox({ src, alt: image.alt.trim() || t('reader.image') });
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
    button.textContent = copied ? t('reader.copied') : t('reader.copyFailed');
    button.dataset.copyState = copied ? 'success' : 'error';
    status.textContent = copied ? t('reader.copySuccessStatus') : t('reader.copyFailureStatus');

    window.setTimeout(() => {
      if (!button.isConnected) return;
      delete button.dataset.copyPending;
      delete button.dataset.copyState;
      button.removeAttribute('aria-busy');
      button.textContent = t('reader.copy');
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
      setError(t('error.unsafeLink'));
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
      setError(t('error.internalLink', { href }));
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
    <>
      <a className="skip-link" href="#main-reader">
        {t('reader.skip')}
      </a>
      <ResizableLayout
        implementation={implementation}
        articleCount={articles.length}
        sidebar={
          <>
            <div className="app-header">
              <h1>Research Observatory</h1>
              <div className="app-header-actions">
                <RendererImplementationControl implementation={implementation} />
                <ReaderSettings />
                <button
                  ref={observatoryButtonRef}
                  type="button"
                  onClick={() => setObservatoryOpen(true)}
                >
                  {t('observatory.button')}
                </button>
                <button ref={aboutButtonRef} type="button" onClick={openAbout}>
                  {t('about.button')}
                </button>
              </div>
            </div>
            {workspace && (
              <section className="workspace-panel" aria-label={t('workspace.current')}>
                <div>
                  <strong data-testid="workspace-kind">
                    {workspace.kind === 'local' ? t('workspace.local') : t('workspace.bundled')}
                  </strong>
                  <small data-testid="workspace-path" title={workspace.rootPath}>
                    {workspace.kind === 'local' ? workspace.displayName : t('workspace.bundled')}
                  </small>
                </div>
                <div className="workspace-actions">
                  <button type="button" onClick={() => void chooseWorkspace()}>
                    {t('workspace.openFolder')}
                  </button>
                  <button
                    ref={importButtonRef}
                    type="button"
                    onClick={() => setImportWizardOpen(true)}
                  >
                    {t('workspace.import')}
                  </button>
                </div>
                <details data-testid="workspace-diagnostics">
                  <summary>
                    {t('workspace.diagnostics', {
                      count: workspace.warnings.length + workspace.invalidFiles.length,
                    })}
                  </summary>
                  {[...workspace.warnings, ...workspace.invalidFiles].length ? (
                    <ul>
                      {[...workspace.warnings, ...workspace.invalidFiles].map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{t('workspace.noIssues')}</p>
                  )}
                  {diagnostics && (
                    <>
                      <h3>{t('workspace.startup')}</h3>
                      <dl className="startup-telemetry" data-testid="startup-telemetry">
                        {Object.entries(diagnostics.startup.milestones).map(([name, value]) => (
                          <React.Fragment key={name}>
                            <dt>{name}</dt>
                            <dd>{t('common.ms', { count: Math.round(Number(value)) })}</dd>
                          </React.Fragment>
                        ))}
                      </dl>
                      {diagnostics.startup.materialRegression && (
                        <p role="status">{t('workspace.startupRegression')}</p>
                      )}
                      <h3>{t('workspace.localEvents')}</h3>
                      {diagnostics.events.length ? (
                        <ol className="diagnostic-events" data-testid="diagnostic-events">
                          {diagnostics.events.map((event) => (
                            <li key={`${event.timestamp}-${event.code}`}>
                              <time dateTime={event.timestamp}>
                                {formatDateTime(event.timestamp)}
                              </time>{' '}
                              <strong>{event.code}</strong>：{event.message}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p>{t('workspace.noEvents')}</p>
                      )}
                      <button type="button" onClick={() => void clearDiagnostics()}>
                        {t('workspace.clearDiagnostics')}
                      </button>
                    </>
                  )}
                </details>
              </section>
            )}
            <label>
              {t('search.label')}
              <input
                ref={searchInputRef}
                aria-label={t('search.label')}
                data-search-input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  replaceNavigation({ query: event.target.value });
                }}
              />
            </label>
            <nav className="browse-tabs" aria-label={t('search.browse')}>
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
                aria-label={t('search.filterAria', {
                  label: browseModes.find((x) => x.mode === browseMode)?.label || '',
                })}
              >
                <div className="facet-heading">
                  <strong>
                    {selectedFacet
                      ? t('search.filtered', { count: formatNumber(shown.length) })
                      : t('search.selectFacet', {
                          label: browseModes.find((x) => x.mode === browseMode)?.label || '',
                        })}
                  </strong>
                  {selectedFacet && (
                    <button type="button" className="clear-filter" onClick={clearFacet}>
                      {t('common.clear')}
                    </button>
                  )}
                </div>
                <div className="facet-list" data-testid="facet-list">
                  {facets.map((facet) => (
                    <button
                      key={facet.key}
                      type="button"
                      aria-label={t('search.facetCount', {
                        label: facet.label,
                        count: formatNumber(facet.count),
                      })}
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
            <p className="sr-only" role="status" aria-live="polite">
              {loading
                ? t('search.loadingStatus')
                : t('search.shownStatus', { count: formatNumber(shown.length) })}
            </p>
            {loading && <p>{t('common.loading')}</p>}
            {!loading && !shown.length && <p data-testid="empty-results">{t('search.empty')}</p>}
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
                      {t('search.articleMeta', {
                        category: a.category,
                        date: a.date,
                        minutes: a.readingStats.estimatedMinutes,
                      })}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          </>
        }
      >
        <article
          id="main-reader"
          tabIndex={-1}
          onClick={onArticleClick}
          onKeyDown={onArticleKeyDown}
        >
          <nav className="navigation-toolbar" aria-label={t('reader.history')}>
            <button
              type="button"
              aria-label={t('reader.previousLocation')}
              disabled={!canNavigateBack(navigationHistory)}
              onClick={() => travelHistory(-1)}
            >
              {t('reader.previousPage')}
            </button>
            <span aria-live="polite" data-testid="history-position">
              {navigationHistory.index + 1} / {navigationHistory.entries.length}
            </span>
            <button
              type="button"
              aria-label={t('reader.nextLocation')}
              disabled={!canNavigateForward(navigationHistory)}
              onClick={() => travelHistory(1)}
            >
              {t('reader.nextPage')}
            </button>
          </nav>
          {error && <p role="alert">{error}</p>}
          {selected ? (
            <>
              <header>
                <h2>{selected.title}</h2>
                <p data-testid="article-meta">
                  {t('reader.published', { date: selected.date })}
                  {selected.updatedAt
                    ? ` · ${t('reader.updated', { date: selected.updatedAt })}`
                    : ''}{' '}
                  ·{' '}
                  {t('reader.approxMinutes', {
                    count: selected.readingStats.estimatedMinutes,
                  })}{' '}
                  · {selected.tags.join(locale === 'zh-TW' ? '、' : ', ')}
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
            <p>{t('reader.selectArticle')}</p>
          )}
        </article>
      </ResizableLayout>
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onExecute={executeDesktopCommand}
      />
      {about && <AboutModal info={about} onClose={closeAbout} />}
      {observatoryOpen && <ObservatoryModal articles={articles} onClose={closeObservatory} />}
      <ImportWizard
        open={importWizardOpen}
        workspace={workspace}
        onClose={closeImportWizard}
        onChooseWorkspace={chooseWorkspace}
        onCommitted={handleImportCommitted}
      />
      {lightbox && <ImageLightbox image={lightbox} onClose={closeImageLightbox} />}
    </>
  );
}
