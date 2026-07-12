import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertValidSemver } from './release-version.mjs';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function applyReleaseVersion(version, root = process.cwd()) {
  const releaseVersion = assertValidSemver(version, 'RELEASE_VERSION');
  const packagePath = path.join(root, 'package.json');
  const lockPath = path.join(root, 'package-lock.json');

  const pkg = readJson(packagePath);
  pkg.version = releaseVersion;
  writeJson(packagePath, pkg);

  if (fs.existsSync(lockPath)) {
    const lock = readJson(lockPath);
    lock.version = releaseVersion;
    if (lock.packages?.['']) lock.packages[''].version = releaseVersion;
    writeJson(lockPath, lock);
  }

  return releaseVersion;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const version = applyReleaseVersion(process.env.RELEASE_VERSION);
  console.log(`applied release version ${version}`);
}
