import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanImportMarkdown, imageTarget } from './cleanup';
import { defaultOperations, ImportCommitFailure } from './commit-operations';
import { commitImportPlan, commitImportPlanWithOperations } from './commit-transaction';
import { safeImportOutputPath, validateStagedImport } from './commit-validation';
import type { ImportCommitReceipt, ImportPlan } from './contracts';
import { resolveImportMetadata } from './metadata';
import { createImportPlan } from './planner';
import { removeImportedSource } from './source-removal';
import {
  collectImportAssets,
  createImportSourceFingerprint,
  existingImportSymlinkAncestor,
  inspectImportSource,
  isImportPathInsideRoot,
  resolveImportWorkspaceRoot,
  sha256Buffer,
  sha256File,
} from './source';

const temporaryRoots: string[] = [];

function temporaryRoot(prefix = 'import-edge-'): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  temporaryRoots.push(root);
  return root;
}

function filePlan(options?: {
  body?: string;
  sourceName?: string;
  publicationDate?: string;
  overrides?: { category?: string; slug?: string; tags?: string[]; date?: string };
}): { root: string; workspace: string; source: string; plan: ImportPlan } {
  const root = temporaryRoot();
  const workspace = path.join(root, 'workspace');
  const source = path.join(root, options?.sourceName ?? 'report.md');
  fs.mkdirSync(workspace);
  fs.writeFileSync(source, options?.body ?? '# GPU Report\n\nLLM GPU benchmark.');
  const result = createImportPlan({
    sourcePath: source,
    workspaceRoot: workspace,
    publicationDate: options?.publicationDate ?? '2026-07-12',
    overrides: options?.overrides,
  });
  if (!result.ok) throw new Error(result.issues.map((issue) => issue.message).join('\n'));
  return { root, workspace, source, plan: result.plan };
}

function folderPlan(): { root: string; workspace: string; source: string; plan: ImportPlan } {
  const root = temporaryRoot();
  const workspace = path.join(root, 'workspace');
  const source = path.join(root, 'energy-report');
  fs.mkdirSync(path.join(source, 'assets', 'nested'), { recursive: true });
  fs.mkdirSync(workspace);
  fs.writeFileSync(
    path.join(source, 'article.md'),
    '# Energy Report\n\n![chart](assets/nested/chart.png)\n',
  );
  fs.writeFileSync(path.join(source, 'research-activity.md'), 'Research appendix.');
  fs.writeFileSync(path.join(source, 'assets', 'nested', 'chart.png'), 'chart-v1');
  const result = createImportPlan({
    sourcePath: source,
    workspaceRoot: workspace,
    publicationDate: '2026-07-12',
    overrides: { category: 'carbon', slug: 'energy-report' },
  });
  if (!result.ok) throw new Error(result.issues.map((issue) => issue.message).join('\n'));
  return { root, workspace, source, plan: result.plan };
}

function commitReceipt(plan: ImportPlan): ImportCommitReceipt {
  const result = commitImportPlan(plan);
  if (!result.ok) throw new Error(result.error.message);
  return result.receipt;
}

