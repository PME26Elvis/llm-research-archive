from pathlib import Path

renderer = Path('apps/desktop-electron/src/renderer/renderer.tsx')
text = renderer.read_text()
text = text.replace(
    "import { mountMermaidBlocks } from './mermaid-dom';\nimport { ReaderSettings } from './reader-settings';",
    "import { mountMermaidBlocks } from './mermaid-dom';\nimport {\n  canNavigateBack,\n  canNavigateForward,\n  createNavigationHistory,\n  currentNavigationLocation,\n  moveNavigation,\n  pushNavigationLocation,\n  replaceNavigationLocation,\n  type NavigationLocation,\n} from './navigation-history';\nimport { ReaderSettings } from './reader-settings';",
)
text = text.replace(
    "  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);\n  const aboutButtonRef",
    "  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);\n  const [navigationHistory, setNavigationHistory] = useState(createNavigationHistory);\n  const aboutButtonRef",
)
marker = "  const facets =\n    browseMode === 'category'\n      ? browseModel.categories\n      : browseMode === 'tag'\n        ? browseModel.tags\n        : browseMode === 'timeline'\n          ? browseModel.timeline\n          : [];\n"
addition = marker + "\n  function navigationSnapshot(overrides: Partial<NavigationLocation> = {}): NavigationLocation {\n    return {\n      articleId: selected?.id ?? '',\n      fragment: '',\n      query,\n      browseMode,\n      selectedFacet,\n      ...overrides,\n    };\n  }\n\n  function pushNavigation(overrides: Partial<NavigationLocation>) {\n    setNavigationHistory((history) =>\n      pushNavigationLocation(history, navigationSnapshot(overrides)),\n    );\n  }\n\n  function replaceNavigation(overrides: Partial<NavigationLocation>) {\n    setNavigationHistory((history) =>\n      replaceNavigationLocation(history, {\n        ...currentNavigationLocation(history),\n        ...overrides,\n      }),\n    );\n  }\n\n  async function applyNavigation(location: NavigationLocation) {\n    setError('');\n    setLightbox(null);\n    setQuery(location.query);\n    setBrowseMode(location.browseMode);\n    setSelectedFacet(location.selectedFacet);\n    setPendingFragment('');\n    if (!location.articleId) {\n      setSelected(null);\n      return;\n    }\n    if (selected?.id === location.articleId) {\n      setPendingFragment(location.fragment);\n      return;\n    }\n    try {\n      const article = await window.observatory.getArticle(location.articleId);\n      setSelected(article);\n      setPendingFragment(location.fragment);\n    } catch (error) {\n      setError(`文章載入失敗：${String(error)}`);\n    }\n  }\n\n  function travelHistory(delta: -1 | 1) {\n    const next = moveNavigation(navigationHistory, delta);\n    if (next === navigationHistory) return;\n    setNavigationHistory(next);\n    void applyNavigation(currentNavigationLocation(next));\n  }\n"
if marker not in text:
    raise SystemExit('facets marker not found')
text = text.replace(marker, addition)

load_effect = "  useEffect(() => {\n    const q = query.trim();"
keyboard_effect = "  useEffect(() => {\n    const onNavigationKey = (event: KeyboardEvent) => {\n      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;\n      if (event.key === 'ArrowLeft') {\n        event.preventDefault();\n        travelHistory(-1);\n      } else if (event.key === 'ArrowRight') {\n        event.preventDefault();\n        travelHistory(1);\n      }\n    };\n    document.addEventListener('keydown', onNavigationKey);\n    return () => document.removeEventListener('keydown', onNavigationKey);\n  }, [navigationHistory, selected, query, browseMode, selectedFacet]);\n\n"
if load_effect not in text:
    raise SystemExit('load effect marker not found')
text = text.replace(load_effect, keyboard_effect + load_effect)

