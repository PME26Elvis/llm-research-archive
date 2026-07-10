import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { resolveSafeAssetPath } from '../src/main/asset-path';
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'asset-root-'));
  await fs.writeFile(path.join(root, 'ok.png'), 'x');
  await fs.mkdir(path.join(root, 'nested'));
  await fs.writeFile(path.join(root, 'nested', 'ok.svg'), '<svg/>');
  const sibling = `${root}-private`;
  await fs.mkdir(sibling);
  await fs.writeFile(path.join(sibling, 'secret.png'), 'x');
  await fs.symlink(path.join(sibling, 'secret.png'), path.join(root, 'escape.png'));
  return { root, sibling };
}
describe('resolveSafeAssetPath', () => {
  it('allows normal assets', async () => {
    const { root } = await fixture();
    await expect(resolveSafeAssetPath(root, 'app-asset:///ok.png')).resolves.toContain('ok.png');
  });
  it('rejects traversal, encoded traversal, sibling prefixes, symlink escapes and missing files', async () => {
    const { root } = await fixture();
    await expect(resolveSafeAssetPath(root, 'app-asset:///../x.png')).resolves.toBeUndefined();
    await expect(resolveSafeAssetPath(root, 'app-asset:///%2e%2e/x.png')).resolves.toBeUndefined();
    await expect(
      resolveSafeAssetPath(root, `app-asset:///../${path.basename(root)}-private/secret.png`),
    ).resolves.toBeUndefined();
    await expect(resolveSafeAssetPath(root, 'app-asset:///escape.png')).resolves.toBeUndefined();
    await expect(resolveSafeAssetPath(root, 'app-asset:///missing.png')).resolves.toBeUndefined();
  });
});
