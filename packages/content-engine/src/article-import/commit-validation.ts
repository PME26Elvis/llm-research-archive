import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { ImportPlan } from './contracts';
import { ImportCommitFailure } from './commit-operations';
import { isImportPathInsideRoot, sha256Buffer, sha256File } from './source';

export function safeImportOutputPath(stagingRoot: string, relativePath: string): string {
  const destination = path.resolve(stagingRoot, ...relativePath.split('/'));
  if (!isImportPathInsideRoot(stagingRoot, destination) || destination === stagingRoot) {
    throw new ImportCommitFailure(
      'validation-failed',
      'Planned output escaped the staging directory.',
      relativePath,
    );
  }
  return destination;
}

function normalizedDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  return undefined;
}

export function validateStagedImport(plan: ImportPlan, stagingRoot: string): void {
  const articlePath = path.join(stagingRoot, 'index.md');
  if (!fs.existsSync(articlePath) || fs.lstatSync(articlePath).isSymbolicLink()) {
    throw new ImportCommitFailure(
      'validation-failed',
      'Staged article is missing or is not a regular file.',
      articlePath,
    );
  }
  const articleContent = fs.readFileSync(articlePath, 'utf8');
  if (sha256Buffer(articleContent) !== plan.articleSha256) {
    throw new ImportCommitFailure(
      'validation-failed',
      'Staged article content does not match the approved import plan.',
      articlePath,
    );
  }

  let parsed: ReturnType<typeof matter>;
  try {
    parsed = matter(articleContent);
  } catch (error) {
    throw new ImportCommitFailure(
      'validation-failed',
      'Staged article front matter could not be parsed.',
      articlePath,
      { cause: error },
    );
  }
  const tags = Array.isArray(parsed.data.tags)
    ? parsed.data.tags.filter((tag): tag is string => typeof tag === 'string')
    : [];
  const title = parsed.content.match(/^#\s+(.+?)\s*$/mu)?.[1]?.trim();
  if (
    normalizedDate(parsed.data.date) !== plan.metadata.date ||
    JSON.stringify(tags) !== JSON.stringify(plan.metadata.tags) ||
    title !== plan.metadata.title
  ) {
    throw new ImportCommitFailure(
      'validation-failed',
      'Staged article metadata does not match the approved import plan.',
      articlePath,
    );
  }

  const expectedFiles = new Set(['index.md']);
  for (const asset of plan.assets) {
    expectedFiles.add(asset.outputPath);
    const destination = safeImportOutputPath(stagingRoot, asset.outputPath);
    if (!fs.existsSync(destination) || fs.lstatSync(destination).isSymbolicLink()) {
      throw new ImportCommitFailure(
        'validation-failed',
        'A staged asset is missing or is not a regular file.',
        destination,
      );
    }
    const stat = fs.statSync(destination);
    if (stat.size !== asset.sizeBytes || sha256File(destination) !== asset.sha256) {
      throw new ImportCommitFailure(
        'validation-failed',
        'A staged asset does not match the approved import plan.',
        destination,
      );
    }
  }

  const actualFiles: string[] = [];
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(full);
        continue;
      }
      if (!entry.isFile()) {
        throw new ImportCommitFailure(
          'validation-failed',
          'Staging contains an unsupported filesystem entry.',
          full,
        );
      }
      actualFiles.push(path.relative(stagingRoot, full).split(path.sep).join('/'));
    }
  };
  visit(stagingRoot);
  actualFiles.sort();
  const expected = [...expectedFiles].sort();
  if (JSON.stringify(actualFiles) !== JSON.stringify(expected)) {
    throw new ImportCommitFailure(
      'validation-failed',
      'Staging contains files that were not approved by the import plan.',
      stagingRoot,
    );
  }
}
