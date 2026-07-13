import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isVulnerabilityExcepted, validateExceptions } from './dependency-policy.mjs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const inventory = JSON.parse(
  fs.readFileSync('project-docs/quality/dependency-inventory.json', 'utf8'),
);
if (inventory.schemaVersion !== 1 || !Array.isArray(inventory.entries)) {
  throw new Error('invalid dependency inventory');
}
const expected = new Map();
for (const section of ['dependencies', 'devDependencies']) {
  for (const [name, range] of Object.entries(pkg[section] ?? {})) {
    expected.set(`${section}:${name}`, { name, section, range });
    if (range === '*' || range === 'latest' || /[xX]$/.test(range)) {
      throw new Error(`unbounded dependency range for ${name}: ${range}`);
    }
  }
}
const actual = new Map();
for (const entry of inventory.entries) {
  if (
    !entry ||
    typeof entry.name !== 'string' ||
    !['dependencies', 'devDependencies'].includes(entry.section) ||
    typeof entry.range !== 'string' ||
    typeof entry.purpose !== 'string' ||
    typeof entry.owner !== 'string' ||
    typeof entry.updateCadence !== 'string'
  ) {
    throw new Error('invalid dependency inventory entry');
  }
  const key = `${entry.section}:${entry.name}`;
  if (actual.has(key)) throw new Error(`duplicate dependency inventory entry: ${key}`);
  actual.set(key, entry);
}
const mismatches = [];
for (const [key, dependency] of expected) {
  const entry = actual.get(key);
  if (!entry) mismatches.push(`missing inventory entry ${key}`);
  else if (entry.range !== dependency.range) {
    mismatches.push(`${key} inventory ${entry.range} != package.json ${dependency.range}`);
  }
}
for (const key of actual.keys()) {
  if (!expected.has(key)) mismatches.push(`stale inventory entry ${key}`);
}
if (mismatches.length)
  throw new Error(`dependency inventory mismatch:\n- ${mismatches.join('\n- ')}`);

const exceptionDocument = JSON.parse(
  fs.readFileSync('project-docs/quality/dependency-vulnerability-exceptions.json', 'utf8'),
);
const exceptions = validateExceptions(exceptionDocument);
const auditDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-production-audit-'));
let audit;
try {
  fs.writeFileSync(
    path.join(auditDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: 'research-observatory-production-audit',
        version: pkg.version,
        private: true,
        dependencies: pkg.dependencies ?? {},
      },
      null,
      2,
    )}\n`,
  );
  const install = spawnSync(
    'npm',
    ['install', '--package-lock-only', '--ignore-scripts', '--omit=dev'],
    {
      cwd: auditDirectory,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      shell: process.platform === 'win32',
    },
  );
  if (install.status !== 0) {
    throw new Error(`production dependency lock failed: ${install.stderr || install.stdout}`);
  }
  audit = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
    cwd: auditDirectory,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
} finally {
  fs.rmSync(auditDirectory, { recursive: true, force: true });
}
if (!audit?.stdout) throw new Error(`npm audit produced no JSON: ${audit?.stderr || 'no output'}`);
let auditReport;
try {
  auditReport = JSON.parse(audit.stdout);
} catch (error) {
  throw new Error(`unable to parse npm audit JSON: ${error}`);
}
const blocking = [];
const excepted = [];
for (const [name, vulnerability] of Object.entries(auditReport.vulnerabilities ?? {})) {
  if (!['high', 'critical'].includes(vulnerability.severity)) continue;
  if (isVulnerabilityExcepted(name, vulnerability, exceptions)) {
    excepted.push({ name, severity: vulnerability.severity });
  } else {
    blocking.push({
      name,
      severity: vulnerability.severity,
      range: vulnerability.range,
      via: vulnerability.via,
    });
  }
}
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  auditScope: 'isolated-production-lockfile',
  directDependencies: pkg.dependencies ?? {},
  directDevDependencies: pkg.devDependencies ?? {},
  auditMetadata: auditReport.metadata ?? {},
  excepted,
  blocking,
};
fs.mkdirSync('dist/quality', { recursive: true });
fs.writeFileSync('dist/quality/dependency-governance.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (blocking.length) {
  throw new Error(
    `high or critical production dependency vulnerabilities:\n- ${blocking
      .map((item) => `${item.name} (${item.severity}) ${item.range ?? ''}`)
      .join('\n- ')}`,
  );
}
