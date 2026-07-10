import fs from 'fs';
import yaml from 'js-yaml';
const req = yaml.load(fs.readFileSync('project-docs/traceability/requirements.yaml', 'utf8'));
const ids = new Set();
for (const r of req) {
  if (ids.has(r.id)) throw new Error(`duplicate ${r.id}`);
  ids.add(r.id);
  if (!r.verification?.tests?.length) throw new Error(`missing verification ${r.id}`);
  for (const t of r.verification.tests) if (!fs.existsSync(t)) throw new Error(`missing test ${t}`);
}
const acc = fs.readFileSync('project-docs/quality/acceptance-matrix.md', 'utf8');
for (const id of ids) if (!acc.includes(id)) throw new Error(`acceptance missing ${id}`);
console.log('traceability ok');
