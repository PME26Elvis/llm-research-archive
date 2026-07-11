import squirrelStartup from 'electron-squirrel-startup';
import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  shell,
  session,
  WebContents,
  WebFrameMain,
} from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import { resolveSafeAssetPath } from './asset-path';
import { loadWindowState, saveWindowState } from './window-state';
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
} from '@research-observatory/platform-contracts';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;
declare const __OBSERVATORY_BUILD_COMMIT__: string;

if (squirrelStartup) app.quit();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let core: ResearchObservatoryApp;
let trustedRendererUrl = '';
let trustedRendererOrigin = '';
function contentRoot(): string {
  if (!app.isPackaged)
    return process.env.ARCHIVE_CONTENT_ROOT || path.resolve(__dirname, '../../docs');
  return path.join(process.resourcesPath, 'docs');
}
async function safeAssetPath(rawUrl: string): Promise<string | undefined> {
  return resolveSafeAssetPath(contentRoot(), rawUrl);
}
function expectedPackagedRendererUrl(): string {
  return pathToFileURL(
    path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
  ).toString();
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
function createWindow() {
  core = new ResearchObservatoryApp(contentRoot());
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
      console.error('window-state-save-failed', error);
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

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(ExternalUrlSchema.parse(url));
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== trustedRendererUrl) event.preventDefault();
  });
  if (app.isPackaged) win.webContents.on('devtools-opened', () => win.webContents.closeDevTools());
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    trustedRendererUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL;
    trustedRendererOrigin = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL).origin;
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    trustedRendererUrl = expectedPackagedRendererUrl();
    trustedRendererOrigin = '';
    win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
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
ipcMain.handle('diagnostics:get', (event) => {
  validateSender(event.sender, event.senderFrame);
  return core.diagnostics();
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
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
export const __test__ = { safeAssetPath, contentRoot };
