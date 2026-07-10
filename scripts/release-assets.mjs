import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = process.cwd();
const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const platform = process.argv[2] || (process.platform === 'win32' ? 'windows' : 'linux');
const out = path.join(root, 'dist/release-assets');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
function walk(dir) {
  return fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        return e.isDirectory() ? walk(p) : [p];
      })
    : [];
}
const forgeOut = path.join(root, 'out');
const files = walk(forgeOut);
const specs =
  platform === 'windows'
    ? [
        { match: /Setup\.exe$/i, name: `research-observatory-${version}-windows-x64-setup.exe` },
        {
          match: /win32-x64.*\.zip$/i,
          name: `research-observatory-${version}-windows-x64-portable.zip`,
        },
      ]
    : [
        { match: /\.deb$/i, name: `research-observatory-${version}-linux-x64.deb` },
        { match: /\.rpm$/i, name: `research-observatory-${version}-linux-x64.rpm` },
        {
          match: /linux-x64.*\.zip$/i,
          name: `research-observatory-${version}-linux-x64-portable.zip`,
        },
      ];
const artifacts = [];
for (const spec of specs) {
  const found = files.find((f) => spec.match.test(f));
  if (!found) throw new Error(`missing real Forge output for ${spec.name}; searched ${forgeOut}`);
  const dest = path.join(out, spec.name);
  fs.copyFileSync(found, dest);
  const buf = fs.readFileSync(dest);
  artifacts.push({
    sourcePath: path.relative(root, found),
    name: spec.name,
    path: path.relative(root, dest),
    size: buf.length,
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
  });
}
fs.writeFileSync(
  path.join(out, `${platform}-manifest.json`),
  JSON.stringify({ platform, version, artifacts }, null, 2),
);
fs.writeFileSync(
  path.join(out, `${platform}-SHA256SUMS.txt`),
  artifacts.map((a) => `${a.sha256}  ${a.name}`).join('\n') + '\n',
);
console.log(`normalized ${artifacts.length} ${platform} artifacts`);
