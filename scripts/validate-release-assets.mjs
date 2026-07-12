import fs from 'node:fs';
import semver from 'semver';
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
if (!forge.includes('windowsSetupName()')) {
  throw new Error('Forge Squirrel setup filename must come from windowsSetupName()');
}
if (!forge.includes('platforms: ["win32", "linux", "darwin"]')) {
  throw new Error('Forge ZIP maker must support win32, linux, and darwin');
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
if (!collisionRejected) throw new Error('explicit release version collision was not rejected');

console.log(
  `release validation passed for ${version}: automatic versioning and Windows/Linux/macOS artifact names are valid`,
);
