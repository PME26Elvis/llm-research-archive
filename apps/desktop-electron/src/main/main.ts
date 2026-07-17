import squirrelStartup from 'electron-squirrel-startup';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  screen,
  shell,
  session,
  WebContents,
  WebFrameMain,
  type MenuItemConstructorOptions,
  type OpenDialogOptions,
} from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveSafeAssetPath } from './asset-path';
import { loadWindowState, saveWindowState } from './window-state';
import { ImportSessionService } from './import-session';
import { LocalDiagnostics } from './local-diagnostics';
import { StartupTelemetry } from './startup-telemetry';
import { mainTranslate } from './main-i18n';
import {
  DEFAULT_RENDERER_IMPLEMENTATION,
  loadRendererImplementation,
  saveRendererImplementation,
} from './renderer-state';
import {
  DEFAULT_WORKSPACE_STATE,
  loadWorkspaceState,
  saveWorkspaceState,
  validateWorkspaceRoot,
} from './workspace-state';
import { ResearchObservatoryApp } from '@research-observatory/application';
import { summarizeArticle } from '@research-observatory/search-engine';
import {
  ArticleListResponseSchema,
  ArticleRequestSchema,
  ArticleDtoSchema,
  SearchRequestSchema,
  SearchResponseSchema,
  ExternalUrlSchema,
  AppInfoResponseSchema,
  ArchiveDiagnosticsSchema,
  DesktopCommandSchema,
  ImportCommitRequestSchema,
  ImportCommitResultSchema,
  ImportPreviewRefreshRequestSchema,
  ImportPreviewResultSchema,
  ImportSourceSelectionRequestSchema,
  LocaleUpdateRequestSchema,
  RendererImplementationInfoSchema,
  RendererImplementationSchema,
  RendererImplementationUpdateRequestSchema,
  RendererDiagnosticRequestSchema,
  StartupMilestoneSchema,
  WorkspaceInfoSchema,
  WorkspaceSelectionResultSchema,
  type DesktopCommand,
  type WorkspaceInfoDto,
  type UiLocale,
  type RendererImplementation,
} from '@research-observatory/platform-contracts';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;
declare const __OBSERVATORY_BUILD_COMMIT__: string;

