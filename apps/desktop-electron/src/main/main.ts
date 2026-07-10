import { app, BrowserWindow, ipcMain, shell, session, WebContents } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { ResearchObservatoryApp } from '@research-observatory/application';
import {
  ArticleRequestSchema,
  SearchRequestSchema,
  ExternalUrlSchema,
} from '@research-observatory/platform-contracts';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function contentRoot(): string {
  if (!app.isPackaged)
    return process.env.ARCHIVE_CONTENT_ROOT || path.resolve(__dirname, '../../docs');
  const bundled = path.join(process.resourcesPath, 'docs');
  if (!fs.existsSync(bundled)) throw new Error(`bundled archive not found: ${bundled}`);
  return bundled;
}
let core: ResearchObservatoryApp;
function validateSender(sender: WebContents): void {
  if (sender.getURL() && !sender.getURL().startsWith('file://'))
    throw new Error('invalid-ipc-sender');
}
function createWindow() {
  core = new ResearchObservatoryApp(contentRoot());
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) =>
    callback(false),
  );
  session.defaultSession.protocol.registerFileProtocol('app-asset', (request, callback) => {
    const url = new URL(request.url);
    const unsafe = decodeURIComponent(url.pathname.replace(/^\//, ''));
    const resolved = path.resolve(contentRoot(), unsafe);
    if (!resolved.startsWith(path.resolve(contentRoot()))) return callback({ error: -10 });
    callback(resolved);
  });
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    const parsed = ExternalUrlSchema.parse(url);
    shell.openExternal(parsed);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });
  if (app.isPackaged) win.webContents.on('devtools-opened', () => win.webContents.closeDevTools());
  win.loadFile(path.join(__dirname, '../renderer/main_window/index.html'));
}
ipcMain.handle('archive:list', (event) => {
  validateSender(event.sender);
  return core.listArticles().map(({ markdown, ...a }) => a);
});
ipcMain.handle('article:get', (event, p) => {
  validateSender(event.sender);
  return core.getArticle(ArticleRequestSchema.parse(p).id);
});
ipcMain.handle('search:query', (event, p) => {
  validateSender(event.sender);
  return core.search(SearchRequestSchema.parse(p).query);
});
ipcMain.handle('diagnostics:get', (event) => {
  validateSender(event.sender);
  return core.diagnostics();
});
ipcMain.handle('app:info', (event) => {
  validateSender(event.sender);
  return {
    version: app.getVersion(),
    commit: process.env.GITHUB_SHA || 'local',
    platform: process.platform,
    packaged: app.isPackaged,
  };
});
ipcMain.handle('external:open', (event, url) => {
  validateSender(event.sender);
  return shell.openExternal(ExternalUrlSchema.parse(url));
});
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
