import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import semver from 'semver';
import { applyReleaseVersion } from './apply-release-version.mjs';
import {
  artifactNames,
  releaseAssetNames,
  rootPackageVersion,
  selectReleaseVersion,
  validateSemver,
  windowsSetupName,
} from './release-version.mjs';

const version = rootPackageVersion();
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const forge = fs.readFileSync('forge.config.ts', 'utf8');
const releaseWorkflow = fs.readFileSync('.github/workflows/desktop-release-reusable.yml', 'utf8');
if (!forge.includes('windowsSetupName()')) {
  throw new Error('Forge Squirrel setup filename must come from windowsSetupName()');
}
if (!/platforms:\s*\[\s*['"]win32['"]\s*,\s*['"]linux['"]\s*,\s*['"]darwin['"]\s*\]/.test(forge)) {
  throw new Error('Forge ZIP maker must support win32, linux, and darwin');
}
const applyVersionCommand = 'run: node scripts/apply-release-version.mjs';
const applyVersionStepCount = releaseWorkflow.split(applyVersionCommand).length - 1;
if (applyVersionStepCount !== 4) {
  throw new Error(
    `all four release stages must use the cross-platform version applicator; found ${applyVersionStepCount}`,
  );
}
if (releaseWorkflow.includes('npm version "$RELEASE_VERSION"')) {
  throw new Error('release workflow must not use shell-specific RELEASE_VERSION expansion');
}
if (!releaseWorkflow.includes("release_notes: { type: string, required: false, default: '' }")) {
  throw new Error('release workflow must expose an optional structured release_notes input');
}
const releaseNotesCommand = 'run: node scripts/release-notes.mjs /tmp/release-notes.md';
const releaseNotesStepCount = releaseWorkflow.split(releaseNotesCommand).length - 1;
if (releaseNotesStepCount !== 2) {
  throw new Error(
    `release notes must be validated in preflight and rendered in release; found ${releaseNotesStepCount}`,
  );
}
if (!releaseWorkflow.includes('--notes-file /tmp/release-notes.md')) {
  throw new Error('GitHub release body must use the rendered Markdown notes file');
}
const packageFootprintCommand = 'run: npm run validate:footprint:package';
const packageFootprintStepCount = releaseWorkflow.split(packageFootprintCommand).length - 1;
if (packageFootprintStepCount !== 1) {
  throw new Error(
    `release build matrix must enforce installed package footprint exactly once; found ${packageFootprintStepCount}`,
  );
}
const preflightStart = releaseWorkflow.indexOf('  preflight:\n');
const buildStart = releaseWorkflow.indexOf('  build:\n');
if (preflightStart < 0 || buildStart <= preflightStart) {
  throw new Error('release workflow must contain ordered preflight and build jobs');
}
const preflightWorkflow = releaseWorkflow.slice(preflightStart, buildStart);
if (!preflightWorkflow.includes('    permissions:\n      contents: write\n')) {
  throw new Error('release preflight needs contents: write to discover draft releases');
}
if (!preflightWorkflow.includes('/releases?per_page=100')) {
  throw new Error('release preflight must enumerate GitHub releases before selecting a version');
}
const artifacts = artifactNames(version);
if (artifacts.length !== 7)
  throw new Error(`expected seven binary artifacts, got ${artifacts.length}`);
for (const name of artifacts) {
  if (!name.includes(version)) throw new Error(`artifact name missing package version: ${name}`);
}
for (const name of [
  `research-observatory-${version}-macos-arm64.zip`,
  `research-observatory-${version}-macos-x64.zip`,
]) {
  if (!artifacts.includes(name)) throw new Error(`missing macOS artifact name ${name}`);
}
if (releaseAssetNames(version).length !== 10) {
  throw new Error('release must contain seven binaries and three metadata assets');
}
if (windowsSetupName(version) !== `research-observatory-${version}-windows-x64-setup.exe`) {
  throw new Error('unexpected Windows setup filename');
}
for (const script of ['make:macos:arm64', 'make:macos:x64']) {
  if (!pkg.scripts[script]) throw new Error(`missing package script ${script}`);
}
if (pkg.scripts['release:assets'] !== 'node scripts/release-assets.mjs all') {
  throw new Error('release:assets must explicitly call release-assets.mjs all');
}
for (const invalid of ['01.0.0', '1.0', '1.0.0-', '1.0.0-alpha..1']) {
  if (validateSemver(invalid)) throw new Error(`invalid SemVer accepted: ${invalid}`);
}

const versionWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'release-version-'));
try {
  fs.writeFileSync(
    path.join(versionWorkspace, 'package.json'),
    `${JSON.stringify({ name: 'fixture', version: '0.1.0' }, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(versionWorkspace, 'package-lock.json'),
    `${JSON.stringify(
      {
        name: 'fixture',
        version: '0.1.0',
        lockfileVersion: 3,
        packages: { '': { name: 'fixture', version: '0.1.0' } },
      },
      null,
      2,
    )}\n`,
  );
  applyReleaseVersion('2.3.4', versionWorkspace);
  const appliedPackage = JSON.parse(
    fs.readFileSync(path.join(versionWorkspace, 'package.json'), 'utf8'),
  );
  const appliedLock = JSON.parse(
    fs.readFileSync(path.join(versionWorkspace, 'package-lock.json'), 'utf8'),
  );
  if (appliedPackage.version !== '2.3.4') {
    throw new Error('cross-platform version applicator did not update package.json');
  }
  if (appliedLock.version !== '2.3.4' || appliedLock.packages[''].version !== '2.3.4') {
    throw new Error('cross-platform version applicator did not update package-lock.json');
  }
} finally {
  fs.rmSync(versionWorkspace, { recursive: true, force: true });
}

const first = selectReleaseVersion({
  packageVersion: version,
  existingTags: [],
});
if (first.version !== version || first.source !== 'package-version') {
  throw new Error(`unexpected first automatic version: ${JSON.stringify(first)}`);
}
const nextPatch = selectReleaseVersion({
  packageVersion: version,
  existingTags: [`v${version}`],
});
if (nextPatch.version !== semver.inc(version, 'patch') || nextPatch.source !== 'auto-next-patch') {
  throw new Error(
    `automatic version did not advance after collision: ${JSON.stringify(nextPatch)}`,
  );
}
const draftNextPatch = selectReleaseVersion({
  packageVersion: version,
  reusableDraftTags: [`v${version}`],
});
if (
  draftNextPatch.version !== semver.inc(version, 'patch') ||
  draftNextPatch.source !== 'auto-next-patch'
) {
  throw new Error(`blank version did not advance past draft: ${JSON.stringify(draftNextPatch)}`);
}
const higher = selectReleaseVersion({
  packageVersion: version,
  existingTags: ['v9.4.2'],
});
if (higher.version !== '9.4.3')
  throw new Error(`unexpected highest-tag increment: ${higher.version}`);
const requested = selectReleaseVersion({
  packageVersion: version,
  requestedVersion: '2.3.4',
  existingTags: [],
});
if (requested.version !== '2.3.4' || requested.source !== 'requested') {
  throw new Error(`unexpected requested version: ${JSON.stringify(requested)}`);
}
const requestedDraft = selectReleaseVersion({
  packageVersion: version,
  requestedVersion: '2.3.4',
  reusableDraftTags: ['v2.3.4'],
});
if (requestedDraft.version !== '2.3.4' || requestedDraft.source !== 'requested-draft') {
  throw new Error(`existing draft was not reusable: ${JSON.stringify(requestedDraft)}`);
}
let collisionRejected = false;
try {
  selectReleaseVersion({
    packageVersion: version,
    requestedVersion: '2.3.4',
    existingTags: ['v2.3.4'],
  });
} catch {
  collisionRejected = true;
}
if (!collisionRejected) throw new Error('explicit published version collision was not rejected');

console.log(
  `release validation passed for ${version}: cross-platform version application, automatic versioning, draft promotion, and Windows/Linux/macOS artifact names are valid`,
);
