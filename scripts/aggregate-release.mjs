import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const input = process.argv[2] || 'dist/release-assets';
const out = process.argv[3] || 'dist/aggregate-release';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const expected = [
  /^research-observatory-.+-windows-x64-setup\.exe$/,
  /^research-observatory-.+-windows-x64-portable\.zip$/,
  /^research-observatory-.+-linux-x64-portable\.zip$/,
  /^research-observatory-.+-linux-x64\.deb$/,
  /^research-observatory-.+-linux-x64\.rpm$/,
];
const files = fs.readdirSync(input).filter((f) => /\.(exe|zip|deb|rpm)$/.test(f));
if (files.length !== 5)
  throw new Error(`expected exactly 5 binary artifacts, got ${files.length}: ${files.join(', ')}`);
for (const re of expected)
  if (!files.some((f) => re.test(f))) throw new Error(`missing expected artifact ${re}`);
const names = new Set();
const artifacts = [];
for (const f of files.sort()) {
  if (names.has(f)) throw new Error(`duplicate artifact ${f}`);
  names.add(f);
  fs.copyFileSync(path.join(input, f), path.join(out, f));
  const buf = fs.readFileSync(path.join(out, f));
  artifacts.push({
    name: f,
    size: buf.length,
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
  });
}
fs.writeFileSync(
  path.join(out, 'SHA256SUMS.txt'),
  artifacts.map((a) => `${a.sha256}  ${a.name}`).join('\n') + '\n',
);
fs.writeFileSync(path.join(out, 'release-manifest.json'), JSON.stringify({ artifacts }, null, 2));
console.log(`aggregated ${artifacts.length} artifacts`);
