import fs from 'fs';
const main = fs.readFileSync('apps/desktop-electron/src/main/main.ts', 'utf8');
for (const token of ['contextIsolation: true', 'sandbox: true', 'nodeIntegration: false'])
  if (!main.includes(token)) throw new Error(`missing ${token}`);
console.log('security ok');
