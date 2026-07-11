from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'missing marker: {label}')
    return text.replace(old, new, 1)


# Content engine: diagnostic scan with symlink/path isolation and deterministic results.
content = Path('packages/content-engine/src/index.ts')
c = content.read_text()
scan_start = c.index("export function scanArchive(root = 'docs')")
manifest_start = c.index("export function createManifest(root = 'docs')")
diagnostic_scan = r'''export interface ArchiveDiagnostics {
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
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

export function scanArchiveWithDiagnostics(root = 'docs'): ArchiveScanResult {
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
  articles.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

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

export function scanArchive(root = 'docs'): Article[] {
  return scanArchiveWithDiagnostics(root).articles;
}

'''
c = c[:scan_start] + diagnostic_scan + c[manifest_start:]
c = replace_once(
    c,
    "export function createManifest(root = 'docs'): ArchiveManifestV1 {\n  const articles = scanArchive(root);",
    "export function createManifest(root = 'docs'): ArchiveManifestV1 {\n  const articles = scanArchiveWithDiagnostics(root).articles;",
    'content manifest scan',
)
content.write_text(c)

# Application: one cached article/diagnostic snapshot per active root.
Path('packages/application/src/index.ts').write_text("""import { createManifest, scanArchiveWithDiagnostics, type ArchiveDiagnostics } from '@research-observatory/content-engine';
import type { Article } from '@research-observatory/domain';
import { searchArticles } from '@research-observatory/search-engine';

export class ResearchObservatoryApp {
  private articles: Article[] = [];
  private archiveDiagnostics: ArchiveDiagnostics = {
    warnings: [],
    invalidFiles: [],
    brokenLinks: [],
    missingAssets: [],
  };

  constructor(private root = 'docs') {
    this.reload(root);
  }

  reload(root = this.root): void {
    const snapshot = scanArchiveWithDiagnostics(root);
    this.root = root;
    this.articles = snapshot.articles;
    this.archiveDiagnostics = snapshot.diagnostics;
  }

  listArticles(): Article[] {
    return this.articles;
  }

  getArticle(id: string): Article {
    const article = this.articles.find((candidate) => candidate.id === id);
    if (!article) throw new Error('article-not-found');
    return article;
  }

  search(query: string) {
    return searchArticles(this.articles, query);
  }

  manifest() {
    return createManifest(this.root);
  }

  diagnostics() {
    return { validArticles: this.articles.length, ...this.archiveDiagnostics };
  }

  importPreview(sourceMarkdown: string) {
    return {
      title: sourceMarkdown.match(/^#\\s+(.+)$/m)?.[1] || 'Untitled',
      warnings: [],
      files: ['index.md'],
    };
  }
}
""")