old_open = "  async function open(id: string, fragment = '') {\n    setError('');\n    setPendingFragment('');\n    setLightbox(null);\n    try {\n      const article = await window.observatory.getArticle(id);\n      setSelected(article);\n      setPendingFragment(fragment);\n    } catch (e) {\n      setError(`文章載入失敗：${String(e)}`);\n    }\n  }\n\n  async function openInternalLink(id: string, href: string, fragment = '') {\n    setError('');\n    setPendingFragment('');\n    setLightbox(null);\n    try {\n      const article = await window.observatory.getArticle(id);\n      setSelected(article);\n      setPendingFragment(fragment);\n    } catch {\n      setError(`找不到內部文章連結：${href}`);\n    }\n  }"
new_open = "  async function open(id: string, fragment = '') {\n    setError('');\n    setPendingFragment('');\n    setLightbox(null);\n    try {\n      const article = await window.observatory.getArticle(id);\n      setSelected(article);\n      setPendingFragment(fragment);\n      pushNavigation({ articleId: id, fragment });\n    } catch (error) {\n      setError(`文章載入失敗：${String(error)}`);\n    }\n  }\n\n  async function openInternalLink(id: string, href: string, fragment = '') {\n    setError('');\n    setPendingFragment('');\n    setLightbox(null);\n    try {\n      const article = await window.observatory.getArticle(id);\n      setSelected(article);\n      setPendingFragment(fragment);\n      pushNavigation({ articleId: id, fragment });\n    } catch {\n      setError(`找不到內部文章連結：${href}`);\n    }\n  }"
if old_open not in text:
    raise SystemExit('open functions not found')
text = text.replace(old_open, new_open)

old_scroll = "      const target = document.getElementById(fragment);\n      if (target) target.scrollIntoView();\n      else setError(`找不到標題片段：${fragment}`);"
new_scroll = "      const target = document.getElementById(fragment);\n      if (target) {\n        target.scrollIntoView();\n        pushNavigation({ articleId: selected?.id ?? '', fragment });\n      } else setError(`找不到標題片段：${fragment}`);"
if old_scroll not in text:
    raise SystemExit('scroll fragment block not found')
text = text.replace(old_scroll, new_scroll, 1)

text = text.replace(
    "  function selectBrowseMode(mode: BrowseMode) {\n    setBrowseMode(mode);\n    setSelectedFacet('');\n  }",
    "  function selectBrowseMode(mode: BrowseMode) {\n    setBrowseMode(mode);\n    setSelectedFacet('');\n    pushNavigation({ browseMode: mode, selectedFacet: '' });\n  }\n\n  function selectFacet(facet: string) {\n    setSelectedFacet(facet);\n    pushNavigation({ selectedFacet: facet });\n  }\n\n  function clearFacet() {\n    setSelectedFacet('');\n    pushNavigation({ selectedFacet: '' });\n  }",
)

text = text.replace(
    "<input aria-label=\"搜尋文章\" value={query} onChange={(e) => setQuery(e.target.value)} />",
    "<input\n            aria-label=\"搜尋文章\"\n            value={query}\n            onChange={(event) => {\n              setQuery(event.target.value);\n              replaceNavigation({ query: event.target.value });\n            }}\n          />",
)
text = text.replace(
    "<button type=\"button\" className=\"clear-filter\" onClick={() => setSelectedFacet('')}",
    "<button type=\"button\" className=\"clear-filter\" onClick={clearFacet}",
)
text = text.replace(
    "onClick={() => setSelectedFacet(facet.key)}",
    "onClick={() => selectFacet(facet.key)}",
)
text = text.replace(
    "<button type=\"button\" onClick={() => open(a.id)}>",
    "<button\n                type=\"button\"\n                aria-current={selected?.id === a.id ? 'page' : undefined}\n                onClick={() => open(a.id)}\n              >",
)
text = text.replace(
    "      <article onClick={onArticleClick} onKeyDown={onArticleKeyDown}>\n        {error && <p role=\"alert\">{error}</p>}",
    "      <article onClick={onArticleClick} onKeyDown={onArticleKeyDown}>\n        <nav className=\"navigation-toolbar\" aria-label=\"閱讀歷史\">\n          <button\n            type=\"button\"\n            aria-label=\"上一個位置\"\n            disabled={!canNavigateBack(navigationHistory)}\n            onClick={() => travelHistory(-1)}\n          >\n            ← 上一頁\n          </button>\n          <span aria-live=\"polite\" data-testid=\"history-position\">\n            {navigationHistory.index + 1} / {navigationHistory.entries.length}\n          </span>\n          <button\n            type=\"button\"\n            aria-label=\"下一個位置\"\n            disabled={!canNavigateForward(navigationHistory)}\n            onClick={() => travelHistory(1)}\n          >\n            下一頁 →\n          </button>\n        </nav>\n        {error && <p role=\"alert\">{error}</p>}",
)
renderer.write_text(text)