function stagePlan(plan: ImportPlan): string {
  const staging = temporaryRoot('import-stage-');
  fs.writeFileSync(path.join(staging, 'index.md'), plan.articleContent);
  for (const asset of plan.assets) {
    const destination = safeImportOutputPath(staging, asset.outputPath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(asset.sourcePath, destination);
  }
  return staging;
}

afterEach(() => {
  vi.restoreAllMocks();
  while (temporaryRoots.length) {
    fs.rmSync(temporaryRoots.pop()!, { recursive: true, force: true });
  }
});

describe('import source filesystem boundaries', () => {
  it('reports missing, unsupported, and malformed source shapes', () => {
    const root = temporaryRoot();
    expect(inspectImportSource(path.join(root, 'missing.md'))).toEqual({
      ok: false,
      issues: [expect.objectContaining({ code: 'source-not-found' })],
    });

    const text = path.join(root, 'notes.txt');
    fs.writeFileSync(text, 'not markdown');
    expect(inspectImportSource(text)).toEqual({
      ok: false,
      issues: [expect.objectContaining({ code: 'unsupported-source' })],
    });

    const folder = path.join(root, 'folder');
    fs.mkdirSync(folder);
    expect(inspectImportSource(folder)).toEqual({
      ok: false,
      issues: [expect.objectContaining({ code: 'article-not-found' })],
    });
    fs.mkdirSync(path.join(folder, 'article.md'));
    expect(inspectImportSource(folder)).toEqual({
      ok: false,
      issues: [expect.objectContaining({ code: 'unsupported-source' })],
    });
  });

  it('describes supported folders, optional appendix/assets, and ignored entries', () => {
    const root = temporaryRoot();
    const folder = path.join(root, 'folder');
    fs.mkdirSync(path.join(folder, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(folder, 'article.md'), '# Article');
    fs.writeFileSync(path.join(folder, 'research-activity.md'), 'appendix');
    fs.writeFileSync(path.join(folder, 'notes.txt'), 'ignored');
    const result = inspectImportSource(folder);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toEqual({
      kind: 'article-folder',
      rootPath: folder,
      articlePath: path.join(folder, 'article.md'),
      researchPath: path.join(folder, 'research-activity.md'),
      assetsPath: path.join(folder, 'assets'),
    });
    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: 'ignored-source-entry',
        path: path.join(folder, 'notes.txt'),
      }),
    ]);
  });

  it('rejects symbolic-link sources, appendices, asset roots, and asset entries', () => {
    if (process.platform === 'win32') return;
    const root = temporaryRoot();
    const target = path.join(root, 'target.md');
    const linked = path.join(root, 'linked.md');
    fs.writeFileSync(target, '# Target');
    fs.symlinkSync(target, linked);
    expect(inspectImportSource(linked)).toEqual({
      ok: false,
      issues: [expect.objectContaining({ code: 'source-symlink' })],
    });

    const folder = path.join(root, 'folder');
    fs.mkdirSync(folder);
    fs.writeFileSync(path.join(folder, 'article.md'), '# Article');
    fs.symlinkSync(target, path.join(folder, 'research-activity.md'));
    expect(inspectImportSource(folder)).toEqual({
      ok: false,
      issues: [expect.objectContaining({ code: 'source-symlink' })],
    });
    fs.unlinkSync(path.join(folder, 'research-activity.md'));
    fs.symlinkSync(root, path.join(folder, 'assets'));
    expect(inspectImportSource(folder)).toEqual({
      ok: false,
      issues: [expect.objectContaining({ code: 'asset-symlink' })],
    });

    fs.unlinkSync(path.join(folder, 'assets'));
    fs.mkdirSync(path.join(folder, 'assets'));
    fs.symlinkSync(target, path.join(folder, 'assets', 'linked.png'));
    expect(collectImportAssets(path.join(folder, 'assets'))).toEqual({
      ok: false,
      issues: [expect.objectContaining({ code: 'asset-symlink' })],
    });
  });

  it('sorts nested asset plans and fingerprints content changes', () => {
    const root = temporaryRoot();
    const folder = path.join(root, 'folder');
    const assets = path.join(folder, 'assets');
    fs.mkdirSync(path.join(assets, 'z'), { recursive: true });
    fs.writeFileSync(path.join(folder, 'article.md'), '# Article');
    fs.writeFileSync(path.join(assets, 'b.txt'), 'b');
    fs.writeFileSync(path.join(assets, 'z', 'a.txt'), 'a');
    const inspected = inspectImportSource(folder);
    expect(inspected.ok).toBe(true);
    if (!inspected.ok || !inspected.source.assetsPath) return;
    const collected = collectImportAssets(inspected.source.assetsPath);
    expect(collected.ok).toBe(true);
    if (!collected.ok) return;
    expect(collected.assets.map((asset) => asset.outputPath)).toEqual([
      'assets/b.txt',
      'assets/z/a.txt',
    ]);
    const first = createImportSourceFingerprint(inspected.source, collected.assets);
    fs.writeFileSync(path.join(folder, 'article.md'), '# Changed');
    const second = createImportSourceFingerprint(inspected.source, collected.assets);
    expect(first).not.toBe(second);
    expect(sha256File(path.join(assets, 'b.txt'))).toBe(sha256Buffer('b'));
  });

  it('validates workspace roots and identifies existing symlink ancestors', () => {
    const root = temporaryRoot();
    const missing = path.join(root, 'missing');
    expect(resolveImportWorkspaceRoot(missing)).toEqual({
      ok: false,
      issues: [expect.objectContaining({ code: 'source-not-found' })],
    });
    const file = path.join(root, 'file');
    fs.writeFileSync(file, 'x');
    expect(resolveImportWorkspaceRoot(file)).toEqual({
      ok: false,
      issues: [expect.objectContaining({ code: 'source-not-found' })],
    });

    const workspace = path.join(root, 'workspace');
    fs.mkdirSync(workspace);
    expect(resolveImportWorkspaceRoot(workspace)).toEqual({ ok: true, root: workspace });
    expect(isImportPathInsideRoot(workspace, path.join(workspace, 'a', 'b'))).toBe(true);
    expect(isImportPathInsideRoot(workspace, path.join(root, 'outside'))).toBe(false);
    expect(existingImportSymlinkAncestor(workspace, workspace)).toBeUndefined();
    expect(
      existingImportSymlinkAncestor(workspace, path.join(workspace, 'missing', 'target')),
    ).toBeUndefined();

    if (process.platform !== 'win32') {
      const real = path.join(root, 'real');
      const linked = path.join(workspace, 'linked');
      fs.mkdirSync(real);
      fs.symlinkSync(real, linked, 'dir');
      expect(existingImportSymlinkAncestor(workspace, path.join(linked, 'target'))).toBe(linked);
      expect(resolveImportWorkspaceRoot(linked)).toEqual({
        ok: false,
        issues: [expect.objectContaining({ code: 'source-symlink' })],
      });
    }
  });
});

