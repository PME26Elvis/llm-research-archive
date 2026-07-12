import fs from 'node:fs';
import path from 'node:path';
import type { ImportAssetPlan, ImportIssue, ImportSourceDescriptor } from './contracts';
import { importIssue } from './contracts';

function samePath(left: string, right: string): boolean {
  return path.relative(left, right) === '' && path.relative(right, left) === '';
}

export function isImportPathInsideRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

export function existingImportSymlinkAncestor(root: string, candidate: string): string | undefined {
  const relative = path.relative(root, candidate);
  if (!relative || relative === '.') return undefined;
  let current = root;
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) return undefined;
    if (fs.lstatSync(current).isSymbolicLink()) return current;
  }
  return undefined;
}

function inspectRegularFile(
  filePath: string,
  root: string,
  missingCode: 'source-not-found' | 'article-not-found',
  missingMessage: string,
): ImportIssue | undefined {
  if (!fs.existsSync(filePath)) {
    return importIssue('error', missingCode, missingMessage, filePath);
  }
  const stat = fs.lstatSync(filePath);
  if (stat.isSymbolicLink()) {
    return importIssue(
      'error',
      'source-symlink',
      'Import sources must not be symbolic links.',
      filePath,
    );
  }
  if (!stat.isFile()) {
    return importIssue(
      'error',
      'unsupported-source',
      'Expected a regular Markdown file.',
      filePath,
    );
  }
  const realFile = fs.realpathSync(filePath);
  if (!isImportPathInsideRoot(root, realFile)) {
    return importIssue(
      'error',
      'source-escape',
      'Import source escaped its declared root.',
      filePath,
    );
  }
  return undefined;
}

export function inspectImportSource(
  sourcePath: string,
):
  | { ok: true; source: ImportSourceDescriptor; warnings: ImportIssue[] }
  | { ok: false; issues: ImportIssue[] } {
  const absolute = path.resolve(sourcePath);
  if (!fs.existsSync(absolute)) {
    return {
      ok: false,
      issues: [importIssue('error', 'source-not-found', 'Import source does not exist.', absolute)],
    };
  }

  const stat = fs.lstatSync(absolute);
  if (stat.isSymbolicLink()) {
    return {
      ok: false,
      issues: [
        importIssue(
          'error',
          'source-symlink',
          'Import source must not be a symbolic link.',
          absolute,
        ),
      ],
    };
  }

  const realSource = fs.realpathSync(absolute);
  if (!samePath(absolute, realSource)) {
    return {
      ok: false,
      issues: [
        importIssue(
          'error',
          'source-symlink',
          'Import source contains a symbolic-link path component.',
          absolute,
        ),
      ],
    };
  }

  if (stat.isFile()) {
    if (path.extname(absolute).toLocaleLowerCase() !== '.md') {
      return {
        ok: false,
        issues: [
          importIssue(
            'error',
            'unsupported-source',
            'Single-file imports require a Markdown file.',
            absolute,
          ),
        ],
      };
    }
    return {
      ok: true,
      source: { kind: 'markdown-file', rootPath: absolute, articlePath: absolute },
      warnings: [],
    };
  }

  if (!stat.isDirectory()) {
    return {
      ok: false,
      issues: [
        importIssue(
          'error',
          'unsupported-source',
          'Import source must be a file or directory.',
          absolute,
        ),
      ],
    };
  }

  const articlePath = path.join(absolute, 'article.md');
  const articleIssue = inspectRegularFile(
    articlePath,
    absolute,
    'article-not-found',
    'Article folder must contain article.md.',
  );
  if (articleIssue) return { ok: false, issues: [articleIssue] };

  const warnings: ImportIssue[] = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (['article.md', 'research-activity.md', 'assets'].includes(entry.name)) continue;
    warnings.push(
      importIssue(
        'warning',
        'ignored-source-entry',
        'Entry is not part of the supported article-folder contract and will be ignored.',
        path.join(absolute, entry.name),
      ),
    );
  }

  const researchCandidate = path.join(absolute, 'research-activity.md');
  let researchPath: string | undefined;
  if (fs.existsSync(researchCandidate)) {
    const researchIssue = inspectRegularFile(
      researchCandidate,
      absolute,
      'source-not-found',
      'Research appendix is not readable.',
    );
    if (researchIssue) return { ok: false, issues: [researchIssue] };
    researchPath = researchCandidate;
  }

  const assetsCandidate = path.join(absolute, 'assets');
  let assetsPath: string | undefined;
  if (fs.existsSync(assetsCandidate)) {
    const assetsStat = fs.lstatSync(assetsCandidate);
    if (assetsStat.isSymbolicLink()) {
      return {
        ok: false,
        issues: [
          importIssue(
            'error',
            'asset-symlink',
            'Assets directory must not be a symbolic link.',
            assetsCandidate,
          ),
        ],
      };
    }
    if (!assetsStat.isDirectory()) {
      return {
        ok: false,
        issues: [
          importIssue(
            'error',
            'unsupported-source',
            'assets must be a directory.',
            assetsCandidate,
          ),
        ],
      };
    }
    assetsPath = assetsCandidate;
  }

  return {
    ok: true,
    source: {
      kind: 'article-folder',
      rootPath: absolute,
      articlePath,
      ...(researchPath ? { researchPath } : {}),
      ...(assetsPath ? { assetsPath } : {}),
    },
    warnings,
  };
}

