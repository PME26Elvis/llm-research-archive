import fs from 'node:fs';
import {
  artifactNames,
  windowsSetupName,
  rootPackageVersion,
  validateSemver,
} from './release-version.mjs';
const version = rootPackageVersion();
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const forge = fs.readFileSync('forge.config.ts', 'utf8');
if (!forge.includes('windowsSetupName()'))
  throw new Error('Forge Squirrel setup filename must come from windowsSetupName()');
for (const name of artifactNames(version)) {
  if (!name.includes(version)) throw new Error(`artifact name missing package version: ${name}`);
}
if (windowsSetupName(version) !== `research-observatory-${version}-windows-x64-setup.exe`)
  throw new Error('unexpected Windows setup filename');
if (pkg.scripts['release:assets'] !== 'node scripts/release-assets.mjs all')
  throw new Error('release:assets must explicitly call release-assets.mjs all');
for (const invalid of ['01.0.0', '1.0', '1.0.0-', '1.0.0-alpha..1']) {
  if (validateSemver(invalid)) throw new Error(`invalid SemVer accepted: ${invalid}`);
}
console.log(`release asset names are versioned from package.json ${version}`);
