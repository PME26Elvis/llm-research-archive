import fs from 'node:fs';
import path from 'node:path';
import type {
  ImportCommitError,
  ImportCommitErrorCode,
  ImportCommitResult,
  ImportPlan,
} from './contracts';
import {
  defaultOperations,
  ImportCommitFailure,
  type ImportCommitOperations,
} from './commit-operations';
import { validateStagedImport, safeImportOutputPath } from './commit-validation';
import { createImportPlan } from './planner';

function commitError(
  code: ImportCommitErrorCode,
  message: string,
  rollbackClean: boolean,
  errorPath?: string,
  cause?: unknown,
  residualPath?: string,
): ImportCommitError {
  return {
    code,
    message,
    ...(errorPath ? { path: errorPath } : {}),
    ...(cause instanceof Error && cause.message ? { cause: cause.message } : {}),
    rollbackClean,
    ...(!rollbackClean && residualPath ? { residualPath } : {}),
  };
}

function refreshImportPlan(plan: ImportPlan): ImportCommitResult | ImportPlan {
  if (plan.schemaVersion !== 1 || !plan.canCommit || plan.requiresMetadataConfirmation) {
    return {
      ok: false,
      error: commitError(
        'plan-not-committable',
        'Import plan must be conflict-free and have confirmed metadata.',
        true,
      ),
    };
  }

  const refreshed = createImportPlan({
    sourcePath: plan.source.rootPath,
    workspaceRoot: plan.workspaceRoot,
    publicationDate: plan.metadata.date,
    overrides: plan.metadata,
  });
  if (!refreshed.ok) {
    return {
      ok: false,
      error: commitError(
        'stale-plan',
        'Import source or workspace is no longer valid; create a new preview.',
        true,
        refreshed.issues[0]?.path,
      ),
    };
  }
  if (refreshed.plan.conflicts.length) {
    return {
      ok: false,
      error: commitError(
        'target-conflict',
        'Target article directory now exists; the import was not written.',
        true,
        refreshed.plan.conflicts[0].path,
      ),
    };
  }
  if (!refreshed.plan.canCommit || refreshed.plan.planId !== plan.planId) {
    return {
      ok: false,
      error: commitError(
        'stale-plan',
        'Import source, assets, metadata, or output intent changed; create a new preview.',
        true,
        plan.source.rootPath,
      ),
    };
  }
  return refreshed.plan;
}

function releaseLock(
  lockOwned: boolean,
  lockDescriptor: number | undefined,
  lockPath: string | undefined,
): boolean {
  if (!lockOwned) return true;
  let clean = true;
  if (lockDescriptor !== undefined) {
    try {
      fs.closeSync(lockDescriptor);
    } catch {
      clean = false;
    }
  }
  if (lockPath && fs.existsSync(lockPath)) {
    try {
      fs.unlinkSync(lockPath);
    } catch {
      clean = false;
    }
  }
  return clean;
}

function removeEmptyCreatedCategory(categoryDirectory: string, categoryCreated: boolean): boolean {
  if (!categoryCreated || !fs.existsSync(categoryDirectory)) return true;
  try {
    if (fs.readdirSync(categoryDirectory).length === 0) fs.rmdirSync(categoryDirectory);
    return true;
  } catch {
    return false;
  }
}

export function commitImportPlan(plan: ImportPlan): ImportCommitResult {
  return commitImportPlanWithOperations(plan, {});
}