export function collectImportAssets(
  assetsRoot: string,
): { ok: true; assets: ImportAssetPlan[] } | { ok: false; issues: ImportIssue[] } {
  const realRoot = fs.realpathSync(assetsRoot);
  const assets: ImportAssetPlan[] = [];
  const issues: ImportIssue[] = [];

  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      const stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) {
        issues.push(
          importIssue('error', 'asset-symlink', 'Symbolic links are not importable assets.', full),
        );
        continue;
      }
      const realEntry = fs.realpathSync(full);
      if (!isImportPathInsideRoot(realRoot, realEntry)) {
        issues.push(
          importIssue('error', 'asset-escape', 'Asset escaped the assets directory.', full),
        );
        continue;
      }
      if (stat.isDirectory()) {
        visit(full);
        continue;
      }
      if (!stat.isFile()) continue;
      const relativePath = path.relative(realRoot, full).split(path.sep).join('/');
      assets.push({
        sourcePath: full,
        relativePath,
        outputPath: `assets/${relativePath}`,
        sizeBytes: stat.size,
      });
    }
  };

  visit(realRoot);
  if (issues.length) return { ok: false, issues };
  assets.sort((left, right) => left.outputPath.localeCompare(right.outputPath));
  return { ok: true, assets };
}

export function resolveImportWorkspaceRoot(
  workspaceRoot: string,
): { ok: true; root: string } | { ok: false; issues: ImportIssue[] } {
  const absolute = path.resolve(workspaceRoot);
  if (!fs.existsSync(absolute) || !fs.lstatSync(absolute).isDirectory()) {
    return {
      ok: false,
      issues: [
        importIssue(
          'error',
          'source-not-found',
          'Workspace root must be an existing directory for conflict detection.',
          absolute,
        ),
      ],
    };
  }
  if (fs.lstatSync(absolute).isSymbolicLink()) {
    return {
      ok: false,
      issues: [
        importIssue(
          'error',
          'source-symlink',
          'Workspace root must not be a symbolic link.',
          absolute,
        ),
      ],
    };
  }
  const realRoot = fs.realpathSync(absolute);
  if (!samePath(absolute, realRoot)) {
    return {
      ok: false,
      issues: [
        importIssue(
          'error',
          'source-symlink',
          'Workspace root contains a symbolic-link path component.',
          absolute,
        ),
      ],
    };
  }
  return { ok: true, root: realRoot };
}
