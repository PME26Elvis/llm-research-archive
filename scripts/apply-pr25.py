from pathlib import Path

# Content engine: add a secure diagnostic scan and route manifests through it.
content = Path('packages/content-engine/src/index.ts')
c = content.read_text()
c = c.replace(
    "export function createManifest(root: string) {\n  const articles = scanArchive(root);",
    "export function createManifest(root: string) {\n  const articles = scanArchiveWithDiagnostics(root).articles;",
)
append_marker = "export function createManifest(root: string)"
if 'export function scanArchiveWithDiagnostics' not in c:
    diagnostic_code = r'''

export interface ArchiveDiagnostics {
  warnings: string[];
  invalidFiles: string[];
  brokenLinks: string[];
  missingAssets: string[];
}

export interface ArchiveScanResult {
  articles: Article[];
  diagnostics: ArchiveDiagnostics;
}

function isInsideRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export function scanArchiveWithDiagnostics(root: string): ArchiveScanResult {
  const realRoot = fs.realpathSync(root);
  const files: string[] = [];
  const diagnostics: ArchiveDiagnostics = {
    warnings: [],
    invalidFiles: [],
    brokenLinks: [],
    missingAssets: [],
  };

  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      const relative = path.relative(realRoot, full).split(path.sep).join('/');
      const stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) {
        diagnostics.warnings.push(`${relative}: symlink skipped`);
        continue;
      }
      if (stat.isDirectory()) {
        visit(full);
        continue;
      }
      if (!stat.isFile() || !entry.name.endsWith('.md')) continue;
      const realFile = fs.realpathSync(full);
      if (!isInsideRoot(realRoot, realFile)) {
        diagnostics.warnings.push(`${relative}: path escaped workspace root`);
        continue;
      }
      files.push(realFile);
    }
  };

  visit(realRoot);
  const articles: Article[] = [];
  for (const file of files.sort()) {
    try {
      const article = parseArticle(file, realRoot);
      if (article) articles.push(article);
    } catch {
      diagnostics.invalidFiles.push(path.relative(realRoot, file).split(path.sep).join('/'));
    }
  }

  const articleIds = new Set(articles.map((article) => article.id));
  for (const article of articles) {
    for (const link of article.links) {
      if (link.internal && link.targetArticleId && !articleIds.has(link.targetArticleId)) {
        diagnostics.brokenLinks.push(`${article.sourcePath}: ${link.href}`);
      }
    }
    const sourceDirectory = path.dirname(path.join(realRoot, article.sourcePath));
    for (const match of article.markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
      const raw = match[1].trim().replace(/^<|>$/g, '').split(/\s+["']/)[0];
      if (!raw || /^(?:https?:|data:|app-asset:|#)/i.test(raw)) continue;
      const asset = path.resolve(sourceDirectory, raw);
      if (!isInsideRoot(realRoot, asset) || !fs.existsSync(asset)) {
        diagnostics.missingAssets.push(`${article.sourcePath}: ${raw}`);
      }
    }
  }

  diagnostics.warnings.sort();
  diagnostics.invalidFiles.sort();
  diagnostics.brokenLinks.sort();
  diagnostics.missingAssets.sort();
  return { articles, diagnostics };
}
'''
    c = c.replace(f"\n{append_marker}", diagnostic_code + f"\n{append_marker}")
content.write_text(c)

# Application: cache a secure snapshot so switching a workspace rebuilds every read model atomically.
application = Path('packages/application/src/index.ts')
a = application.read_text()
a = a.replace(
    "import { createManifest, scanArchive } from '@research-observatory/content-engine';",
    "import { createManifest, scanArchiveWithDiagnostics } from '@research-observatory/content-engine';",
)
a = a.replace(
    "export class ResearchObservatoryApp {\n  constructor(private root: string) {}\n  listArticles(): Article[] {\n    return scanArchive(this.root);\n  }",
    "export class ResearchObservatoryApp {\n  private articles: Article[] = [];\n  private archiveDiagnostics = { warnings: [] as string[], invalidFiles: [] as string[], brokenLinks: [] as string[], missingAssets: [] as string[] };\n\n  constructor(private root: string) {\n    this.reload(root);\n  }\n\n  reload(root = this.root): void {\n    const snapshot = scanArchiveWithDiagnostics(root);\n    this.root = root;\n    this.articles = snapshot.articles;\n    this.archiveDiagnostics = snapshot.diagnostics;\n  }\n\n  listArticles(): Article[] {\n    return this.articles;\n  }",
)
a = a.replace(
    "  diagnostics() {\n    return { invalidFiles: [], brokenLinks: [], missingAssets: [] };\n  }",
    "  diagnostics() {\n    return this.archiveDiagnostics;\n  }",
)
application.write_text(a)

