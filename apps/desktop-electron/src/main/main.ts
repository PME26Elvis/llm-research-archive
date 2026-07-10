import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { ResearchObservatoryApp } from '@research-observatory/application';
import {
  ArticleRequestSchema,
  SearchRequestSchema,
  ExternalUrlSchema,
} from '@research-observatory/platform-contracts';
const core = new ResearchObservatoryApp(process.env.ARCHIVE_CONTENT_ROOT || path.resolve('docs'));
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => {
    ExternalUrlSchema.parse(url);
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
}
ipcMain.handle('archive:list', () => core.listArticles().map(({ markdown, ...a }) => a));
ipcMain.handle('article:get', (_e, p) => core.getArticle(ArticleRequestSchema.parse(p).id));
ipcMain.handle('search:query', (_e, p) => core.search(SearchRequestSchema.parse(p).query));
ipcMain.handle('diagnostics:get', () => core.diagnostics());
ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  commit: process.env.GITHUB_SHA || 'local',
  platform: process.platform,
}));
ipcMain.handle('external:open', (_e, url) => shell.openExternal(ExternalUrlSchema.parse(url)));
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