style = Path('apps/desktop-electron/src/renderer/style.css')
css = style.read_text()
css += """

.navigation-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.navigation-toolbar button {
  width: auto;
  margin: 0;
  padding: 0.45rem 0.7rem;
}

.navigation-toolbar button:disabled {
  cursor: default;
  opacity: 0.45;
}

.navigation-toolbar span {
  min-width: 4.5rem;
  color: var(--muted);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.article-list button[aria-current='page'] {
  border-color: var(--focus);
  background: var(--selected-bg);
}
"""
style.write_text(css)

adr = Path('project-docs/architecture/adr/0013-renderer-navigation-history.md')
adr.write_text("""---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-adrs:
  - ADR-0001
  - ADR-0012
---

# ADR-0013: Renderer-owned navigation history

## Context

The offline reader could open articles and fragments without leaving the Electron shell, but it had no explicit history model. Browser history is not suitable because the packaged renderer uses one trusted document URL and navigation away from that URL is intentionally blocked.

## Decision

Keep a bounded, renderer-owned stack of semantic locations. Each location contains the selected article and fragment plus the search, browse mode, and selected facet that produced the visible list. Article and fragment navigation push entries; transient search typing replaces the current entry; navigating after Back truncates the forward branch.

Expose Back and Forward controls in the reader and support `Alt+Left` and `Alt+Right`. Applying a location restores list state and loads the article through the existing typed preload API. The BrowserWindow URL, preload surface, IPC channels, filesystem permissions, and external navigation policy remain unchanged.

## Consequences

- Navigation is deterministic and unit-testable without coupling to Chromium history.
- Search and facet context are restored together with article position.
- The stack is capped at 100 entries to avoid unbounded session growth.
- Native menu commands can dispatch the same semantic actions in a later change without owning navigation state.
""")

product = Path('project-docs/product/desktop-product-spec.md')
p = product.read_text()
p = p.replace('persistent theme and text preferences, native packaging', 'persistent theme and text preferences, semantic Back/Forward navigation, native packaging')
p = p.replace("## FR-018\n\nStatus: `planned`. Verification: planned for a later PR.", "## FR-018\n\nStatus: `implemented`. Verification: apps/desktop-electron/src/renderer/navigation-history.test.ts, apps/desktop-electron/e2e/navigation-history.spec.ts.")
product.write_text(p)

requirements = Path('project-docs/traceability/requirements.yaml')
r = requirements.read_text()
r = r.replace("- {id: FR-018, title: FR-018, priority: P2, source: {document: project-docs/product/desktop-product-spec.md, section: FR-018}, implementation: {packages: *p}, verification: {tests: []}, status: planned}", "- {id: FR-018, title: FR-018, priority: P2, source: {document: project-docs/product/desktop-product-spec.md, section: FR-018}, implementation: {packages: *p}, verification: {tests: [apps/desktop-electron/src/renderer/navigation-history.test.ts, apps/desktop-electron/e2e/navigation-history.spec.ts]}, status: implemented}")
requirements.write_text(r)

acceptance = Path('project-docs/quality/acceptance-matrix.md')
a = acceptance.read_text().replace('| FR-018 | planned | planned |', '| FR-018 | implemented | apps/desktop-electron/src/renderer/navigation-history.test.ts, apps/desktop-electron/e2e/navigation-history.spec.ts |')
acceptance.write_text(a)

parity = Path('project-docs/migration/mkdocs-feature-parity-matrix.md')
m = parity.read_text().replace('| Internal links | Markdown | application/renderer | implemented | packages/content-engine/src/index.test.ts; apps/desktop-electron/e2e/source.spec.ts | Same-page and cross-article Unicode fragments remain inside the app shell. |', '| Internal links | Markdown | application/renderer | implemented | packages/content-engine/src/index.test.ts; apps/desktop-electron/e2e/source.spec.ts | Same-page and cross-article Unicode fragments remain inside the app shell. |\n| Reader navigation history | browser navigation | renderer | implemented | apps/desktop-electron/src/renderer/navigation-history.test.ts; apps/desktop-electron/e2e/navigation-history.spec.ts | Semantic Back/Forward restores article, fragment, search, and facet state without changing the trusted renderer URL. |')
parity.write_text(m)
