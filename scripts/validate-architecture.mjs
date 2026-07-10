import fs from 'fs';
import path from 'path';
const bad = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory() && !['node_modules', '.git', 'dist'].includes(e.name)) walk(p);
    else if (/\.(ts|tsx)$/.test(p)) {
      const s = fs.readFileSync(p, 'utf8');
      if (p.startsWith('packages/') && s.includes("'electron'")) bad.push(`${p}: electron import`);
      if (p.includes('/renderer/') && /(from 'node:|from 'fs'|from 'electron')/.test(s))
        bad.push(`${p}: renderer node/electron import`);
    }
  }
};
walk('packages');
if (fs.existsSync('apps')) walk('apps');
if (bad.length) {
  console.error(bad.join('\n'));
  process.exit(1);
}
console.log('architecture ok');
