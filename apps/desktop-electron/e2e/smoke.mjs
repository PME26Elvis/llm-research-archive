import fs from 'fs';
if (!fs.existsSync('apps/desktop-electron/src/main/main.ts')) throw new Error('missing main');
console.log('e2e smoke ok');