if (squirrelStartup) app.quit();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let core: ResearchObservatoryApp;
let activeContentRoot = '';
let activeWorkspace: WorkspaceInfoDto;
const importSessions = new ImportSessionService();
const startupTelemetry = new StartupTelemetry();
let localDiagnostics: LocalDiagnostics | undefined;
let workspaceRecoveryWarnings: string[] = [];
let trustedRendererUrl = '';
let trustedRendererOrigin = '';
let currentLocale: UiLocale = 'zh-TW';
let currentRenderer: RendererImplementation = DEFAULT_RENDERER_IMPLEMENTATION;
function bundledContentRoot(): string {
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
  importSessions.clear();
  activeContentRoot = rootPath;
  core = new ResearchObservatoryApp(rootPath);
  activeWorkspace = workspaceInfo(kind, rootPath);
  localDiagnostics?.setPrivateRoots([app.getPath('userData'), bundledContentRoot(), rootPath]);
  startupTelemetry.mark('archive-ready');
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
      localDiagnostics?.record(
        'warning',
        'workspace',
        'workspace-recovered',
        '先前工作區無法使用，已回復內建封存',
      );
      saveWorkspaceState(stateFile, DEFAULT_WORKSPACE_STATE);
    }
  }
  activateWorkspace(bundled, 'bundled');
}
async function safeAssetPath(rawUrl: string): Promise<string | undefined> {
  return resolveSafeAssetPath(contentRoot(), rawUrl);
}
function rendererStateFile(): string {
  return path.join(app.getPath('userData'), 'renderer-state.json');
}
function packagedRendererPath(implementation: RendererImplementation): string {
  const rendererName = implementation === 'astro' ? 'astro_window' : MAIN_WINDOW_VITE_NAME;
  return path.join(__dirname, `../renderer/${rendererName}/index.html`);
}
function developmentAstroRendererPath(): string {
  return path.resolve(__dirname, '../../apps/desktop-astro/dist/index.html');
}
function rendererUrl(implementation: RendererImplementation): string {
  if (implementation === 'classic' && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    return MAIN_WINDOW_VITE_DEV_SERVER_URL;
  }
  const filePath = app.isPackaged
    ? packagedRendererPath(implementation)
    : implementation === 'astro'
      ? developmentAstroRendererPath()
      : packagedRendererPath(implementation);
  return pathToFileURL(filePath).toString();
}
async function loadRenderer(
  win: BrowserWindow,
  implementation: RendererImplementation,
): Promise<void> {
  const next = RendererImplementationSchema.parse(implementation);
  const target = rendererUrl(next);
  trustedRendererUrl = target;
  trustedRendererOrigin = target.startsWith('file:') ? '' : new URL(target).origin;
  if (target.startsWith('file:')) await win.loadFile(fileURLToPath(target));
  else await win.loadURL(target);
  currentRenderer = next;
}
async function selectRenderer(
  win: BrowserWindow,
  implementation: RendererImplementation,
): Promise<void> {
  const next = RendererImplementationSchema.parse(implementation);
  if (next === currentRenderer) return;
  const previous = currentRenderer;
  try {
    await loadRenderer(win, next);
    saveRendererImplementation(rendererStateFile(), next);
  } catch (error) {
    localDiagnostics?.record('error', 'main', 'renderer-switch-failed', error);
    await loadRenderer(win, previous).catch((recoveryError) => {
      localDiagnostics?.record('error', 'main', 'renderer-recovery-failed', recoveryError);
    });
    throw error;
  } finally {
    installApplicationMenu(win, currentLocale);
  }
}
function validateSender(sender: WebContents, frame?: WebFrameMain | null): void {
  if (frame && frame !== sender.mainFrame) throw new Error('invalid-ipc-subframe');
  const actual = frame?.url || sender.getURL();
  const actualOrigin = actual ? new URL(actual).origin : '';
  if (trustedRendererOrigin) {
    if (actualOrigin !== trustedRendererOrigin) throw new Error(`invalid-ipc-sender:${actual}`);
    return;
  }
  if (actual !== trustedRendererUrl) throw new Error(`invalid-ipc-sender:${actual}`);
}
function installApplicationMenu(win: BrowserWindow, locale: UiLocale = currentLocale): void {
  const send = (command: DesktopCommand) =>
    win.webContents.send('app:command', DesktopCommandSchema.parse(command));
  const template: MenuItemConstructorOptions[] = [
    {
      label: mainTranslate(locale, 'navigation'),
      submenu: [
        { label: mainTranslate(locale, 'back'), click: () => send('navigation.back') },
        { label: mainTranslate(locale, 'forward'), click: () => send('navigation.forward') },
        { type: 'separator' },
        {
          label: mainTranslate(locale, 'search'),
          accelerator: 'CmdOrCtrl+F',
          click: () => send('search.focus'),
        },
        {
          label: mainTranslate(locale, 'workspace'),
          accelerator: 'CmdOrCtrl+O',
          click: () => send('workspace.open'),
        },
        {
          label: mainTranslate(locale, 'import'),
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => send('import.open'),
        },
      ],
    },
    {
      label: mainTranslate(locale, 'view'),
      submenu: [
        {
          label: mainTranslate(locale, 'implementation'),
          submenu: [
            {
              label: mainTranslate(locale, 'implementationAstro'),
              type: 'radio',
              checked: currentRenderer === 'astro',
              click: () => void selectRenderer(win, 'astro'),
            },
            {
              label: mainTranslate(locale, 'implementationClassic'),
              type: 'radio',
              checked: currentRenderer === 'classic',
              click: () => void selectRenderer(win, 'classic'),
            },
          ],
        },
        { type: 'separator' },
        {
          label: mainTranslate(locale, 'palette'),
          accelerator: 'CmdOrCtrl+K',
          click: () => send('palette.open'),
        },
        {
          label: mainTranslate(locale, 'observatory'),
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => send('observatory.open'),
        },
      ],
    },
    {
      label: mainTranslate(locale, 'help'),
      submenu: [{ label: mainTranslate(locale, 'about'), click: () => send('about.open') }],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  initializeWorkspace();
  currentRenderer = loadRendererImplementation(rendererStateFile());
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) =>
    callback(false),
  );
  session.defaultSession.protocol.registerFileProtocol('app-asset', (request, callback) => {
    safeAssetPath(request.url)
      .then((filePath) => callback(filePath ? { path: filePath } : { error: -10 }))
      .catch(() => callback({ error: -10 }));
  });
  const windowStateFile = path.join(app.getPath('userData'), 'window-state.json');
  const windowState = loadWindowState(
    windowStateFile,
    screen.getAllDisplays().map((display) => display.workArea),
  );
  const win = new BrowserWindow({
    ...windowState.bounds,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });
  startupTelemetry.mark('window-created');
  win.webContents.on('render-process-gone', (_event, details) => {
    localDiagnostics?.record(
      'error',
      'renderer',
      'render-process-gone',
      `renderer exited: ${details.reason}`,
    );
  });
  let windowStateTimer: NodeJS.Timeout | undefined;
  const persistWindowState = () => {
    if (windowStateTimer) clearTimeout(windowStateTimer);
    try {
      saveWindowState(windowStateFile, {
        schemaVersion: 1,
        bounds: win.getNormalBounds(),
        maximized: win.isMaximized(),
      });
    } catch (error) {
      localDiagnostics?.record('error', 'main', 'window-state-save-failed', error);
    }
  };
  const scheduleWindowState = () => {
    if (windowStateTimer) clearTimeout(windowStateTimer);
    windowStateTimer = setTimeout(persistWindowState, 250);
  };
  win.on('resize', scheduleWindowState);
  win.on('move', scheduleWindowState);
  win.on('close', persistWindowState);
  if (windowState.maximized) win.maximize();
  installApplicationMenu(win);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(ExternalUrlSchema.parse(url));
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== trustedRendererUrl) event.preventDefault();
  });
  if (app.isPackaged) win.webContents.on('devtools-opened', () => win.webContents.closeDevTools());
  void loadRenderer(win, currentRenderer).catch(async (error) => {
    localDiagnostics?.record('error', 'main', 'renderer-load-failed', error);
    if (currentRenderer === 'classic') return;
    try {
      await loadRenderer(win, 'classic');
      saveRendererImplementation(rendererStateFile(), 'classic');
      installApplicationMenu(win, currentLocale);
    } catch (recoveryError) {
      localDiagnostics?.record('error', 'main', 'renderer-recovery-failed', recoveryError);
    }
  });
}
ipcMain.handle('archive:list', (event) => {
  validateSender(event.sender, event.senderFrame);
  return ArticleListResponseSchema.parse(core.listArticles().map(summarizeArticle));
});
ipcMain.handle('article:get', (event, p) => {
  validateSender(event.sender, event.senderFrame);
  return ArticleDtoSchema.parse(core.getArticle(ArticleRequestSchema.parse(p).id));
});
ipcMain.handle('search:query', (event, p) => {
  validateSender(event.sender, event.senderFrame);
  return SearchResponseSchema.parse(core.search(SearchRequestSchema.parse(p).query));
});
ipcMain.handle('workspace:info', (event) => {
  validateSender(event.sender, event.senderFrame);
  return WorkspaceInfoSchema.parse(activeWorkspace);
});
ipcMain.handle('workspace:select', async (event) => {
  validateSender(event.sender, event.senderFrame);
  const owner = BrowserWindow.fromWebContents(event.sender);
  const options: OpenDialogOptions = {
    title: mainTranslate(currentLocale, 'workspaceDialog'),
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
    return WorkspaceSelectionResultSchema.parse({
      status: 'selected',
      workspace,
    });
  } catch (error) {
    localDiagnostics?.record('warning', 'workspace', 'workspace-open-rejected', error);
    return WorkspaceSelectionResultSchema.parse({
      status: 'rejected',
      message: mainTranslate(currentLocale, 'workspaceRejected'),
    });
  }
});
ipcMain.handle('import:select-source', async (event, rawRequest: unknown) => {
  validateSender(event.sender, event.senderFrame);
  const request = ImportSourceSelectionRequestSchema.parse(rawRequest);
  if (activeWorkspace.kind !== 'local') {
    return ImportPreviewResultSchema.parse(importSessions.createPreview('', activeWorkspace));
  }
  const owner = BrowserWindow.fromWebContents(event.sender);
  const options: OpenDialogOptions = {
    title:
      request.kind === 'markdown-file'
        ? mainTranslate(currentLocale, 'markdownDialog')
        : mainTranslate(currentLocale, 'folderDialog'),
    properties: request.kind === 'markdown-file' ? ['openFile'] : ['openDirectory'],
    ...(request.kind === 'markdown-file'
      ? { filters: [{ name: mainTranslate(currentLocale, 'markdownFilter'), extensions: ['md'] }] }
      : {}),
  };
  const selection = owner
    ? await dialog.showOpenDialog(owner, options)
    : await dialog.showOpenDialog(options);
  if (selection.canceled || !selection.filePaths[0]) {
    return ImportPreviewResultSchema.parse({ status: 'cancelled' });
  }
  return ImportPreviewResultSchema.parse(
    importSessions.createPreview(selection.filePaths[0], activeWorkspace),
  );
});
ipcMain.handle('import:refresh-preview', (event, rawRequest: unknown) => {
  validateSender(event.sender, event.senderFrame);
  const request = ImportPreviewRefreshRequestSchema.parse(rawRequest);
  return ImportPreviewResultSchema.parse(
    importSessions.refreshPreview(request.planId, request.metadata, activeWorkspace),
  );
});
ipcMain.handle('import:commit', (event, rawRequest: unknown) => {
  validateSender(event.sender, event.senderFrame);
  const request = ImportCommitRequestSchema.parse(rawRequest);
  const committed = importSessions.commit(request, activeWorkspace);
  if (!committed.ok) {
    return ImportCommitResultSchema.parse({
      status: 'rejected',
      code: committed.code,
      message: committed.message,
    });
  }
  const refreshedWorkspace = activateWorkspace(activeContentRoot, 'local');
  return ImportCommitResultSchema.parse({
    status: 'committed',
    articleId: committed.articleId,
    workspace: refreshedWorkspace,
    sourceStatus: committed.sourceStatus,
    ...(committed.message ? { message: committed.message } : {}),
  });
});
ipcMain.handle('preferences:set-locale', (event, rawRequest: unknown) => {
  validateSender(event.sender, event.senderFrame);
  const request = LocaleUpdateRequestSchema.parse(rawRequest);
  currentLocale = request.locale;
  const owner = BrowserWindow.fromWebContents(event.sender);
  if (owner) installApplicationMenu(owner, currentLocale);
});
ipcMain.handle('renderer:info', (event) => {
  validateSender(event.sender, event.senderFrame);
  return RendererImplementationInfoSchema.parse({
    active: currentRenderer,
    default: DEFAULT_RENDERER_IMPLEMENTATION,
    available: ['astro', 'classic'],
  });
});
ipcMain.handle('renderer:set', async (event, rawRequest: unknown) => {
  validateSender(event.sender, event.senderFrame);
  const request = RendererImplementationUpdateRequestSchema.parse(rawRequest);
  const owner = BrowserWindow.fromWebContents(event.sender);
  if (!owner) throw new Error('renderer-window-unavailable');
  await selectRenderer(owner, request.implementation);
});
ipcMain.handle('diagnostics:get', (event) => {
  validateSender(event.sender, event.senderFrame);
  return ArchiveDiagnosticsSchema.parse({
    ...core.diagnostics(),
    startup: startupTelemetry.summary(),
    events: localDiagnostics?.recent(50) ?? [],
  });
});
ipcMain.handle('diagnostics:clear', (event) => {
  validateSender(event.sender, event.senderFrame);
  localDiagnostics?.clear();
  return ArchiveDiagnosticsSchema.parse({
    ...core.diagnostics(),
    startup: startupTelemetry.summary(),
    events: [],
  });
});
ipcMain.handle('diagnostics:report', (event, rawRequest: unknown) => {
  validateSender(event.sender, event.senderFrame);
  const request = RendererDiagnosticRequestSchema.parse(rawRequest);
  localDiagnostics?.record('error', request.area, request.code, request.message);
});
ipcMain.handle('telemetry:mark', (event, rawMilestone: unknown) => {
  validateSender(event.sender, event.senderFrame);
  return startupTelemetry.mark(StartupMilestoneSchema.parse(rawMilestone));
});
ipcMain.handle('app:info', (event) => {
  validateSender(event.sender, event.senderFrame);
  const manifest = core.manifest();
  return AppInfoResponseSchema.parse({
    productName: app.getName(),
    version: app.getVersion(),
    commit: __OBSERVATORY_BUILD_COMMIT__ || 'local',
    platform: process.platform,
    packaged: app.isPackaged,
    electronVersion: process.versions.electron,
    chromiumVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    contentArticleCount: manifest.articles.length,
    contentManifestHash: manifest.contentHash,
  });
});
ipcMain.handle('external:open', (event, url) => {
  validateSender(event.sender, event.senderFrame);
  return shell.openExternal(ExternalUrlSchema.parse(url));
});
app.whenReady().then(() => {
  const userData = app.getPath('userData');
  localDiagnostics = new LocalDiagnostics(path.join(userData, 'diagnostics', 'events.json'));
  localDiagnostics.setPrivateRoots([userData, bundledContentRoot()]);
  startupTelemetry.attachHistoryFile(path.join(userData, 'diagnostics', 'startup-history.json'));
  startupTelemetry.mark('app-ready');
  process.on('uncaughtException', (error) => {
    localDiagnostics?.record('error', 'main', 'uncaught-exception', error);
  });
  process.on('unhandledRejection', (reason) => {
    localDiagnostics?.record('error', 'main', 'unhandled-rejection', reason);
  });
  app.on('child-process-gone', (_event, details) => {
    localDiagnostics?.record(
      'error',
      'main',
      'child-process-gone',
      `${details.type} exited: ${details.reason}`,
    );
  });
  createWindow();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
export const __test__ = { safeAssetPath, contentRoot, rendererUrl };
