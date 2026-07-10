import { createManifest } from '../packages/content-engine/src/index.ts';
import fs from 'fs';
fs.mkdirSync('apps/desktop-electron/resources', { recursive: true });
fs.writeFileSync(
  'apps/desktop-electron/resources/archive-manifest.json',
  JSON.stringify(createManifest('docs'), null, 2),
);
console.log('manifest generated');
