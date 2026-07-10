import fs from 'node:fs';
import { artifactNames, windowsSetupName, rootPackageVersion } from './release-version.mjs';
const version = rootPackageVersion();
const forge = fs.readFileSync('forge.config.ts', 'utf8');
if (!forge.includes('windowsSetupName()'))
  throw new Error('Forge Squirrel setup filename must come from windowsSetupName()');
for (const name of artifactNames(version)) {
  if (!name.includes(version)) throw new Error(`artifact name missing package version: ${name}`);
}
if (windowsSetupName(version) !== `research-observatory-${version}-windows-x64-setup.exe`)
  throw new Error('unexpected Windows setup filename');
console.log(`release asset names are versioned from package.json ${version}`);