describe('metadata and cleanup edge cases', () => {
  it('normalizes frontmatter strings, custom categories, duplicate tags, and dates', () => {
    const root = temporaryRoot();
    const sourcePath = path.join(root, 'custom.md');
    const result = resolveImportMetadata({
      source: { kind: 'markdown-file', rootPath: sourcePath, articlePath: sourcePath },
      data: {
        title: '<b>Custom Report</b>',
        category: 'custom-topic',
        slug: 'custom-report',
        tags: ' Alpha, alpha, Beta ',
        date: new Date('2026-07-11T10:00:00.000Z'),
      },
      markdown: 'Body',
    });
    expect(result).toEqual({
      ok: true,
      metadata: {
        title: 'Custom Report',
        category: 'custom-topic',
        slug: 'custom-report',
        tags: ['Custom Topic', 'Alpha', 'Beta'],
        date: '2026-07-11',
      },
      warnings: [],
      requiresMetadataConfirmation: false,
    });
  });

  it('rejects invalid explicit metadata and impossible dates', () => {
    const root = temporaryRoot();
    const sourcePath = path.join(root, 'report.md');
    const descriptor = {
      kind: 'markdown-file' as const,
      rootPath: sourcePath,
      articlePath: sourcePath,
    };
    expect(
      resolveImportMetadata({
        source: descriptor,
        data: {},
        markdown: '# Report',
        overrides: { category: 'Bad Category' },
      }),
    ).toEqual({ ok: false, issues: [expect.objectContaining({ code: 'invalid-metadata' })] });
    expect(
      resolveImportMetadata({
        source: descriptor,
        data: {},
        markdown: '# Report',
        overrides: { category: 'llm', slug: 'Bad Slug' },
      }),
    ).toEqual({ ok: false, issues: [expect.objectContaining({ code: 'invalid-metadata' })] });
    expect(
      resolveImportMetadata({
        source: descriptor,
        data: {},
        markdown: '# Report',
        overrides: { category: 'llm', slug: 'report', date: '2026-02-30', tags: [] },
      }),
    ).toEqual({
      ok: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: 'invalid-metadata' })]),
    });
  });

  it('unwraps legacy entity payloads and parses quoted image destinations', () => {
    const cleaned = cleanImportMarkdown(
      '\uE200entity\uE202plain legacy label\uE201 ![remote](<https://example.com/a.png> "title")',
    );
    expect(cleaned.markdown).toContain('plain legacy label');
    expect(cleaned.cleanup.entityWrappersUnwrapped).toBe(1);
    expect(cleaned.cleanup.nonPortableImagesRemoved).toBe(0);
    expect(imageTarget('<assets/a.png> "title"')).toBe('assets/a.png');
  });
});

