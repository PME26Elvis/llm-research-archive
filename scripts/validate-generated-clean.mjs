import { execFileSync } from 'node:child_process';
const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);
const forbidden = [
  /^\.vite\//,
  /^out\//,
  /^dist\//,
  /^apps\/desktop-electron\/resources\/archive-manifest\.json$/,
  /\.(exe|deb|rpm|nupkg)$/i,
];
const bad = tracked.filter((p) => forbidden.some((r) => r.test(p)));
if (bad.length) {
  console.error(`generated files are tracked:\n${bad.join('\n')}`);
  process.exit(1);
}
console.log('generated clean ok');
