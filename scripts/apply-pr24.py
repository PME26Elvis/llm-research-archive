from pathlib import Path

contracts = Path('packages/platform-contracts/src/index.ts')
c = contracts.read_text()
c = c.replace(
    "export const ArticleListResponseSchema = z.array(ArticleSummaryDtoSchema);",
    "export const DesktopCommandSchema = z.enum([\n  'palette.open',\n  'search.focus',\n  'navigation.back',\n  'navigation.forward',\n  'about.open',\n]);\nexport const ArticleListResponseSchema = z.array(ArticleSummaryDtoSchema);",
)
c = c.replace(
    "export type ArticleSummaryDto = z.infer<typeof ArticleSummaryDtoSchema>;",
    "export type DesktopCommand = z.infer<typeof DesktopCommandSchema>;\nexport type ArticleSummaryDto = z.infer<typeof ArticleSummaryDtoSchema>;",
)
contracts.write_text(c)

preload = Path('apps/desktop-electron/src/main/preload.ts')
p = preload.read_text()
p = p.replace(
    "  AppInfoResponseSchema,\n  type AppInfoDto,",
    "  AppInfoResponseSchema,\n  DesktopCommandSchema,\n  type AppInfoDto,",
)
p = p.replace(
    "  type SearchResultDto,\n} from '@research-observatory/platform-contracts';",
    "  type SearchResultDto,\n  type DesktopCommand,\n} from '@research-observatory/platform-contracts';",
)
p = p.replace(
    "  openExternal: (url: string) => ipcRenderer.invoke('external:open', url),\n});",
    "  openExternal: (url: string) => ipcRenderer.invoke('external:open', url),\n  onCommand: (listener: (command: DesktopCommand) => void) => {\n    ipcRenderer.removeAllListeners('app:command');\n    ipcRenderer.on('app:command', (_event, value) => {\n      const command = DesktopCommandSchema.safeParse(value);\n      if (command.success) listener(command.data);\n    });\n  },\n  clearCommandHandler: () => ipcRenderer.removeAllListeners('app:command'),\n});",
)
preload.write_text(p)

main = Path('apps/desktop-electron/src/main/main.ts')
m = main.read_text()
m = m.replace(
    "import { app, BrowserWindow, ipcMain, screen, shell, session, WebContents, WebFrameMain } from 'electron';",
    "import { app, BrowserWindow, ipcMain, Menu, screen, shell, session, WebContents, WebFrameMain, type MenuItemConstructorOptions } from 'electron';",
)
m = m.replace(
    "  AppInfoResponseSchema,\n} from '@research-observatory/platform-contracts';",
    "  AppInfoResponseSchema,\n  DesktopCommandSchema,\n  type DesktopCommand,\n} from '@research-observatory/platform-contracts';",
)
marker = "function createWindow() {"
menu = "function installApplicationMenu(win: BrowserWindow): void {\n  const send = (command: DesktopCommand) =>\n    win.webContents.send('app:command', DesktopCommandSchema.parse(command));\n  const template: MenuItemConstructorOptions[] = [\n    {\n      label: '導覽',\n      submenu: [\n        { label: '上一個閱讀位置', click: () => send('navigation.back') },\n        { label: '下一個閱讀位置', click: () => send('navigation.forward') },\n        { type: 'separator' },\n        { label: '聚焦搜尋', accelerator: 'CmdOrCtrl+F', click: () => send('search.focus') },\n      ],\n    },\n    {\n      label: '檢視',\n      submenu: [\n        { label: '指令面板', accelerator: 'CmdOrCtrl+K', click: () => send('palette.open') },\n      ],\n    },\n    {\n      label: '說明',\n      submenu: [{ label: '關於 Research Observatory', click: () => send('about.open') }],\n    },\n  ];\n  Menu.setApplicationMenu(Menu.buildFromTemplate(template));\n}\n\n"
m = m.replace(marker, menu + marker)
m = m.replace(
    "  if (windowState.maximized) win.maximize();\n\n  win.webContents.setWindowOpenHandler",
    "  if (windowState.maximized) win.maximize();\n  installApplicationMenu(win);\n\n  win.webContents.setWindowOpenHandler",
)
main.write_text(m)