# Platform contracts.
contracts = Path('packages/platform-contracts/src/index.ts')
p = contracts.read_text()
p = replace_once(p, "  'about.open',\n]);", "  'about.open',\n  'workspace.open',\n]);", 'workspace command')
workspace_contracts = """export const WorkspaceInfoSchema = z.object({
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
p = replace_once(p, 'export const ArticleListResponseSchema', workspace_contracts + 'export const ArticleListResponseSchema', 'workspace schemas')
p = replace_once(
    p,
    'export type DesktopCommand = z.infer<typeof DesktopCommandSchema>;',
    "export type DesktopCommand = z.infer<typeof DesktopCommandSchema>;\nexport type WorkspaceInfoDto = z.infer<typeof WorkspaceInfoSchema>;\nexport type WorkspaceSelectionResult = z.infer<typeof WorkspaceSelectionResultSchema>;",
    'workspace types',
)
contracts.write_text(p)

# Preload exposes two fixed, schema-validated workspace calls.
preload = Path('apps/desktop-electron/src/preload/preload.ts')
q = preload.read_text()
q = replace_once(q, '  DesktopCommandSchema,\n  type AppInfoDto,', '  DesktopCommandSchema,\n  WorkspaceInfoSchema,\n  WorkspaceSelectionResultSchema,\n  type AppInfoDto,', 'preload schemas')
q = replace_once(q, '  type DesktopCommand,\n} from', '  type DesktopCommand,\n  type WorkspaceInfoDto,\n  type WorkspaceSelectionResult,\n} from', 'preload workspace types')
q = replace_once(
    q,
    "  openExternal: (url: string) => ipcRenderer.invoke('external:open', url),",
    "  openExternal: (url: string) => ipcRenderer.invoke('external:open', url),\n  workspaceInfo: async (): Promise<WorkspaceInfoDto> =>\n    WorkspaceInfoSchema.parse(await ipcRenderer.invoke('workspace:info')),\n  selectWorkspace: async (): Promise<WorkspaceSelectionResult> =>\n    WorkspaceSelectionResultSchema.parse(await ipcRenderer.invoke('workspace:select')),
",
    'preload workspace methods',
)
preload.write_text(q)

# Main process: owns active roots, persistence, chooser, fallback, and asset boundary.
main = Path('apps/desktop-electron/src/main/main.ts')
m = main.read_text()
m = replace_once(m, '  BrowserWindow,\n  ipcMain,', '  BrowserWindow,\n  dialog,\n  ipcMain,', 'dialog import')
m = replace_once(m, '  type MenuItemConstructorOptions,\n', '  type MenuItemConstructorOptions,\n  type OpenDialogOptions,\n', 'dialog type')
m = replace_once(
    m,
    "import { loadWindowState, saveWindowState } from './window-state';",
    "import { loadWindowState, saveWindowState } from './window-state';\nimport {\n  DEFAULT_WORKSPACE_STATE,\n  loadWorkspaceState,\n  saveWorkspaceState,\n  validateWorkspaceRoot,\n} from './workspace-state';",
    'workspace state import',
)
m = replace_once(
    m,
    '  DesktopCommandSchema,\n  type DesktopCommand,',
    '  DesktopCommandSchema,\n  WorkspaceInfoSchema,\n  WorkspaceSelectionResultSchema,\n  type DesktopCommand,\n  type WorkspaceInfoDto,',
    'main workspace contracts',
)
m = replace_once(
    m,
    "let core: ResearchObservatoryApp;\nlet trustedRendererUrl",
    "let core: ResearchObservatoryApp;\nlet activeContentRoot = '';\nlet activeWorkspace: WorkspaceInfoDto;\nlet workspaceRecoveryWarnings: string[] = [];\nlet trustedRendererUrl",
    'main workspace state',
)
old_root = """function contentRoot(): string {
  if (!app.isPackaged)
    return process.env.ARCHIVE_CONTENT_ROOT || path.resolve(__dirname, '../../docs');
  return path.join(process.resourcesPath, 'docs');
}
async function safeAssetPath(rawUrl: string): Promise<string | undefined> {
  return resolveSafeAssetPath(contentRoot(), rawUrl);
}
"""
new_root = """function bundledContentRoot(): string {
  if (!app.isPackaged)
    return process.env.ARCHIVE_CONTENT_ROOT || path.resolve(__dirname, '../../docs');
  return path.join(process.resourcesPath, 'docs');
}
function contentRoot(): string {
  return activeContentRoot || bundledContentRoot();
}
function workspaceInfo(kind: 'bundled' | 'local', rootPath: string): WorkspaceInfoDto {
  const diagnostics = core.diagnostics();
  return WorkspaceInfoSchema.parse({
    kind,
    rootPath,
    displayName: kind === 'bundled' ? '內建封存' : path.basename(rootPath),
    articleCount: core.listArticles().length,
    warnings: [
      ...workspaceRecoveryWarnings,
      ...diagnostics.warnings,
      ...diagnostics.brokenLinks,
      ...diagnostics.missingAssets,
    ],
    invalidFiles: diagnostics.invalidFiles,
  });
}
function activateWorkspace(rootPath: string, kind: 'bundled' | 'local'): WorkspaceInfoDto {
  activeContentRoot = rootPath;
  core = new ResearchObservatoryApp(rootPath);
  activeWorkspace = workspaceInfo(kind, rootPath);
  return activeWorkspace;
}
function initializeWorkspace(): void {
  workspaceRecoveryWarnings = [];
  const bundled = bundledContentRoot();
  if (process.env.ARCHIVE_CONTENT_ROOT) {
    const selected = validateWorkspaceRoot(path.resolve(process.env.ARCHIVE_CONTENT_ROOT));
    activateWorkspace(selected.rootPath, 'local');
    return;
  }
  const stateFile = path.join(app.getPath('userData'), 'workspace-state.json');
  const persisted = loadWorkspaceState(stateFile);
  if (persisted.rootPath) {
    try {
      const selected = validateWorkspaceRoot(persisted.rootPath);
      activateWorkspace(selected.rootPath, 'local');
      return;
    } catch {
      workspaceRecoveryWarnings.push('先前工作區無法使用，已回復內建封存');
      saveWorkspaceState(stateFile, DEFAULT_WORKSPACE_STATE);
    }
  }
  activateWorkspace(bundled, 'bundled');
}
async function safeAssetPath(rawUrl: string): Promise<string | undefined> {
  return resolveSafeAssetPath(contentRoot(), rawUrl);
}
"""
m = replace_once(m, old_root, new_root, 'main content root')
m = replace_once(
    m,
    "        { label: '聚焦搜尋', accelerator: 'CmdOrCtrl+F', click: () => send('search.focus') },",
    "        { label: '聚焦搜尋', accelerator: 'CmdOrCtrl+F', click: () => send('search.focus') },\n        { label: '開啟本機工作區', accelerator: 'CmdOrCtrl+O', click: () => send('workspace.open') },",
    'workspace menu',
)
m = replace_once(m, 'function createWindow() {\n  core = new ResearchObservatoryApp(contentRoot());', 'function createWindow() {\n  initializeWorkspace();', 'workspace initialization')
workspace_handlers = """ipcMain.handle('workspace:info', (event) => {
  validateSender(event.sender, event.senderFrame);
  return WorkspaceInfoSchema.parse(activeWorkspace);
});
ipcMain.handle('workspace:select', async (event) => {
  validateSender(event.sender, event.senderFrame);
  const owner = BrowserWindow.fromWebContents(event.sender);
  const options: OpenDialogOptions = {
    title: '選擇 Research Observatory 工作區',
    properties: ['openDirectory'],
  };
  const selection = owner
    ? await dialog.showOpenDialog(owner, options)
    : await dialog.showOpenDialog(options);
  if (selection.canceled || !selection.filePaths[0]) {
    return WorkspaceSelectionResultSchema.parse({ status: 'cancelled' });
  }
  try {
    workspaceRecoveryWarnings = [];
    const selected = validateWorkspaceRoot(selection.filePaths[0]);
    const workspace = activateWorkspace(selected.rootPath, 'local');
    saveWorkspaceState(path.join(app.getPath('userData'), 'workspace-state.json'), {
      schemaVersion: 1,
      rootPath: selected.rootPath,
    });
    return WorkspaceSelectionResultSchema.parse({ status: 'selected', workspace });
  } catch (error) {
    return WorkspaceSelectionResultSchema.parse({
      status: 'rejected',
      message: `無法開啟工作區：${error instanceof Error ? error.message : String(error)}`,
    });
  }
});
"""
m = replace_once(m, "ipcMain.handle('diagnostics:get', (event) => {", workspace_handlers + "ipcMain.handle('diagnostics:get', (event) => {", 'workspace handlers')
main.write_text(m)

# Command catalog.
commands = Path('apps/desktop-electron/src/renderer/desktop-commands.ts')
d = commands.read_text()
d = replace_once(
    d,
    "  {\n    id: 'about.open',",
    "  {\n    id: 'workspace.open',\n    label: '開啟本機工作區',\n    keywords: ['workspace', 'folder', 'archive', '工作區', '資料夾', '封存'],\n    shortcut: 'Ctrl+O',\n  },\n  {\n    id: 'about.open',",
    'workspace command catalog',
)
commands.write_text(d)

# Renderer integration.
renderer = Path('apps/desktop-electron/src/renderer/renderer.tsx')
r = renderer.read_text()
r = replace_once(r, '  DesktopCommand,\n} from', '  DesktopCommand,\n  WorkspaceInfoDto,\n  WorkspaceSelectionResult,\n} from', 'renderer workspace types')
r = replace_once(
    r,
    '      clearCommandHandler(): void;',
    '      clearCommandHandler(): void;\n      workspaceInfo(): Promise<WorkspaceInfoDto>;\n      selectWorkspace(): Promise<WorkspaceSelectionResult>;\n      diagnostics(): Promise<{ warnings: string[]; invalidFiles: string[]; brokenLinks: string[]; missingAssets: string[] }>;',
    'renderer workspace bridge',
)
r = replace_once(
    r,
    '  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);',
    '  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);\n  const [workspace, setWorkspace] = useState<WorkspaceInfoDto | null>(null);',
    'renderer workspace state',
)
workspace_functions = """  async function refreshWorkspace(nextWorkspace?: WorkspaceInfoDto) {
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
r = replace_once(r, '  function executeDesktopCommand(command: DesktopCommand) {', workspace_functions + '  function executeDesktopCommand(command: DesktopCommand) {', 'workspace renderer functions')
r = replace_once(
    r,
    "    } else if (command === 'about.open') {\n      void openAbout();",
    "    } else if (command === 'workspace.open') {\n      void chooseWorkspace();\n    } else if (command === 'about.open') {\n      void openAbout();",
    'workspace command execution',
)
r = replace_once(
    r,
    "      } else if (event.key.toLocaleLowerCase() === 'f') {\n        event.preventDefault();\n        executeDesktopCommand('search.focus');\n      }",
    "      } else if (event.key.toLocaleLowerCase() === 'f') {\n        event.preventDefault();\n        executeDesktopCommand('search.focus');\n      } else if (event.key.toLocaleLowerCase() === 'o') {\n        event.preventDefault();\n        executeDesktopCommand('workspace.open');\n      }",
    'workspace shortcut',
)
old_load = """  useEffect(() => {
    window.observatory
      .listArticles()
      .then((a) => {
        setArticles(a);
        setShown(a);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);
"""
r = replace_once(r, old_load, "  useEffect(() => {\n    void refreshWorkspace();\n  }, []);\n", 'workspace initial load')
workspace_panel = """            {workspace && (
              <section className="workspace-panel" aria-label="目前工作區">
                <div>
                  <strong data-testid="workspace-kind">
                    {workspace.kind === 'local' ? '本機工作區' : '內建封存'}
                  </strong>
                  <small data-testid="workspace-path" title={workspace.rootPath}>
                    {workspace.displayName}
                  </small>
                </div>
                <button type="button" onClick={() => void chooseWorkspace()}>
                  開啟資料夾
                </button>
                {(workspace.warnings.length > 0 || workspace.invalidFiles.length > 0) && (
                  <details data-testid="workspace-diagnostics" open>
                    <summary>工作區診斷</summary>
                    <ul>
                      {[...workspace.warnings, ...workspace.invalidFiles].map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            )}
"""
r = replace_once(r, '            <label>\n              搜尋文章', workspace_panel + '            <label>\n              搜尋文章', 'workspace panel')
r = replace_once(r, '              <input\n                aria-label="搜尋文章"', '              <input\n                ref={searchInputRef}\n                aria-label="搜尋文章"', 'search input ref')
renderer.write_text(r)

# Styles.
style = Path('apps/desktop-electron/src/renderer/style.css')
s = style.read_text()
if '.workspace-panel {' not in s:
    s += """

.workspace-panel {
  display: grid;
  gap: 0.55rem;
  margin-bottom: 0.85rem;
  padding: 0.7rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-panel);
}

.workspace-panel > div {
  min-width: 0;
}

.workspace-panel small {
  display: block;
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
Path('project-docs/architecture/adr/0016-main-owned-local-workspaces.md').write_text("""---
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
- Search, manifest, diagnostics, article list, and local assets switch to the new main-owned root.
- Symlinked content is deliberately unsupported until a more granular trust policy is designed.
""")
product = Path('project-docs/product/desktop-product-spec.md')
t = product.read_text()
t = t.replace('typed native commands and command palette, native packaging', 'typed native commands and command palette, persistent validated local workspaces, native packaging')
t = replace_once(t, "## FR-021\n\nStatus: `planned`. Verification: planned for a later PR.", "## FR-021\n\nStatus: `implemented`. Verification: packages/content-engine/src/index.test.ts, apps/desktop-electron/src/main/workspace-state.test.ts, packages/platform-contracts/src/workspace-contract.test.ts, apps/desktop-electron/e2e/local-workspace.spec.ts.", 'FR-021 product status')
product.write_text(t)
requirements = Path('project-docs/traceability/requirements.yaml')
u = requirements.read_text()
u = replace_once(u, "- {id: FR-021, title: FR-021, priority: P2, source: {document: project-docs/product/desktop-product-spec.md, section: FR-021}, implementation: {packages: *p}, verification: {tests: []}, status: planned}", "- {id: FR-021, title: FR-021, priority: P2, source: {document: project-docs/product/desktop-product-spec.md, section: FR-021}, implementation: {packages: *p}, verification: {tests: [packages/content-engine/src/index.test.ts, apps/desktop-electron/src/main/workspace-state.test.ts, packages/platform-contracts/src/workspace-contract.test.ts, apps/desktop-electron/e2e/local-workspace.spec.ts]}, status: implemented}", 'FR-021 requirement')
requirements.write_text(u)
acceptance = Path('project-docs/quality/acceptance-matrix.md')
v = acceptance.read_text()
v = replace_once(v, '| FR-021 | planned | planned |', '| FR-021 | implemented | packages/content-engine/src/index.test.ts, apps/desktop-electron/src/main/workspace-state.test.ts, packages/platform-contracts/src/workspace-contract.test.ts, apps/desktop-electron/e2e/local-workspace.spec.ts |', 'FR-021 acceptance')
acceptance.write_text(v)
parity = Path('project-docs/migration/mkdocs-feature-parity-matrix.md')
w = parity.read_text()
if '| Local workspace selection |' not in w:
    w += '\n| Local workspace selection | static site root | main/preload/application/content-engine | implemented | apps/desktop-electron/src/main/workspace-state.test.ts; apps/desktop-electron/e2e/local-workspace.spec.ts | Native folder selection, persisted recent workspace, diagnostics, bad-file isolation, and bundled fallback without renderer filesystem access. |\n'
parity.write_text(w)

# Restore the normal read-only merge gate in the same final commit.
Path('.github/workflows/desktop-ci.yml').write_text("""name: Desktop CI
on:
  push:
    branches: [app-main, main]
  pull_request:
permissions:
  contents: read
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020
        with: { node-version: '24', cache: npm }
      - run: npm ci
      - name: Formatting
        run: npm run format:check
      - name: Architecture
        run: npm run lint
      - name: TypeScript
        run: npm run typecheck
      - name: Traceability
        run: npm run validate:traceability
      - name: Generated content
        run: npm run validate:generated
      - name: Release assets
        run: npm run validate:release-assets
      - name: Unit tests
        run: npm run test
      - name: Security tests
        run: npm run test:security
      - name: Compatibility tests
        run: npm run test:compatibility
      - name: Build
        run: npm run build
  e2e:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020
        with: { node-version: '24', cache: npm }
      - run: sudo apt-get update && sudo apt-get install -y xvfb libgtk-3-0 libnss3 libasound2t64 libatk-bridge2.0-0 libxss1
      - run: npm ci
      - run: npm run build
      - name: Electron E2E
        shell: bash
        run: |
          set -o pipefail
          xvfb-run -a npm run test:e2e 2>&1 | tee playwright-e2e.log
      - name: Upload E2E diagnostics
        if: failure()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: desktop-e2e-diagnostics-${{ github.run_attempt }}
          path: |
            playwright-e2e.log
            playwright-report/
            test-results/
          if-no-files-found: warn
          retention-days: 14
  package-smoke:
    needs: quality
    strategy:
      fail-fast: false
      matrix:
        include:
          - { os: windows-latest, platform: windows, artifact: desktop-windows-x64 }
          - { os: ubuntu-latest, platform: linux, artifact: desktop-linux-x64 }
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020
        with: { node-version: '24', cache: npm }
      - if: runner.os == 'Linux'
        run: sudo apt-get update && sudo apt-get install -y fakeroot rpm xvfb libgtk-3-0 libnss3 libasound2t64 libatk-bridge2.0-0 libxss1
      - run: npm ci
      - run: npm run make:${{ matrix.platform }}
        env:
          RELEASE_TARGET_COMMIT: ${{ github.sha }}
      - if: runner.os == 'Linux'
        run: xvfb-run -a npm run smoke:packaged
      - if: runner.os == 'Windows'
        run: npm run smoke:packaged
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: ${{ matrix.artifact }}
          path: dist/release-assets/*
""")
