export default {
  packagerConfig: { asar: true, extraResource: ['resources/archive-manifest.json'] },
  makers: [
    { name: '@electron-forge/maker-zip', platforms: ['win32', 'linux'] },
    { name: '@electron-forge/maker-deb', config: {} },
    { name: '@electron-forge/maker-rpm', config: {} },
  ],
};