describe('staged import validation', () => {
  it('blocks traversal output paths', () => {
    const root = temporaryRoot();
    expect(() => safeImportOutputPath(root, '../escape.txt')).toThrow(ImportCommitFailure);
    expect(() => safeImportOutputPath(root, '.')).toThrow('escaped the staging directory');
    expect(safeImportOutputPath(root, 'assets/a.txt')).toBe(path.join(root, 'assets', 'a.txt'));
  });

  it('rejects missing, changed, and metadata-mismatched staged articles', () => {
    const { plan } = filePlan();
    const staging = temporaryRoot('import-validation-');
    expect(() => validateStagedImport(plan, staging)).toThrow('missing or is not a regular file');

    fs.writeFileSync(path.join(staging, 'index.md'), 'tampered');
    expect(() => validateStagedImport(plan, staging)).toThrow(
      'does not match the approved import plan',
    );

    const content = plan.articleContent.replace('GPU Report', 'Other');
    const changed = { ...plan, articleSha256: sha256Buffer(content) };
    fs.writeFileSync(path.join(staging, 'index.md'), content);
    expect(() => validateStagedImport(changed, staging)).toThrow('metadata does not match');
  });

  it('rejects missing, changed, symlinked, and unapproved staged assets', () => {
    const { plan } = folderPlan();
    const staging = stagePlan(plan);
    const asset = plan.assets[0];
    const target = path.join(staging, ...asset.outputPath.split('/'));
    fs.unlinkSync(target);
    expect(() => validateStagedImport(plan, staging)).toThrow('staged asset is missing');

    fs.writeFileSync(target, 'same-size');
    expect(() => validateStagedImport(plan, staging)).toThrow(
      'does not match the approved import plan',
    );

    fs.copyFileSync(asset.sourcePath, target);
    fs.writeFileSync(path.join(staging, 'extra.txt'), 'extra');
    expect(() => validateStagedImport(plan, staging)).toThrow('files that were not approved');

    if (process.platform !== 'win32') {
      fs.unlinkSync(target);
      fs.symlinkSync(asset.sourcePath, target);
      expect(() => validateStagedImport(plan, staging)).toThrow('staged asset is missing');
    }
  });
});

