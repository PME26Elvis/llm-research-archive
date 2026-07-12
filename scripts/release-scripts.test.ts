import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { artifactNames, validateSemver, windowsSetupName } from './release-version.mjs';
import { verifyExactReleaseAssets } from './verify-release-assets.mjs';

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'release-script-test-'));
}
function writeArtifact(dir: string, name: string, content = 'x') {
  fs.writeFileSync(path.join(dir, name), content);
}

describe('release scripts', () => {
  it('generates exact package-versioned names and Windows setup name', () => {
    expect(artifactNames('1.2.3')).toEqual([
      'research-observatory-1.2.3-windows-x64-setup.exe',
      'research-observatory-1.2.3-windows-x64-portable.zip',
      'research-observatory-1.2.3-linux-x64-portable.zip',
      'research-observatory-1.2.3-linux-x64.deb',
      'research-observatory-1.2.3-linux-x64.rpm',
      'research-observatory-1.2.3-macos-arm64.zip',
      'research-observatory-1.2.3-macos-x64.zip',
    ]);
    expect(windowsSetupName('1.2.3')).toBe('research-observatory-1.2.3-windows-x64-setup.exe');
  });

  it.each(['01.0.0', '1.0', '1.0.0-', '1.0.0-alpha..1'])('rejects invalid semver %s', (version) => {
    expect(validateSemver(version)).toBe(false);
  });

  it('rejects wrong, extra, missing, and zero-byte binaries', () => {
    const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
    const names = artifactNames(version);
    const cases = [
      { omit: names[0], error: /expected exactly|missing expected/ },
      { extra: 'research-observatory-9.9.9-linux-x64.rpm', error: /expected exactly|unexpected/ },
      { replace: [names[0], 'research-observatory-9.9.9-windows-x64-setup.exe'], error: /missing expected|unexpected/ },
      { zero: names[0], error: /zero-byte/ },
    ];
    for (const testCase of cases) {
      const input = tempDir();
      const out = tempDir();
      for (const name of names) if (name !== testCase.omit) writeArtifact(input, name, testCase.zero === name ? '' : 'x');
      if (testCase.extra) writeArtifact(input, testCase.extra);
      if (testCase.replace) {
        fs.rmSync(path.join(input, testCase.replace[0]));
        writeArtifact(input, testCase.replace[1]);
      }
      expect(() => execFileSync('node', ['scripts/aggregate-release.mjs', input, out], { env: { ...process.env, RELEASE_VERSION: version, RELEASE_TAG: `v${version}`, RELEASE_TARGET_COMMIT: 'abc' } })).toThrow(testCase.error);
      fs.rmSync(input, { recursive: true, force: true });
      fs.rmSync(out, { recursive: true, force: true });
    }
  });

  it('writes manifest version tag and target commit', () => {
    const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
    const input = tempDir();
    const out = tempDir();
    for (const name of artifactNames(version)) writeArtifact(input, name);
    execFileSync('node', ['scripts/aggregate-release.mjs', input, out], { env: { ...process.env, RELEASE_VERSION: version, RELEASE_TAG: `v${version}`, RELEASE_TARGET_COMMIT: 'abc123' } });
    const manifest = JSON.parse(fs.readFileSync(path.join(out, 'release-manifest.json'), 'utf8'));
    expect(manifest).toMatchObject({ version, tag: `v${version}`, targetCommit: 'abc123' });
  });

  it('rejects stale GitHub release assets', () => {
    const version = '1.2.3';
    const manifest = { artifacts: artifactNames(version).map((name) => ({ name, size: 1 })) };
    const assets = [...artifactNames(version), 'SHA256SUMS.txt', 'release-manifest.json', 'sbom.cdx.json', 'debug.log'].map((name) => ({ name, size: 1 }));
    expect(() => verifyExactReleaseAssets({ assets, manifest, version, targetCommit: 'abc', releaseTarget: 'abc' })).toThrow(/expected exactly 10/);
  });
});
