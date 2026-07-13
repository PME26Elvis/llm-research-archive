import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('Electron security configuration', () => {
  it('uses hardened BrowserWindow and navigation policy', () => {
    const main = fs.readFileSync('apps/desktop-electron/src/main/main.ts', 'utf8');
    expect(main).toContain('contextIsolation: true');
    expect(main).toContain('sandbox: true');
    expect(main).toContain('nodeIntegration: false');
    expect(main).toContain('setPermissionRequestHandler');
    expect(main).toContain('setWindowOpenHandler');
    expect(main).toContain('will-navigate');
  });

  it('does not expose raw ipcRenderer API', () => {
    const preload = fs.readFileSync('apps/desktop-electron/src/preload/preload.ts', 'utf8');
    expect(preload).toContain('contextBridge.exposeInMainWorld');
    expect(preload).not.toContain("exposeInMainWorld('electron'");
  });

  it('keeps locale persistence in the renderer and native-menu authority in the main process', () => {
    const main = fs.readFileSync('apps/desktop-electron/src/main/main.ts', 'utf8');
    const preload = fs.readFileSync('apps/desktop-electron/src/preload/preload.ts', 'utf8');
    const preferences = fs.readFileSync(
      'apps/desktop-electron/src/renderer/preferences-context.tsx',
      'utf8',
    );

    expect(main).toContain("ipcMain.handle('preferences:set-locale'");
    expect(main).toContain('LocaleUpdateRequestSchema.parse');
    expect(main).toContain('installApplicationMenu(owner, currentLocale)');
    expect(preload).toContain('LocaleUpdateRequestSchema.parse({ locale })');
    expect(preferences).toContain('window.localStorage');
    expect(preferences).not.toContain('ipcRenderer');
  });

  it('keeps import filesystem authority and plans in the main process', () => {
    const main = fs.readFileSync('apps/desktop-electron/src/main/main.ts', 'utf8');
    const preload = fs.readFileSync('apps/desktop-electron/src/preload/preload.ts', 'utf8');
    const renderer = fs.readFileSync(
      'apps/desktop-electron/src/renderer/import-wizard.tsx',
      'utf8',
    );

    expect(main).toContain('ImportSessionService');
    expect(main).toContain('ImportSourceSelectionRequestSchema.parse');
    expect(main).toContain('ImportPreviewRefreshRequestSchema.parse');
    expect(main).toContain('ImportCommitRequestSchema.parse');
    expect(main).toContain('dialog.showOpenDialog');
    expect(preload).toContain('ImportPreviewResultSchema.parse');
    expect(preload).toContain('ImportCommitResultSchema.parse');
    expect(preload).not.toContain('sourcePath');
    expect(preload).not.toContain('targetDirectory');
    expect(renderer).not.toContain('node:fs');
    expect(renderer).not.toContain('sourcePath');
    expect(renderer).not.toContain('targetDirectory');
  });
});
