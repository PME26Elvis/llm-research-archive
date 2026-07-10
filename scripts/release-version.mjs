import fs from 'node:fs';
import semver from 'semver';

export function rootPackageVersion(root = process.cwd()) {
  return JSON.parse(fs.readFileSync(`${root}/package.json`, 'utf8')).version;
}

export function assertValidSemver(version, label = 'version') {
  if (!semver.valid(version)) throw new Error(`${label} is not valid SemVer: ${version}`);
  return version;
}

export function artifactNames(version = rootPackageVersion()) {
  assertValidSemver(version, 'artifact version');
  return [
    `research-observatory-${version}-windows-x64-setup.exe`,
    `research-observatory-${version}-windows-x64-portable.zip`,
    `research-observatory-${version}-linux-x64-portable.zip`,
    `research-observatory-${version}-linux-x64.deb`,
    `research-observatory-${version}-linux-x64.rpm`,
  ];
}

export function releaseAssetNames(version = rootPackageVersion()) {
  return [...artifactNames(version), 'SHA256SUMS.txt', 'release-manifest.json', 'sbom.cdx.json'];
}

export function windowsSetupName(version = rootPackageVersion()) {
  return artifactNames(version)[0];
}

export function validateSemver(version) {
  return Boolean(semver.valid(version));
}
