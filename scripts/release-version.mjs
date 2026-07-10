import fs from 'node:fs';

export function rootPackageVersion(root = process.cwd()) {
  return JSON.parse(fs.readFileSync(`${root}/package.json`, 'utf8')).version;
}

export function artifactNames(version = rootPackageVersion()) {
  return [
    `research-observatory-${version}-windows-x64-setup.exe`,
    `research-observatory-${version}-windows-x64-portable.zip`,
    `research-observatory-${version}-linux-x64-portable.zip`,
    `research-observatory-${version}-linux-x64.deb`,
    `research-observatory-${version}-linux-x64.rpm`,
  ];
}

export function windowsSetupName(version = rootPackageVersion()) {
  return artifactNames(version)[0];
}

export function validateSemver(version) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version);
}