# Platform contracts.
contracts = Path('packages/platform-contracts/src/index.ts')
p = contracts.read_text()
p = p.replace("  'about.open',\n]);", "  'about.open',\n  'workspace.open',\n]);")
workspace_contracts = """
export const WorkspaceInfoSchema = z.object({
  kind: z.enum(['bundled', 'local']),
  rootPath: z.string().min(1),
  displayName: z.string().min(1),
  articleCount: z.number().int().nonnegative(),
  warnings: z.array(z.string()),
  invalidFiles: z.array(z.string()),
});
export const WorkspaceSelectionResultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('cancelled') }),
  z.object({ status: z.literal('selected'), workspace: WorkspaceInfoSchema }),
  z.object({ status: z.literal('rejected'), message: z.string().min(1) }),
]);
"""
p = p.replace("export const ArticleListResponseSchema", workspace_contracts + "export const ArticleListResponseSchema")
p = p.replace(
    "export type DesktopCommand = z.infer<typeof DesktopCommandSchema>;",
    "export type DesktopCommand = z.infer<typeof DesktopCommandSchema>;\nexport type WorkspaceInfoDto = z.infer<typeof WorkspaceInfoSchema>;\nexport type WorkspaceSelectionResult = z.infer<typeof WorkspaceSelectionResultSchema>;",
)
contracts.write_text(p)

# Preload exposes fixed typed workspace operations only.
preload = Path('apps/desktop-electron/src/preload/preload.ts')
q = preload.read_text()
q = q.replace(
    "  DesktopCommandSchema,\n  type AppInfoDto,",
    "  DesktopCommandSchema,\n  WorkspaceInfoSchema,\n  WorkspaceSelectionResultSchema,\n  type AppInfoDto,",
)
q = q.replace(
    "  type DesktopCommand,\n} from '@research-observatory/platform-contracts';",
    "  type DesktopCommand,\n  type WorkspaceInfoDto,\n  type WorkspaceSelectionResult,\n} from '@research-observatory/platform-contracts';",
)
q = q.replace(
    "  openExternal: (url: string) => ipcRenderer.invoke('external:open', url),",
    "  openExternal: (url: string) => ipcRenderer.invoke('external:open', url),\n  workspaceInfo: async (): Promise<WorkspaceInfoDto> =>\n    WorkspaceInfoSchema.parse(await ipcRenderer.invoke('workspace:info')),\n  selectWorkspace: async (): Promise<WorkspaceSelectionResult> =>\n    WorkspaceSelectionResultSchema.parse(await ipcRenderer.invoke('workspace:select')),
",
)
preload.write_text(q)

