import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const input = process.argv[2] || 'dist/release-assets';
const out = process.argv[3] || 'dist/aggregate-release';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const files = fs.readdirSync(input).filter((f) => /\.(exe|zip|deb|rpm)$/.test(f));
const names = new Set();
const artifacts = [];
for (const f of files) {
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
if (!artifacts.length) throw new Error('no artifacts to aggregate');
fs.writeFileSync(
  path.join(out, 'SHA256SUMS.txt'),
  artifacts.map((a) => `${a.sha256}  ${a.name}`).join('\n') + '\n',
);
fs.writeFileSync(path.join(out, 'release-manifest.json'), JSON.stringify({ artifacts }, null, 2));
fs.writeFileSync(
  path.join(out, 'sbom.cdx.json'),
  JSON.stringify(
    {
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      metadata: { component: { type: 'application', name: 'Research Observatory' } },
      components: Object.keys(
        JSON.parse(fs.readFileSync('package-lock.json', 'utf8')).packages || {},
      )
        .filter(Boolean)
        .map((p) => ({
          type: 'library',
          name: p.replace(/^node_modules\//, ''),
          version: 'locked',
        })),
    },
    null,
    2,
  ),
);
console.log(`aggregated ${artifacts.length} artifacts`);
