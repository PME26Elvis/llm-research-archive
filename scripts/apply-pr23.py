from pathlib import Path

renderer = Path('apps/desktop-electron/src/renderer/renderer.tsx')
text = renderer.read_text()
text = text.replace(
    "import { ReaderSettings } from './reader-settings';\nimport { mountSyntaxHighlighting } from './syntax-highlight';",
    "import { ReaderSettings } from './reader-settings';\nimport { ResizableLayout } from './resizable-layout';\nimport { mountSyntaxHighlighting } from './syntax-highlight';",
)
text = text.replace(
    '  return (\n    <main className="app" data-testid="app-ready" data-article-count={articles.length}>\n      <aside>',
    '  return (\n    <>\n      <ResizableLayout\n        articleCount={articles.length}\n        sidebar={\n          <>',
)
text = text.replace(
    '        </ul>\n      </aside>\n      <article onClick={onArticleClick} onKeyDown={onArticleKeyDown}>',
    '        </ul>\n          </>\n        }\n      >\n        <article onClick={onArticleClick} onKeyDown={onArticleKeyDown}>',
)
text = text.replace(
    '      </article>\n      {about && <AboutModal info={about} onClose={closeAbout} />}\n      {lightbox && <ImageLightbox image={lightbox} onClose={closeImageLightbox} />}\n    </main>\n  );',
    '        </article>\n      </ResizableLayout>\n      {about && <AboutModal info={about} onClose={closeAbout} />}\n      {lightbox && <ImageLightbox image={lightbox} onClose={closeImageLightbox} />}\n    </>\n  );',
)
renderer.write_text(text)

style = Path('apps/desktop-electron/src/renderer/style.css')
css = style.read_text()
css = css.replace('  grid-template-columns: 360px 1fr;', '  grid-template-columns: var(--sidebar-width) 6px minmax(0, 1fr);')
css = css.replace('aside {\n  border-right:', 'aside {\n  grid-column: 1;\n  border-right:')
css = css.replace('article {\n  padding:', 'article {\n  flex: 1;\n  min-height: 0;\n  padding:')
css += """

.pane-separator {
  grid-column: 2;
  position: relative;
  z-index: 2;
  cursor: col-resize;
  background: var(--border);
  touch-action: none;
}

.pane-separator::after {
  content: '';
  position: absolute;
  inset: 0 -4px;
}

.pane-separator:hover,
.pane-separator:focus-visible {
  background: var(--accent);
  outline: none;
}

.reader-pane {
  grid-column: 3;
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-toggle {
  align-self: flex-start;
  width: auto;
  margin: 0.55rem 0.75rem 0;
  padding: 0.4rem 0.65rem;
}

.app[data-sidebar-collapsed='true'] {
  grid-template-columns: 0 0 minmax(0, 1fr);
}

body.resizing-sidebar {
  cursor: col-resize;
  user-select: none;
}
"""
css = css.replace(
    "  .app {\n    grid-template-columns: 1fr;",
    "  .app {\n    display: block;",
)
css = css.replace(
    "  aside {\n    max-height:",
    "  aside {\n    max-height:",
)
css += """

@media (max-width: 800px) {
  .pane-separator {
    display: none;
  }

  .reader-pane {
    height: auto;
    min-height: 45vh;
  }
}
"""
style.write_text(css)

main = Path('apps/desktop-electron/src/main/main.ts')
m = main.read_text()
m = m.replace(
    "import { app, BrowserWindow, ipcMain, shell, session, WebContents, WebFrameMain } from 'electron';",
    "import { app, BrowserWindow, ipcMain, screen, shell, session, WebContents, WebFrameMain } from 'electron';",
)
m = m.replace(
    "import { resolveSafeAssetPath } from './asset-path';",
    "import { resolveSafeAssetPath } from './asset-path';\nimport { loadWindowState, saveWindowState } from './window-state';",
)
m = m.replace(
    "  const win = new BrowserWindow({\n    width: 1280,\n    height: 840,",
    "  const windowStateFile = path.join(app.getPath('userData'), 'window-state.json');\n  const windowState = loadWindowState(\n    windowStateFile,\n    screen.getAllDisplays().map((display) => display.workArea),\n  );\n  const win = new BrowserWindow({\n    ...windowState.bounds,\n    minWidth: 800,\n    minHeight: 600,",
)
needle = "  win.webContents.setWindowOpenHandler(({ url }) => {"
insert = "  let windowStateTimer: NodeJS.Timeout | undefined;\n  const persistWindowState = () => {\n    if (windowStateTimer) clearTimeout(windowStateTimer);\n    try {\n      saveWindowState(windowStateFile, {\n        schemaVersion: 1,\n        bounds: win.getNormalBounds(),\n        maximized: win.isMaximized(),\n      });\n    } catch (error) {\n      console.error('window-state-save-failed', error);\n    }\n  };\n  const scheduleWindowState = () => {\n    if (windowStateTimer) clearTimeout(windowStateTimer);\n    windowStateTimer = setTimeout(persistWindowState, 250);\n  };\n  win.on('resize', scheduleWindowState);\n  win.on('move', scheduleWindowState);\n  win.on('close', persistWindowState);\n  if (windowState.maximized) win.maximize();\n\n"
m = m.replace(needle, insert + needle)
main.write_text(m)