# Main process: active root, persistence, native chooser, recovery, and active-root assets.
main = Path('apps/desktop-electron/src/main/main.ts')
m = main.read_text()
m = m.replace("  BrowserWindow,\n  ipcMain,", "  BrowserWindow,\n  dialog,\n  ipcMain,")
m = m.replace(
    "import { loadWindowState, saveWindowState } from './window-state';",
    "import { loadWindowState, saveWindowState } from './window-state';\nimport {\n  DEFAULT_WORKSPACE_STATE,\n  loadWorkspaceState,\n  saveWorkspaceState,\n  validateWorkspaceRoot,\n} from './workspace-state';",
)
m = m.replace(
    "  DesktopCommandSchema,\n  type DesktopCommand,",
    "  DesktopCommandSchema,\n  WorkspaceInfoSchema,\n  WorkspaceSelectionResultSchema,\n  type DesktopCommand,\n  type WorkspaceInfoDto,",
)
m = m.replace(
    "let core: ResearchObservatoryApp;\nlet trustedRendererUrl",
    "let core: ResearchObservatoryApp;\nlet activeContentRoot = '';\nlet activeWorkspace: WorkspaceInfoDto;\nlet workspaceRecoveryWarnings: string[] = [];\nlet trustedRendererUrl",
)
m = m.replace(
    "function contentRoot(): string {\n  if (!app.isPackaged)\n    return process.env.ARCHIVE_CONTENT_ROOT || path.resolve(__dirname, '../../docs');\n  return path.join(process.resourcesPath, 'docs');\n}\nasync function safeAssetPath(rawUrl: string): Promise<string | undefined> {\n  return resolveSafeAssetPath(contentRoot(), rawUrl);\n}",
    "function bundledContentRoot(): string {\n  if (!app.isPackaged) return process.env.ARCHIVE_CONTENT_ROOT || path.resolve(__dirname, '../../docs');\n  return path.join(process.resourcesPath, 'docs');\n}\nfunction contentRoot(): string {\n  return activeContentRoot || bundledContentRoot();\n}\nfunction workspaceInfo(kind: 'bundled' | 'local', rootPath: string): WorkspaceInfoDto {\n  const diagnostics = core.diagnostics();\n  return WorkspaceInfoSchema.parse({\n    kind,\n    rootPath,\n    displayName: kind === 'bundled' ? '內建封存' : path.basename(rootPath),\n    articleCount: core.listArticles().length,\n    warnings: [...workspaceRecoveryWarnings, ...diagnostics.warnings, ...diagnostics.brokenLinks, ...diagnostics.missingAssets],\n    invalidFiles: diagnostics.invalidFiles,\n  });\n}\nfunction activateWorkspace(rootPath: string, kind: 'bundled' | 'local'): WorkspaceInfoDto {\n  activeContentRoot = rootPath;\n  core = new ResearchObservatoryApp(rootPath);\n  activeWorkspace = workspaceInfo(kind, rootPath);\n  return activeWorkspace;\n}\nfunction initializeWorkspace(): void {\n  workspaceRecoveryWarnings = [];\n  const bundled = bundledContentRoot();\n  if (process.env.ARCHIVE_CONTENT_ROOT) {\n    const selected = validateWorkspaceRoot(path.resolve(process.env.ARCHIVE_CONTENT_ROOT));\n    activateWorkspace(selected.rootPath, 'local');\n    return;\n  }\n  const stateFile = path.join(app.getPath('userData'), 'workspace-state.json');\n  const persisted = loadWorkspaceState(stateFile);\n  if (persisted.rootPath) {\n    try {\n      const selected = validateWorkspaceRoot(persisted.rootPath);\n      activateWorkspace(selected.rootPath, 'local');\n      return;\n    } catch {\n      workspaceRecoveryWarnings.push('先前工作區無法使用，已回復內建封存');\n      saveWorkspaceState(stateFile, DEFAULT_WORKSPACE_STATE);\n    }\n  }\n  activateWorkspace(bundled, 'bundled');\n}\nasync function safeAssetPath(rawUrl: string): Promise<string | undefined> {\n  return resolveSafeAssetPath(contentRoot(), rawUrl);\n}",
)
m = m.replace(
    "        { label: '聚焦搜尋', accelerator: 'CmdOrCtrl+F', click: () => send('search.focus') },",
    "        { label: '聚焦搜尋', accelerator: 'CmdOrCtrl+F', click: () => send('search.focus') },\n        { label: '開啟本機工作區', accelerator: 'CmdOrCtrl+O', click: () => send('workspace.open') },",
)
m = m.replace("function createWindow() {\n  core = new ResearchObservatoryApp(contentRoot());", "function createWindow() {\n  initializeWorkspace();")
m = m.replace(
    "ipcMain.handle('diagnostics:get', (event) => {",
    "ipcMain.handle('workspace:info', (event) => {\n  validateSender(event.sender, event.senderFrame);\n  return WorkspaceInfoSchema.parse(activeWorkspace);\n});\nipcMain.handle('workspace:select', async (event) => {\n  validateSender(event.sender, event.senderFrame);\n  const owner = BrowserWindow.fromWebContents(event.sender) ?? undefined;\n  const selection = await dialog.showOpenDialog(owner, {\n    title: '選擇 Research Observatory 工作區',\n    properties: ['openDirectory'],\n  });\n  if (selection.canceled || !selection.filePaths[0]) {\n    return WorkspaceSelectionResultSchema.parse({ status: 'cancelled' });\n  }\n  try {\n    workspaceRecoveryWarnings = [];\n    const selected = validateWorkspaceRoot(selection.filePaths[0]);\n    const workspace = activateWorkspace(selected.rootPath, 'local');\n    saveWorkspaceState(path.join(app.getPath('userData'), 'workspace-state.json'), {\n      schemaVersion: 1,\n      rootPath: selected.rootPath,\n    });\n    return WorkspaceSelectionResultSchema.parse({ status: 'selected', workspace });\n  } catch (error) {\n    return WorkspaceSelectionResultSchema.parse({\n      status: 'rejected',\n      message: `無法開啟工作區：${error instanceof Error ? error.message : String(error)}`,\n    });\n  }\n});\nipcMain.handle('diagnostics:get', (event) => {",
)
main.write_text(m)

