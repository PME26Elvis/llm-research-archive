import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { artifactNames } from './release-version.mjs';

const input = process.argv[2] || 'dist/release-assets';
const out = process.argv[3] || 'dist/aggregate-release';
const version =
  process.env.RELEASE_VERSION || JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const tag = process.env.RELEASE_TAG || `v${version}`;
const targetCommit = process.env.RELEASE_TARGET_COMMIT || process.env.GITHUB_SHA || 'local';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const expected = artifactNames(version);
const files = fs
  .readdirSync(input)
  .filter((f) => /\.(exe|zip|deb|rpm)$/.test(f))
  .sort();
if (files.length !== expected.length)
  throw new Error(
    `expected exactly ${expected.length} binary artifacts, got ${files.length}: ${files.join(', ')}`,
  );
for (const name of expected)
  if (!files.includes(name)) throw new Error(`missing expected artifact ${name}`);
for (const f of files)
  if (!expected.includes(f))
    throw new Error(`unexpected artifact ${f}; expected version ${version}`);
const artifacts = [];
for (const f of files) {
  fs.copyFileSync(path.join(input, f), path.join(out, f));
  const buf = fs.readFileSync(path.join(out, f));
  if (buf.length === 0) throw new Error(`zero-byte artifact ${f}`);
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
fs.writeFileSync(
  path.join(out, 'release-manifest.json'),
  JSON.stringify(
    { version, tag, targetCommit, generatedAt: new Date().toISOString(), artifacts },
    null,
    2,
  ),
);
console.log(`aggregated ${artifacts.length} artifacts for ${tag}`);
