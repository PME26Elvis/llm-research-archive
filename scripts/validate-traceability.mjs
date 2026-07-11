import fs from 'node:fs';
import yaml from 'js-yaml';

const req = yaml.load(fs.readFileSync('project-docs/traceability/requirements.yaml', 'utf8'));
const ids = new Set();
const acceptance = fs.readFileSync('project-docs/quality/acceptance-matrix.md', 'utf8');
const acceptanceRows = new Map(
  [...acceptance.matchAll(/^\|\s*((?:FR|NFR)-\d{3})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm)].map(
    (match) => [
      match[1],
      {
        title: match[2].trim(),
        status: match[3].trim(),
      },
    ],
  ),
);

const productSpec = fs.readFileSync('project-docs/product/desktop-product-spec.md', 'utf8');
const productRequirements = new Map();
const sectionRe =
  /^##\s+((?:FR|NFR)-\d{3})\s*$([\s\S]*?)(?=^##\s+(?:FR|NFR)-\d{3}\s*$|$(?![\s\S]))/gm;
for (const match of productSpec.matchAll(sectionRe)) {
  const title = match[2].match(/\*\*Name:\*\*\s*([^\n.]+(?:\.[^\n]*)?)/);
  const status = match[2].match(/Status:\s*`([^`]+)`/);
  if (!title) throw new Error(`missing Product Spec Name for ${match[1]}`);
  if (!status) throw new Error(`missing Product Spec Status for ${match[1]}`);
  productRequirements.set(match[1], {
    title: title[1].trim().replace(/\.$/, ''),
    status: status[1],
  });
}

const validVerification =
  /(__tests__|\.test\.|\.spec\.|e2e\/|scripts\/(node-smoke|packaged-smoke|validate-[^/]+|release-assets|aggregate-release|verify-release-assets)\.mjs|project-docs\/migration\/mkdocs-feature-parity-matrix\.md|project-docs\/release\/verification-run-\d+\.md|\.github\/workflows\/desktop-(ci|release-reusable)\.yml)/;

for (const requirement of req) {
  if (ids.has(requirement.id)) throw new Error(`duplicate ${requirement.id}`);
  ids.add(requirement.id);
  if (typeof requirement.title !== 'string' || !requirement.title.trim()) {
    throw new Error(`missing requirement title ${requirement.id}`);
  }
  if (requirement.title.trim() === requirement.id) {
    throw new Error(`placeholder requirement title ${requirement.id}`);
  }
  if (!['implemented', 'planned', 'implemented-pending-ci'].includes(requirement.status)) {
    throw new Error(`invalid status ${requirement.id}`);
  }
  if (!fs.existsSync(requirement.source?.document || '')) {
    throw new Error(`missing source document ${requirement.id}`);
  }
  const sourceText = fs.readFileSync(requirement.source.document, 'utf8');
  if (!new RegExp(`^##\\s+${requirement.source.section}\\s*$`, 'm').test(sourceText)) {
    throw new Error(`missing source section ${requirement.id}`);
  }
  if (requirement.status !== 'planned') {
    if (!requirement.verification?.tests?.length) {
      throw new Error(`${requirement.status} requirement missing verification ${requirement.id}`);
    }
    for (const artifact of requirement.verification.tests) {
      if (!fs.existsSync(artifact)) throw new Error(`missing verification artifact ${artifact}`);
      if (!validVerification.test(artifact)) {
        throw new Error(`verification is not a test/runtime check: ${artifact}`);
      }
    }
  }
  if (requirement.status === 'planned' && requirement.verification?.tests?.length) {
    throw new Error(`planned requirement must not claim tests ${requirement.id}`);
  }

  const acceptanceRow = acceptanceRows.get(requirement.id);
  if (!acceptanceRow) throw new Error(`Acceptance Matrix missing ${requirement.id}`);
  if (acceptanceRow.title !== requirement.title) {
    throw new Error(
      `acceptance title mismatch ${requirement.id}: ${acceptanceRow.title} !== ${requirement.title}`,
    );
  }
  if (acceptanceRow.status !== requirement.status) {
    throw new Error(`acceptance status mismatch ${requirement.id}`);
  }

  const productRequirement = productRequirements.get(requirement.id);
  if (!productRequirement) throw new Error(`Product Spec missing ${requirement.id}`);
  if (productRequirement.title !== requirement.title) {
    throw new Error(
      `product spec title mismatch ${requirement.id}: ${productRequirement.title} !== ${requirement.title}`,
    );
  }
  if (productRequirement.status !== requirement.status) {
    throw new Error(
      `product spec status mismatch ${requirement.id}: ${productRequirement.status} !== ${requirement.status}`,
    );
  }
}

if (acceptanceRows.size !== ids.size) {
  throw new Error('requirements and acceptance matrix ID counts differ');
}
if (productRequirements.size !== ids.size) {
  throw new Error('requirements and Product Spec ID counts differ');
}
for (const id of acceptanceRows.keys()) if (!ids.has(id)) throw new Error(`YAML missing ${id}`);
for (const id of productRequirements.keys()) if (!ids.has(id)) throw new Error(`YAML missing ${id}`);

console.log('traceability ok');
