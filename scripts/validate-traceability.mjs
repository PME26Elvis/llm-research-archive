import fs from 'node:fs';
import yaml from 'js-yaml';
const req = yaml.load(fs.readFileSync('project-docs/traceability/requirements.yaml', 'utf8'));
const ids = new Set();
const acceptance = fs.readFileSync('project-docs/quality/acceptance-matrix.md', 'utf8');
const acceptanceRows = new Map(
  [...acceptance.matchAll(/\|\s*((?:FR|NFR)-\d{3})\s*\|\s*([^|]+?)\s*\|/g)].map((m) => [
    m[1],
    m[2].trim(),
  ]),
);
const validVerification =
  /(__tests__|\.test\.|\.spec\.|e2e\/|scripts\/(node-smoke|packaged-smoke|validate-[^/]+|release-assets|aggregate-release)\.mjs|project-docs\/migration\/mkdocs-feature-parity-matrix\.md)/;
for (const r of req) {
  if (ids.has(r.id)) throw new Error(`duplicate ${r.id}`);
  ids.add(r.id);
  if (!['implemented', 'planned', 'implemented-pending-ci'].includes(r.status))
    throw new Error(`invalid status ${r.id}`);
  if (!fs.existsSync(r.source?.document || '')) throw new Error(`missing source document ${r.id}`);
  const sourceText = fs.readFileSync(r.source.document, 'utf8');
  if (!new RegExp(`^##\\s+${r.source.section}\\s*$`, 'm').test(sourceText))
    throw new Error(`missing source section ${r.id}`);
  if (r.status !== 'planned') {
    if (!r.verification?.tests?.length)
      throw new Error(`${r.status} requirement missing verification ${r.id}`);
    for (const t of r.verification.tests) {
      if (!fs.existsSync(t)) throw new Error(`missing verification artifact ${t}`);
      if (!validVerification.test(t))
        throw new Error(`verification is not a test/runtime check: ${t}`);
    }
  }
  if (r.status === 'planned' && r.verification?.tests?.length)
    throw new Error(`planned requirement must not claim tests ${r.id}`);
  if (acceptanceRows.get(r.id) !== r.status) throw new Error(`acceptance status mismatch ${r.id}`);
}
if (acceptanceRows.size !== ids.size)
  throw new Error('requirements and acceptance matrix ID counts differ');
for (const id of acceptanceRows.keys()) if (!ids.has(id)) throw new Error(`YAML missing ${id}`);
console.log('traceability ok');