describe('commit rollback and source removal edge cases', () => {
  it('maps inaccessible workspaces and category-file conflicts to stable errors', () => {
    const { plan } = filePlan();
    const access = vi.spyOn(fs, 'accessSync').mockImplementationOnce(() => {
      const error = new Error('denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      throw error;
    });
    expect(commitImportPlan(plan)).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'workspace-read-only', rollbackClean: true }),
    });
    access.mockRestore();

    const second = filePlan();
    const category = path.dirname(second.plan.targetDirectory);
    fs.writeFileSync(category, 'not a directory');
    expect(commitImportPlan(second.plan)).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'target-conflict', rollbackClean: true }),
    });
  });

  it('detects a target created during staging and reports rollback residue when cleanup fails', () => {
    const first = filePlan();
    const createdDuringStage = commitImportPlanWithOperations(first.plan, {
      writeArticle: (filePath, content) => {
        fs.writeFileSync(filePath, content);
        fs.mkdirSync(first.plan.targetDirectory, { recursive: true });
      },
    });
    expect(createdDuringStage).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'target-conflict', rollbackClean: true }),
    });

    const second = folderPlan();
    const residue = commitImportPlanWithOperations(second.plan, {
      writeAsset: () => {
        throw new Error('stage failure');
      },
      removeTree: () => {
        throw new Error('cleanup failure');
      },
    });
    expect(residue).toEqual({
      ok: false,
      error: expect.objectContaining({
        code: 'rollback-failed',
        rollbackClean: false,
        residualPath: expect.stringContaining('.import-'),
      }),
    });
  });

  it('validates default asset operations against stale content', () => {
    const root = temporaryRoot();
    const source = path.join(root, 'asset.txt');
    const destination = path.join(root, 'output.txt');
    fs.writeFileSync(source, 'v1');
    const asset = {
      sourcePath: source,
      relativePath: 'asset.txt',
      outputPath: 'assets/asset.txt',
      sizeBytes: 2,
      sha256: sha256Buffer('v1'),
    };
    fs.writeFileSync(source, 'v2');
    expect(() => defaultOperations.writeAsset(asset, destination)).toThrow(
      'changed after the preview',
    );
    fs.writeFileSync(source, 'v1');
    defaultOperations.writeAsset(asset, destination);
    expect(fs.readFileSync(destination, 'utf8')).toBe('v1');
  });

  it('rejects invalid receipts, missing sources, changed target assets, and source shape changes', () => {
    const invalid = filePlan();
    const invalidReceipt = commitReceipt(invalid.plan);
    expect(removeImportedSource({ ...invalidReceipt, sourceRetained: false as true })).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'invalid-receipt' }),
    });

    const missing = filePlan();
    const missingReceipt = commitReceipt(missing.plan);
    fs.unlinkSync(missing.source);
    expect(removeImportedSource(missingReceipt)).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'source-not-found' }),
    });

    const folder = folderPlan();
    const folderReceipt = commitReceipt(folder.plan);
    const targetAsset = path.join(
      folderReceipt.targetDirectory,
      folderReceipt.assets[0].relativePath,
    );
    fs.writeFileSync(targetAsset, 'changed!');
    expect(removeImportedSource(folderReceipt)).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'target-changed' }),
    });

    const shaped = filePlan();
    const shapedReceipt = commitReceipt(shaped.plan);
    fs.unlinkSync(shaped.source);
    fs.mkdirSync(shaped.source);
    fs.writeFileSync(path.join(shaped.source, 'article.md'), '# Replacement folder');
    expect(removeImportedSource(shapedReceipt)).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'source-changed' }),
    });
  });

  it('reports filesystem deletion failures and removes retained Markdown files on success', () => {
    const failing = filePlan();
    const failingReceipt = commitReceipt(failing.plan);
    vi.spyOn(fs, 'unlinkSync').mockImplementationOnce((target) => {
      if (target === failing.source) throw new Error('locked');
      return undefined;
    });
    expect(removeImportedSource(failingReceipt)).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'source-removal-failed', cause: 'locked' }),
    });
    vi.restoreAllMocks();

    const successful = filePlan();
    const successfulReceipt = commitReceipt(successful.plan);
    expect(removeImportedSource(successfulReceipt)).toEqual({
      ok: true,
      removedPath: successful.source,
    });
    expect(fs.existsSync(successful.source)).toBe(false);
  });
});
