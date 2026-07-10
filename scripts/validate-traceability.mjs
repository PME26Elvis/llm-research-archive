import fs from 'node:fs';
import yaml from 'js-yaml';
const req = yaml.load(fs.readFileSync('project-docs/traceability/requirements.yaml', 'utf8'));
const ids = new Set();
for (const r of req) {
  if (ids.has(r.id)) throw new Error(`duplicate ${r.id}`);
  ids.add(r.id);
  if (!['implemented', 'planned'].includes(r.status)) throw new Error(`invalid status ${r.id}`);
  if (r.status === 'implemented') {
    if (!r.verification?.tests?.length)
      throw new Error(`implemented requirement missing verification ${r.id}`);
    for (const t of r.verification.tests)
      if (!fs.existsSync(t)) throw new Error(`missing verification artifact ${t}`);
  }
  if (r.status === 'planned' && r.verification?.tests?.length)
    throw new Error(`planned requirement must not claim tests ${r.id}`);
}
const acceptance = fs.readFileSync('project-docs/quality/acceptance-matrix.md', 'utf8');
const acceptanceIds = new Set(
  [...acceptance.matchAll(/\|\s*((?:FR|NFR)-\d{3})\s*\|/g)].map((m) => m[1]),
);
if (acceptanceIds.size !== ids.size)
  throw new Error('requirements and acceptance matrix ID counts differ');
for (const id of ids) if (!acceptanceIds.has(id)) throw new Error(`acceptance missing ${id}`);
for (const id of acceptanceIds) if (!ids.has(id)) throw new Error(`YAML missing ${id}`);
const spec = fs.readFileSync('project-docs/product/desktop-product-spec.md', 'utf8');
for (const id of [
  'FR-001',
  'FR-003',
  'FR-007',
  'FR-008',
  'FR-009',
  'NFR-001',
  'NFR-002',
  'NFR-003',
  'NFR-004',
  'NFR-005',
])
  if (!ids.has(id) || !spec.includes('P1'))
    throw new Error(`mandatory status context missing ${id}`);
console.log('traceability ok');
