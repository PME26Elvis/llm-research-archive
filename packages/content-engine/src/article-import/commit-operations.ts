import fs from 'node:fs';
import type { ImportAssetPlan, ImportCommitErrorCode } from './contracts';
import { sha256Buffer } from './source';

export interface ImportCommitOperations {
  now(): Date;
  writeArticle(filePath: string, content: string): void;
  writeAsset(asset: ImportAssetPlan, destination: string): void;
  rename(source: string, destination: string): void;
  removeTree(target: string): void;
}

export class ImportCommitFailure extends Error {
  constructor(
    readonly code: ImportCommitErrorCode,
    message: string,
    readonly failurePath?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

function writeExclusiveDurable(filePath: string, content: string | Buffer): void {
  const descriptor = fs.openSync(filePath, 'wx', 0o644);
  try {
    fs.writeFileSync(descriptor, content);
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
}

export const defaultOperations: ImportCommitOperations = {
  now: () => new Date(),
  writeArticle: (filePath, content) => writeExclusiveDurable(filePath, content),
  writeAsset: (asset, destination) => {
    const content = fs.readFileSync(asset.sourcePath);
    if (content.byteLength !== asset.sizeBytes || sha256Buffer(content) !== asset.sha256) {
      throw new ImportCommitFailure(
        'stale-plan',
        'An import asset changed after the preview was created.',
        asset.sourcePath,
      );
    }
    writeExclusiveDurable(destination, content);
  },
  rename: (source, destination) => fs.renameSync(source, destination),
  removeTree: (target) => fs.rmSync(target, { recursive: true, force: true }),
};