renderer = Path('apps/desktop-electron/src/renderer/renderer.tsx')
r = renderer.read_text()
r = r.replace(
    "  SearchResultDto,\n} from '@research-observatory/platform-contracts';",
    "  SearchResultDto,\n  DesktopCommand,\n} from '@research-observatory/platform-contracts';",
)
r = r.replace(
    "import { copyText } from './copy-code';",
    "import { CommandPalette } from './command-palette';\nimport { copyText } from './copy-code';",
)
r = r.replace(
    "      openExternal(url: string): Promise<void>;",
    "      openExternal(url: string): Promise<void>;\n      onCommand(listener: (command: DesktopCommand) => void): void;\n      clearCommandHandler(): void;",
)
r = r.replace(
    "  const [navigationHistory, setNavigationHistory] = useState(createNavigationHistory);\n  const aboutButtonRef",
    "  const [navigationHistory, setNavigationHistory] = useState(createNavigationHistory);\n  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);\n  const searchInputRef = useRef<HTMLInputElement>(null);\n  const aboutButtonRef",
)
travel = "  function travelHistory(delta: -1 | 1) {\n    const next = moveNavigation(navigationHistory, delta);\n    if (next === navigationHistory) return;\n    setNavigationHistory(next);\n    void applyNavigation(currentNavigationLocation(next));\n  }\n"
execute = travel + "\n  function executeDesktopCommand(command: DesktopCommand) {\n    if (command === 'palette.open') {\n      setCommandPaletteOpen(true);\n    } else if (command === 'search.focus') {\n      searchInputRef.current?.focus();\n      searchInputRef.current?.select();\n    } else if (command === 'navigation.back') {\n      travelHistory(-1);\n    } else if (command === 'navigation.forward') {\n      travelHistory(1);\n    } else if (command === 'about.open') {\n      void openAbout();\n    }\n  }\n"
if travel not in r:
    raise SystemExit('travel history marker missing')
r = r.replace(travel, execute)
load_marker = "  useEffect(() => {\n    window.observatory\n      .listArticles()"
commands_effect = "  useEffect(() => {\n    window.observatory.onCommand(executeDesktopCommand);\n    const onShortcut = (event: KeyboardEvent) => {\n      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;\n      if (event.key.toLocaleLowerCase() === 'k') {\n        event.preventDefault();\n        executeDesktopCommand('palette.open');\n      } else if (event.key.toLocaleLowerCase() === 'f') {\n        event.preventDefault();\n        executeDesktopCommand('search.focus');\n      }\n    };\n    document.addEventListener('keydown', onShortcut);\n    return () => {\n      document.removeEventListener('keydown', onShortcut);\n      window.observatory.clearCommandHandler();\n    };\n  }, [navigationHistory, selected, query, browseMode, selectedFacet]);\n\n"
if load_marker not in r:
    raise SystemExit('list effect marker missing')
r = r.replace(load_marker, commands_effect + load_marker)
r = r.replace(
    "          <input\n            aria-label=\"搜尋文章\"",
    "          <input\n            ref={searchInputRef}\n            aria-label=\"搜尋文章\"",
)
r = r.replace(
    "      {about && <AboutModal info={about} onClose={closeAbout} />}",
    "      <CommandPalette\n        open={commandPaletteOpen}\n        onClose={() => setCommandPaletteOpen(false)}\n        onExecute={executeDesktopCommand}\n      />\n      {about && <AboutModal info={about} onClose={closeAbout} />}",
)
renderer.write_text(r)

