import { releaseAssetNames } from './release-version.mjs';

export function verifyExactReleaseAssets({
  assets,
  manifest,
  version,
  targetCommit,
  releaseTarget,
}) {
  const expected = releaseAssetNames(version).sort();
  const names = assets.map((a) => a.name);
  const sorted = [...names].sort();
  if (names.length !== expected.length)
    throw new Error(`expected exactly ${expected.length} release assets, got ${names.length}`);
  const duplicate = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicate) throw new Error(`duplicate release asset ${duplicate}`);
  for (let i = 0; i < expected.length; i += 1) {
    if (sorted[i] !== expected[i])
      throw new Error(
        `release asset set mismatch: expected ${expected.join(', ')}, got ${sorted.join(', ')}`,
      );
  }
  for (const asset of assets)
    if (asset.size === 0) throw new Error(`zero-byte release asset ${asset.name}`);
  if (releaseTarget !== targetCommit) throw new Error(`target commit mismatch: ${releaseTarget}`);
  for (const artifact of manifest.artifacts) {
    const asset = assets.find((candidate) => candidate.name === artifact.name);
    if (!asset || asset.size !== artifact.size)
      throw new Error(`asset size mismatch ${artifact.name}`);
  }
  return true;
}
