import type { ForgeConfig } from '@electron-forge/shared-types';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { windowsSetupName } from './scripts/release-version.mjs';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    executableName: 'llm-research-archive-desktop',
    extraResource: ['apps/desktop-electron/resources/archive-manifest.json', 'docs'],
  },
  rebuildConfig: {},
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
    { name: '@electron-forge/maker-zip', platforms: ['win32', 'linux'], config: {} },
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
        { entry: 'apps/desktop-electron/src/preload/preload.ts', config: 'vite.preload.config.ts' },
      ],
      renderer: [{ name: 'main_window', config: 'vite.renderer.config.ts' }],
    }),
  ],
};
export default config;