style = Path('apps/desktop-electron/src/renderer/style.css')
s = style.read_text() + """

.command-palette {
  width: min(92vw, 680px);
  padding: 1rem;
}

.command-palette h2 {
  margin: 0 0 0.75rem;
}

.command-results {
  display: grid;
  gap: 0.35rem;
  max-height: min(55vh, 420px);
  overflow: auto;
}

.command-results button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 0;
}

.command-results button[aria-selected='true'] {
  border-color: var(--accent);
  background: var(--surface-selected);
}

.command-results kbd {
  color: var(--text-muted);
  font: inherit;
  font-size: 0.85rem;
}
"""
style.write_text(s)

adr = Path('project-docs/architecture/adr/0015-typed-desktop-command-routing.md')
adr.write_text("""---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-adrs:
  - ADR-0013
  - ADR-0014
---

# ADR-0015: Typed desktop command routing

## Context

Native menus, keyboard shortcuts, and a command palette must invoke the same application behavior. Passing arbitrary strings or Electron objects through preload would create multiple inconsistent command paths and expand the renderer capability surface.

## Decision

Define a finite `DesktopCommandSchema` in platform contracts. The main process builds the native menu from known IDs and sends only the `app:command` event. Preload validates every incoming value and ignores unknown IDs before invoking one registered renderer handler. Renderer keyboard shortcuts and the command palette execute the same typed IDs.

The initial catalog covers command-palette opening, search focus, semantic navigation Back/Forward, and About. Workspace commands are intentionally deferred until the workspace boundary exists.

## Consequences

- Native menu, shortcuts, and palette cannot drift into separate implementations.
- Unknown command strings cannot trigger arbitrary renderer actions.
- The preload surface adds one fixed event channel, not a generic IPC bridge.
- Future commands require an explicit contract, catalog entry, implementation, and tests.
""")

product = Path('project-docs/product/desktop-product-spec.md')
t = product.read_text()
t = t.replace('persistent resizable desktop layout, native packaging', 'persistent resizable desktop layout, typed native commands and command palette, native packaging')
t = t.replace("## FR-020\n\nStatus: `planned`. Verification: planned for a later PR.", "## FR-020\n\nStatus: `implemented`. Verification: packages/platform-contracts/src/desktop-command.test.ts, apps/desktop-electron/src/renderer/desktop-commands.test.ts, apps/desktop-electron/e2e/command-palette.spec.ts.")
product.write_text(t)

requirements = Path('project-docs/traceability/requirements.yaml')
u = requirements.read_text().replace("- {id: FR-020, title: FR-020, priority: P2, source: {document: project-docs/product/desktop-product-spec.md, section: FR-020}, implementation: {packages: *p}, verification: {tests: []}, status: planned}", "- {id: FR-020, title: FR-020, priority: P2, source: {document: project-docs/product/desktop-product-spec.md, section: FR-020}, implementation: {packages: *p}, verification: {tests: [packages/platform-contracts/src/desktop-command.test.ts, apps/desktop-electron/src/renderer/desktop-commands.test.ts, apps/desktop-electron/e2e/command-palette.spec.ts]}, status: implemented}")
requirements.write_text(u)

acceptance = Path('project-docs/quality/acceptance-matrix.md')
v = acceptance.read_text().replace('| FR-020 | planned | planned |', '| FR-020 | implemented | packages/platform-contracts/src/desktop-command.test.ts, apps/desktop-electron/src/renderer/desktop-commands.test.ts, apps/desktop-electron/e2e/command-palette.spec.ts |')
acceptance.write_text(v)

parity = Path('project-docs/migration/mkdocs-feature-parity-matrix.md')
w = parity.read_text() + '\n| Native commands and palette | browser shortcuts | main/preload/renderer | implemented | packages/platform-contracts/src/desktop-command.test.ts; apps/desktop-electron/e2e/command-palette.spec.ts | One typed allowlist drives menu, shortcuts, preload delivery, and the accessible command palette. |\n'
parity.write_text(w)