# Command catalog.
commands = Path('apps/desktop-electron/src/renderer/desktop-commands.ts')
d = commands.read_text()
d = d.replace(
    "  {\n    id: 'about.open',",
    "  {\n    id: 'workspace.open',\n    label: '開啟本機工作區',\n    keywords: ['workspace', 'folder', 'archive', '工作區', '資料夾', '封存'],\n    shortcut: 'Ctrl+O',\n  },\n  {\n    id: 'about.open',",
)
commands.write_text(d)

# Renderer integration.
renderer = Path('apps/desktop-electron/src/renderer/renderer.tsx')
r = renderer.read_text()
r = r.replace(
    "  DesktopCommand,\n} from '@research-observatory/platform-contracts';",
    "  DesktopCommand,\n  WorkspaceInfoDto,\n  WorkspaceSelectionResult,\n} from '@research-observatory/platform-contracts';",
)
r = r.replace(
    "      clearCommandHandler(): void;",
    "      clearCommandHandler(): void;\n      workspaceInfo(): Promise<WorkspaceInfoDto>;\n      selectWorkspace(): Promise<WorkspaceSelectionResult>;\n      diagnostics(): Promise<{ warnings: string[]; invalidFiles: string[]; brokenLinks: string[]; missingAssets: string[] }>;",
)
r = r.replace(
    "  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);",
    "  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);\n  const [workspace, setWorkspace] = useState<WorkspaceInfoDto | null>(null);",
)
workspace_functions = """
  async function refreshWorkspace(nextWorkspace?: WorkspaceInfoDto) {
    setLoading(true);
    setError('');
    try {
      const [nextArticles, info] = await Promise.all([
        window.observatory.listArticles(),
        nextWorkspace ? Promise.resolve(nextWorkspace) : window.observatory.workspaceInfo(),
      ]);
      setWorkspace(info);
      setArticles(nextArticles);
      setShown(nextArticles);
      setSelected(null);
      setQuery('');
      setBrowseMode('all');
      setSelectedFacet('');
      setNavigationHistory(createNavigationHistory());
    } catch (error) {
      setError(`工作區重新載入失敗：${String(error)}`);
    } finally {
      setLoading(false);
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

"""
r = r.replace("  function executeDesktopCommand(command: DesktopCommand) {", workspace_functions + "  function executeDesktopCommand(command: DesktopCommand) {")
r = r.replace(
    "    } else if (command === 'about.open') {\n      void openAbout();",
    "    } else if (command === 'workspace.open') {\n      void chooseWorkspace();\n    } else if (command === 'about.open') {\n      void openAbout();",
)
r = r.replace(
    "      } else if (event.key.toLocaleLowerCase() === 'f') {\n        event.preventDefault();\n        executeDesktopCommand('search.focus');\n      }",
    "      } else if (event.key.toLocaleLowerCase() === 'f') {\n        event.preventDefault();\n        executeDesktopCommand('search.focus');\n      } else if (event.key.toLocaleLowerCase() === 'o') {\n        event.preventDefault();\n        executeDesktopCommand('workspace.open');\n      }",
)
r = r.replace(
    "  useEffect(() => {\n    window.observatory\n      .listArticles()\n      .then((a) => {\n        setArticles(a);\n        setShown(a);\n      })\n      .catch((e) => setError(String(e)))\n      .finally(() => setLoading(false));\n  }, []);",
    "  useEffect(() => {\n    void refreshWorkspace();\n  }, []);",
)
r = r.replace(
    "                <ReaderSettings />",
    "                <ReaderSettings />",
)
r = r.replace(
    "            </div>\n            <label>\n              搜尋文章",
    "            </div>\n            {workspace && (\n              <section className=\"workspace-panel\" aria-label=\"目前工作區\">\n                <div>\n                  <strong data-testid=\"workspace-kind\">\n                    {workspace.kind === 'local' ? '本機工作區' : '內建封存'}\n                  </strong>\n                  <small data-testid=\"workspace-path\" title={workspace.rootPath}>\n                    {workspace.displayName}\n                  </small>\n                </div>\n                <button type=\"button\" onClick={() => void chooseWorkspace()}>\n                  開啟資料夾\n                </button>\n                {(workspace.warnings.length > 0 || workspace.invalidFiles.length > 0) && (\n                  <details data-testid=\"workspace-diagnostics\" open>\n                    <summary>工作區診斷</summary>\n                    <ul>\n                      {[...workspace.warnings, ...workspace.invalidFiles].map((message) => (\n                        <li key={message}>{message}</li>\n                      ))}\n                    </ul>\n                  </details>\n                )}\n              </section>\n            )}\n            <label>\n              搜尋文章",
)
r = r.replace("              <input\n                aria-label=\"搜尋文章\"", "              <input\n                ref={searchInputRef}\n                aria-label=\"搜尋文章\"")
renderer.write_text(r)

