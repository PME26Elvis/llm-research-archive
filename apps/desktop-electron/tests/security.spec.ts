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
});