adr = Path('project-docs/architecture/adr/0014-persisted-desktop-layout.md')
adr.write_text("""---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-adrs:
  - ADR-0012
  - ADR-0013
---

# ADR-0014: Persisted renderer pane and native window layout

## Context

The desktop reader used a fixed 360 px navigation column and always opened at 1280 × 840. Research archives vary significantly in title length, display size, and preferred reading width. A desktop shell should restore those choices without granting renderer access to native window APIs.

## Decision

Persist renderer pane width and collapsed state in a dedicated versioned localStorage document. Clamp width to 240–620 px and expose a WAI-ARIA separator supporting pointer drag plus Arrow, Home, and End keys.

Persist native BrowserWindow normal bounds and maximized state in an atomic JSON file under Electron `userData`. Validate minimum dimensions, cap dimensions to the primary work area, and recenter windows that no longer overlap an attached display. The renderer receives no new IPC or preload capability.

## Consequences

- Pane and window layout survive a full application restart.
- Corrupt or obsolete state falls back safely.
- Multi-monitor disconnection cannot strand the window off screen.
- Future multi-pane views can reuse the versioned layout boundary without mixing it with reading-theme preferences.
""")

product = Path('project-docs/product/desktop-product-spec.md')
p = product.read_text()
p = p.replace('semantic Back/Forward navigation, native packaging', 'semantic Back/Forward navigation, persistent resizable desktop layout, native packaging')
p = p.replace("## FR-019\n\nStatus: `planned`. Verification: planned for a later PR.", "## FR-019\n\nStatus: `implemented`. Verification: apps/desktop-electron/src/renderer/layout-preferences.test.ts, apps/desktop-electron/src/main/window-state.test.ts, apps/desktop-electron/e2e/resizable-layout.spec.ts.")
product.write_text(p)

requirements = Path('project-docs/traceability/requirements.yaml')
r = requirements.read_text().replace("- {id: FR-019, title: FR-019, priority: P2, source: {document: project-docs/product/desktop-product-spec.md, section: FR-019}, implementation: {packages: *p}, verification: {tests: []}, status: planned}", "- {id: FR-019, title: FR-019, priority: P2, source: {document: project-docs/product/desktop-product-spec.md, section: FR-019}, implementation: {packages: *p}, verification: {tests: [apps/desktop-electron/src/renderer/layout-preferences.test.ts, apps/desktop-electron/src/main/window-state.test.ts, apps/desktop-electron/e2e/resizable-layout.spec.ts]}, status: implemented}")
requirements.write_text(r)

acceptance = Path('project-docs/quality/acceptance-matrix.md')
a = acceptance.read_text().replace('| FR-019 | planned | planned |', '| FR-019 | implemented | apps/desktop-electron/src/renderer/layout-preferences.test.ts, apps/desktop-electron/src/main/window-state.test.ts, apps/desktop-electron/e2e/resizable-layout.spec.ts |')
acceptance.write_text(a)

parity = Path('project-docs/migration/mkdocs-feature-parity-matrix.md')
q = parity.read_text() + '\n| Persistent desktop layout | fixed browser viewport | main/renderer | implemented | apps/desktop-electron/src/main/window-state.test.ts; apps/desktop-electron/e2e/resizable-layout.spec.ts | Accessible pane resizing/collapse and validated native window bounds survive restart. |\n'
parity.write_text(q)