# CSS.
style = Path('apps/desktop-electron/src/renderer/style.css')
s = style.read_text() + """

.workspace-panel {
  display: grid;
  gap: 0.55rem;
  margin-bottom: 0.85rem;
  padding: 0.7rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-subtle);
}

.workspace-panel > div {
  min-width: 0;
}

.workspace-panel small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-panel button {
  margin: 0;
}

.workspace-panel details {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.workspace-panel ul {
  margin: 0.45rem 0 0;
  padding-left: 1.2rem;
  overflow-wrap: anywhere;
}
"""
style.write_text(s)

# ADR and traceability.
adr = Path('project-docs/architecture/adr/0016-main-owned-local-workspaces.md')
adr.write_text("""---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-adrs:
  - ADR-0001
  - ADR-0015
---

# ADR-0016: Main-owned local workspace boundary

## Context

The packaged reader previously opened only bundled content or a development-only environment root. Users need to choose a local archive, keep it across restarts, recover from moved folders, and diagnose individual bad files without exposing arbitrary filesystem access to the renderer.

## Decision

The Electron main process exclusively owns workspace paths. A native directory chooser returns no path argument from renderer code. Main resolves the selected root with `realpath`, requires an absolute readable directory with at least one valid formal article, persists the root atomically under `userData`, and rebuilds the complete application snapshot before returning a typed workspace result.

The content engine performs a diagnostic scan: symlinks and path escapes are skipped, malformed articles are isolated, and broken internal links or missing local assets are reported. The active root also drives the existing `app-asset` resolver. If a persisted workspace is missing or invalid at startup, the app clears it and falls back to bundled content with a visible recovery warning.

## Consequences

- Renderer gains fixed `workspaceInfo` and `selectWorkspace` methods, not a generic path or filesystem API.
- One bad article cannot prevent valid content from loading.
- Search, manifest, diagnostics, article list, and local assets switch atomically to the new root.
- Symlinked content is deliberately unsupported until a more granular trust policy is designed.
""")

product = Path('project-docs/product/desktop-product-spec.md')
t = product.read_text()
t = t.replace('typed native commands and command palette, native packaging', 'typed native commands and command palette, persistent validated local workspaces, native packaging')
t = t.replace("## FR-021\n\nStatus: `planned`. Verification: planned for a later PR.", "## FR-021\n\nStatus: `implemented`. Verification: packages/content-engine/src/index.test.ts, apps/desktop-electron/src/main/workspace-state.test.ts, packages/platform-contracts/src/workspace-contract.test.ts, apps/desktop-electron/e2e/local-workspace.spec.ts.")
product.write_text(t)

requirements = Path('project-docs/traceability/requirements.yaml')
u = requirements.read_text().replace("- {id: FR-021, title: FR-021, priority: P2, source: {document: project-docs/product/desktop-product-spec.md, section: FR-021}, implementation: {packages: *p}, verification: {tests: []}, status: planned}", "- {id: FR-021, title: FR-021, priority: P2, source: {document: project-docs/product/desktop-product-spec.md, section: FR-021}, implementation: {packages: *p}, verification: {tests: [packages/content-engine/src/index.test.ts, apps/desktop-electron/src/main/workspace-state.test.ts, packages/platform-contracts/src/workspace-contract.test.ts, apps/desktop-electron/e2e/local-workspace.spec.ts]}, status: implemented}")
requirements.write_text(u)

acceptance = Path('project-docs/quality/acceptance-matrix.md')
v = acceptance.read_text().replace('| FR-021 | planned | planned |', '| FR-021 | implemented | packages/content-engine/src/index.test.ts, apps/desktop-electron/src/main/workspace-state.test.ts, packages/platform-contracts/src/workspace-contract.test.ts, apps/desktop-electron/e2e/local-workspace.spec.ts |')
acceptance.write_text(v)

parity = Path('project-docs/migration/mkdocs-feature-parity-matrix.md')
w = parity.read_text() + '\n| Local workspace selection | static site root | main/preload/application/content-engine | implemented | apps/desktop-electron/src/main/workspace-state.test.ts; apps/desktop-electron/e2e/local-workspace.spec.ts | Native folder selection, persisted recent workspace, diagnostics, bad-file isolation, and bundled fallback without renderer filesystem access. |\n'
parity.write_text(w)
