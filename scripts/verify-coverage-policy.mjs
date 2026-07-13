import fs from 'node:fs';
import path from 'node:path';

const reportPath = path.resolve('coverage/coverage-final.json');
if (!fs.existsSync(reportPath)) throw new Error(`coverage report missing: ${reportPath}`);
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const policies = [
  { name: 'overall', match: () => true, statements: 80, branches: 75 },
  {
    name: 'packages/domain',
    match: (file) => file.includes('/packages/domain/src/'),
    statements: 95,
    branches: 90,
  },
  {
    name: 'packages/content-engine',
    match: (file) => file.includes('/packages/content-engine/src/'),
    statements: 90,
    branches: 85,
  },
  {
    name: 'packages/application',
    match: (file) => file.includes('/packages/application/src/'),
    statements: 90,
    branches: 85,
  },
];

function ratio(covered, total) {
  return total === 0 ? 100 : (covered / total) * 100;
}

function summarize(files) {
  let statementsCovered = 0;
  let statementsTotal = 0;
  let branchesCovered = 0;
  let branchesTotal = 0;
  let functionsCovered = 0;
  let functionsTotal = 0;
  for (const file of files) {
    const entry = report[file];
    const statementValues = Object.values(entry.s ?? {});
    statementsTotal += statementValues.length;
    statementsCovered += statementValues.filter((value) => value > 0).length;
    const branchValues = Object.values(entry.b ?? {}).flat();
    branchesTotal += branchValues.length;
    branchesCovered += branchValues.filter((value) => value > 0).length;
    const functionValues = Object.values(entry.f ?? {});
    functionsTotal += functionValues.length;
    functionsCovered += functionValues.filter((value) => value > 0).length;
  }
  return {
    files: files.length,
    statements: ratio(statementsCovered, statementsTotal),
    branches: ratio(branchesCovered, branchesTotal),
    functions: ratio(functionsCovered, functionsTotal),
    counts: {
      statements: { covered: statementsCovered, total: statementsTotal },
      branches: { covered: branchesCovered, total: branchesTotal },
      functions: { covered: functionsCovered, total: functionsTotal },
    },
  };
}

const files = Object.keys(report).map((file) => file.replaceAll('\\', '/'));
const results = policies.map((policy) => {
  const selected = files.filter(policy.match);
  if (!selected.length) throw new Error(`coverage policy ${policy.name} matched no files`);
  const metrics = summarize(selected);
  return {
    name: policy.name,
    thresholds: { statements: policy.statements, branches: policy.branches },
    ...metrics,
  };
});

const failures = [];
for (const policy of policies) {
  const result = results.find((candidate) => candidate.name === policy.name);
  if (!result) throw new Error(`coverage result missing for ${policy.name}`);
  if (result.statements + 1e-9 < policy.statements) {
    failures.push(
      `${policy.name} statements ${result.statements.toFixed(2)}% < ${policy.statements}%`,
    );
  }
  if (result.branches + 1e-9 < policy.branches) {
    failures.push(`${policy.name} branches ${result.branches.toFixed(2)}% < ${policy.branches}%`);
  }
}

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  results,
  failures,
};
fs.mkdirSync('dist/quality', { recursive: true });
fs.writeFileSync('dist/quality/coverage-policy.json', `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (failures.length) throw new Error(`coverage policy failed:\n- ${failures.join('\n- ')}`);
