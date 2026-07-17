import type { ForgeConfig } from '@electron-forge/shared-types';
import { VitePlugin } from '@electron-forge/plugin-vite';
import fs from 'node:fs';
import path from 'node:path';
import { windowsSetupName } from './scripts/release-version.mjs';

const astroOutput = path.resolve('apps/desktop-astro/dist');

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    executableName: 'llm-research-archive-desktop',
    extraResource: ['apps/desktop-electron/resources/archive-manifest.json', 'docs'],
    ignore:
      /^\/(?:\.github|\.vscode|\.devcontainer|apps|project-docs|scripts|packages|tools|hooks|_incoming|docs|coverage|test-results|playwright-report)(?:\/|$)|^\/(?:README\.md|AGENTS\.md|mkdocs\.yml|requirements\.txt|package-lock\.json|tsconfig(?:\.base)?\.json|vitest\.config\.ts|playwright\.config\.ts|vite\..*\.config\.ts|forge\.config\.ts)$/i,
    osxSign: { identity: '-' },
  },
  rebuildConfig: {},
  hooks: {
    packageAfterCopy: async (_forgeConfig, buildPath) => {
      const entry = path.join(astroOutput, 'index.html');
      if (!fs.existsSync(entry)) {
        throw new Error(`Astro renderer output missing before packaging: ${entry}`);
      }
      const destination = path.join(buildPath, '.vite', 'renderer', 'astro_window');
      fs.rmSync(destination, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.cpSync(astroOutput, destination, { recursive: true });
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'research_observatory',
        authors: 'PME26Elvis',
        exe: 'llm-research-archive-desktop.exe',
        setupExe: windowsSetupName(),
      },
    },
    { name: '@electron-forge/maker-zip', platforms: ['win32', 'linux', 'darwin'], config: {} },
    {
      name: '@electron-forge/maker-deb',
      config: { options: { name: 'research-observatory', productName: 'Research Observatory' } },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: { options: { name: 'research-observatory', productName: 'Research Observatory' } },
    },
  ],
  plugins: [
    new VitePlugin({
      build: [
        { entry: 'apps/desktop-electron/src/main/main.ts', config: 'vite.main.config.ts' },
        {
          entry: 'apps/desktop-electron/src/preload/preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [{ name: 'main_window', config: 'vite.renderer.config.ts' }],
    }),
  ],
};
export default config;