export function commitImportPlanWithOperations(
  plan: ImportPlan,
  operationOverrides: Partial<ImportCommitOperations>,
): ImportCommitResult {
  const current = refreshImportPlan(plan);
  if ('ok' in current) return current;

  const operations = { ...defaultOperations, ...operationOverrides };
  const categoryDirectory = path.dirname(current.targetDirectory);
  const lockPath = path.join(categoryDirectory, `.${current.metadata.slug}.import.lock`);
  let categoryCreated = false;
  let lockDescriptor: number | undefined;
  let lockOwned = false;
  let stagingRoot: string | undefined;
  let phase: 'prepare' | 'stage' | 'validate' | 'rename' = 'prepare';

  try {
    fs.accessSync(current.workspaceRoot, fs.constants.W_OK);
    if (!fs.existsSync(categoryDirectory)) {
      fs.mkdirSync(categoryDirectory);
      categoryCreated = true;
    }
    if (!fs.lstatSync(categoryDirectory).isDirectory()) {
      throw new ImportCommitFailure(
        'target-conflict',
        'Target category path is not a directory.',
        categoryDirectory,
      );
    }

    try {
      lockDescriptor = fs.openSync(lockPath, 'wx', 0o600);
      lockOwned = true;
      fs.writeFileSync(lockDescriptor, current.planId);
      fs.fsyncSync(lockDescriptor);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new ImportCommitFailure(
          'commit-in-progress',
          'Another import for this target is already in progress.',
          lockPath,
          { cause: error },
        );
      }
      throw error;
    }

    if (fs.existsSync(current.targetDirectory)) {
      throw new ImportCommitFailure(
        'target-conflict',
        'Target article directory was created after preview.',
        current.targetDirectory,
      );
    }

    phase = 'stage';
    stagingRoot = fs.mkdtempSync(path.join(categoryDirectory, `.${current.metadata.slug}.import-`));
    operations.writeArticle(path.join(stagingRoot, 'index.md'), current.articleContent);
    for (const asset of current.assets) {
      const destination = safeImportOutputPath(stagingRoot, asset.outputPath);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      operations.writeAsset(asset, destination);
    }

    phase = 'validate';
    validateStagedImport(current, stagingRoot);
    if (fs.existsSync(current.targetDirectory)) {
      throw new ImportCommitFailure(
        'target-conflict',
        'Target article directory was created while the import was staged.',
        current.targetDirectory,
      );
    }

    phase = 'rename';
    operations.rename(stagingRoot, current.targetDirectory);
    stagingRoot = undefined;
    releaseLock(lockOwned, lockDescriptor, lockPath);
    lockDescriptor = undefined;
    lockOwned = false;
    return {
      ok: true,
      receipt: {
        schemaVersion: 1,
        planId: current.planId,
        source: current.source,
        sourceFingerprint: current.sourceFingerprint,
        workspaceRoot: current.workspaceRoot,
        targetDirectory: current.targetDirectory,
        targetArticlePath: current.targetArticlePath,
        articleSha256: current.articleSha256,
        assets: current.assets.map(({ outputPath, sha256, sizeBytes }) => ({
          relativePath: outputPath,
          sha256,
          sizeBytes,
        })),
        committedAt: operations.now().toISOString(),
        sourceRetained: true,
      },
    };
  } catch (error) {
    const failure =
      error instanceof ImportCommitFailure
        ? error
        : new ImportCommitFailure(
            (error as NodeJS.ErrnoException).code === 'EACCES' ||
              (error as NodeJS.ErrnoException).code === 'EROFS'
              ? 'workspace-read-only'
              : phase === 'stage'
                ? 'stage-failed'
                : phase === 'validate'
                  ? 'validation-failed'
                  : 'commit-failed',
            phase === 'stage'
              ? 'Import staging failed.'
              : phase === 'validate'
                ? 'Staged import validation failed.'
                : phase === 'rename'
                  ? 'Atomic import rename failed.'
                  : 'Import workspace preparation failed.',
            phase === 'rename' ? current.targetDirectory : stagingRoot || categoryDirectory,
            { cause: error },
          );

    let rollbackClean = true;
    if (stagingRoot && fs.existsSync(stagingRoot)) {
      try {
        operations.removeTree(stagingRoot);
      } catch {
        rollbackClean = false;
      }
    }
    rollbackClean = releaseLock(lockOwned, lockDescriptor, lockPath) && rollbackClean;
    rollbackClean = removeEmptyCreatedCategory(categoryDirectory, categoryCreated) && rollbackClean;
    return {
      ok: false,
      error: commitError(
        rollbackClean ? failure.code : 'rollback-failed',
        rollbackClean ? failure.message : 'Import failed and rollback left a residual path.',
        rollbackClean,
        failure.failurePath,
        failure.cause || error,
        !rollbackClean ? stagingRoot || lockPath || categoryDirectory : undefined,
      ),
    };
  }
}
