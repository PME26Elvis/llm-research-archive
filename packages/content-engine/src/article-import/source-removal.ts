import fs from 'node:fs';
import path from 'node:path';
import type {
  ImportAssetPlan,
  ImportCommitReceipt,
  ImportSourceDescriptor,
  ImportSourceRemovalError,
  ImportSourceRemovalResult,
} from './contracts';
import { safeImportOutputPath } from './commit-validation';
import {
  collectImportAssets,
  createImportSourceFingerprint,
  inspectImportSource,
  isImportPathInsideRoot,
  sha256File,
} from './source';

function sourceRemovalError(
  code: ImportSourceRemovalError['code'],
  message: string,
  errorPath?: string,
  cause?: unknown,
): ImportSourceRemovalError {
  return {
    code,
    message,
    ...(errorPath ? { path: errorPath } : {}),
    ...(cause instanceof Error && cause.message ? { cause: cause.message } : {}),
  };
}

function sameDescriptor(left: ImportSourceDescriptor, right: ImportSourceDescriptor): boolean {
  return (
    left.kind === right.kind &&
    left.rootPath === right.rootPath &&
    left.articlePath === right.articlePath &&
    left.researchPath === right.researchPath &&
    left.assetsPath === right.assetsPath
  );
}

function validateCommittedTarget(
  receipt: ImportCommitReceipt,
): ImportSourceRemovalError | undefined {
  try {
    if (
      receipt.schemaVersion !== 1 ||
      !receipt.sourceRetained ||
      !isImportPathInsideRoot(receipt.workspaceRoot, receipt.targetDirectory) ||
      receipt.targetArticlePath !== path.join(receipt.targetDirectory, 'index.md')
    ) {
      return sourceRemovalError(
        'invalid-receipt',
        'Import receipt is not valid for source removal.',
      );
    }
    if (
      !fs.existsSync(receipt.targetArticlePath) ||
      fs.lstatSync(receipt.targetArticlePath).isSymbolicLink() ||
      !fs.lstatSync(receipt.targetArticlePath).isFile() ||
      sha256File(receipt.targetArticlePath) !== receipt.articleSha256
    ) {
      return sourceRemovalError(
        'target-changed',
        'Committed article is missing or changed; source removal was refused.',
        receipt.targetArticlePath,
      );
    }
    for (const asset of receipt.assets) {
      const target = safeImportOutputPath(receipt.targetDirectory, asset.relativePath);
      if (
        !fs.existsSync(target) ||
        fs.lstatSync(target).isSymbolicLink() ||
        !fs.lstatSync(target).isFile() ||
        fs.statSync(target).size !== asset.sizeBytes ||
        sha256File(target) !== asset.sha256
      ) {
        return sourceRemovalError(
          'target-changed',
          'A committed asset is missing or changed; source removal was refused.',
          target,
        );
      }
    }
    return undefined;
  } catch (error) {
    return sourceRemovalError(
      'invalid-receipt',
      'Import receipt contains an invalid or inaccessible target path.',
      receipt.targetDirectory,
      error,
    );
  }
}

export function removeImportedSource(receipt: ImportCommitReceipt): ImportSourceRemovalResult {
  const targetError = validateCommittedTarget(receipt);
  if (targetError) return { ok: false, error: targetError };

  const inspected = inspectImportSource(receipt.source.rootPath);
  if (!inspected.ok) {
    return {
      ok: false,
      error: sourceRemovalError(
        inspected.issues.some((issue) => issue.code === 'source-not-found')
          ? 'source-not-found'
          : 'source-changed',
        'Import source is missing or no longer matches the committed receipt.',
        receipt.source.rootPath,
      ),
    };
  }
  if (!sameDescriptor(inspected.source, receipt.source)) {
    return {
      ok: false,
      error: sourceRemovalError(
        'source-changed',
        'Import source shape changed after commit; removal was refused.',
        receipt.source.rootPath,
      ),
    };
  }
  if (inspected.warnings.some((warning) => warning.code === 'ignored-source-entry')) {
    return {
      ok: false,
      error: sourceRemovalError(
        'source-not-removable',
        'Source folder contains entries outside the import contract; removal was refused.',
        receipt.source.rootPath,
      ),
    };
  }

  let assets: ImportAssetPlan[] = [];
  if (inspected.source.assetsPath) {
    const collected = collectImportAssets(inspected.source.assetsPath);
    if (!collected.ok) {
      return {
        ok: false,
        error: sourceRemovalError(
          'source-changed',
          'Import assets changed after commit; removal was refused.',
          inspected.source.assetsPath,
        ),
      };
    }
    assets = collected.assets;
  }
  if (createImportSourceFingerprint(inspected.source, assets) !== receipt.sourceFingerprint) {
    return {
      ok: false,
      error: sourceRemovalError(
        'source-changed',
        'Import source content changed after commit; removal was refused.',
        receipt.source.rootPath,
      ),
    };
  }

  try {
    if (receipt.source.kind === 'markdown-file') fs.unlinkSync(receipt.source.rootPath);
    else fs.rmSync(receipt.source.rootPath, { recursive: true, force: false });
    return { ok: true, removedPath: receipt.source.rootPath };
  } catch (error) {
    return {
      ok: false,
      error: sourceRemovalError(
        'source-removal-failed',
        'Committed source could not be removed.',
        receipt.source.rootPath,
        error,
      ),
    };
  }
}
