import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { commitImportPlan, commitImportPlanWithOperations } from './commit-transaction';
import { removeImportedSource } from './source-removal';
import { createImportPlan } from './planner';
import type { ImportCommitReceipt, ImportPlan } from './contracts';

const temporaryRoots: string[] = [];

function temporaryRoot(prefix: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  temporaryRoots.push(root);
  return root;
}

function createFilePlan(options?: { title?: string; sourceName?: string; body?: string }): {
  root: string;
  workspace: string;
  source: string;
  plan: ImportPlan;
} {
  const root = temporaryRoot('import-commit-file-');
  const workspace = path.join(root, 'workspace');
  const source = path.join(root, options?.sourceName || 'report.md');
  fs.mkdirSync(workspace);
  fs.writeFileSync(
    source,
    `# ${options?.title || 'GPU Model Report'}\n\n${options?.body || 'LLM GPU benchmark.'}`,
  );
  const result = createImportPlan({
    sourcePath: source,
    workspaceRoot: workspace,
    publicationDate: '2026-07-12',
  });
  if (!result.ok) throw new Error(result.issues.map((issue) => issue.message).join('\n'));
  return { root, workspace, source, plan: result.plan };
}

function createFolderPlan(): {
  root: string;
  workspace: string;
  source: string;
  plan: ImportPlan;
} {
  const root = temporaryRoot('import-commit-folder-');
  const workspace = path.join(root, 'workspace');
  const source = path.join(root, 'energy-report');
  fs.mkdirSync(path.join(source, 'assets', 'charts'), { recursive: true });
  fs.mkdirSync(workspace);
  fs.writeFileSync(
    path.join(source, 'article.md'),
    '# Energy Carbon Report\n\n![chart](assets/charts/chart.png)\n',
  );
  fs.writeFileSync(path.join(source, 'research-activity.md'), 'Research appendix.');
  fs.writeFileSync(path.join(source, 'assets', 'charts', 'chart.png'), 'chart-v1');
  const result = createImportPlan({
    sourcePath: source,
    workspaceRoot: workspace,
    publicationDate: '2026-07-12',
    overrides: { category: 'carbon', slug: 'energy-carbon-report' },
  });
  if (!result.ok) throw new Error(result.issues.map((issue) => issue.message).join('\n'));
  return { root, workspace, source, plan: result.plan };
}

function expectNoTransactionResidue(workspace: string): void {
  const residue: string[] = [];
  const visit = (directory: string) => {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.name.includes('.import-') || entry.name.endsWith('.import.lock'))
        residue.push(full);
      if (entry.isDirectory()) visit(full);
    }
  };
  visit(workspace);
  expect(residue).toEqual([]);
}

function committedReceipt(plan: ImportPlan): ImportCommitReceipt {
  const result = commitImportPlan(plan);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.receipt;
}

afterEach(() => {
  while (temporaryRoots.length) {
    fs.rmSync(temporaryRoots.pop()!, { recursive: true, force: true });
  }
});

describe('atomic article import commit', () => {
  it('stages, validates, atomically publishes, and retains the source by default', () => {
    const { workspace, source, plan } = createFolderPlan();

    const result = commitImportPlanWithOperations(plan, {
      now: () => new Date('2026-07-12T06:00:00.000Z'),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.receipt).toEqual(
      expect.objectContaining({
        planId: plan.planId,
        committedAt: '2026-07-12T06:00:00.000Z',
        sourceRetained: true,
      }),
    );
    expect(fs.readFileSync(result.receipt.targetArticlePath, 'utf8')).toBe(plan.articleContent);
    expect(
      fs.readFileSync(path.join(result.receipt.targetDirectory, 'assets/charts/chart.png'), 'utf8'),
    ).toBe('chart-v1');
    expect(fs.existsSync(source)).toBe(true);
    expectNoTransactionResidue(workspace);
  });

  it('rejects a same-size asset mutation as a stale plan before publishing', () => {
    const { workspace, source, plan } = createFolderPlan();
    fs.writeFileSync(path.join(source, 'assets', 'charts', 'chart.png'), 'chart-v2');

    const result = commitImportPlan(plan);

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'stale-plan', rollbackClean: true }),
    });
    expect(fs.existsSync(plan.targetDirectory)).toBe(false);
    expect(fs.existsSync(source)).toBe(true);
    expectNoTransactionResidue(workspace);
  });

  it('does not overwrite a target created after preview', () => {
    const { workspace, source, plan } = createFilePlan();
    fs.mkdirSync(plan.targetDirectory, { recursive: true });
    const sentinel = path.join(plan.targetDirectory, 'keep.txt');
    fs.writeFileSync(sentinel, 'keep');

    const result = commitImportPlan(plan);

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'target-conflict', rollbackClean: true }),
    });
    expect(fs.readFileSync(sentinel, 'utf8')).toBe('keep');
    expect(fs.existsSync(source)).toBe(true);
    expectNoTransactionResidue(workspace);
  });

  it('rolls back an injected asset write failure without leaving a category or staging tree', () => {
    const { workspace, source, plan } = createFolderPlan();

    const result = commitImportPlanWithOperations(plan, {
      writeAsset: () => {
        throw new Error('injected asset failure');
      },
    });

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'stage-failed', rollbackClean: true }),
    });
    expect(fs.existsSync(plan.targetDirectory)).toBe(false);
    expect(fs.existsSync(path.dirname(plan.targetDirectory))).toBe(false);
    expect(fs.existsSync(source)).toBe(true);
    expectNoTransactionResidue(workspace);
  });

  it('rolls back staged output that fails post-write validation', () => {
    const { workspace, source, plan } = createFilePlan();

    const result = commitImportPlanWithOperations(plan, {
      writeArticle: (filePath) => fs.writeFileSync(filePath, 'tampered'),
    });

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'validation-failed', rollbackClean: true }),
    });
    expect(fs.existsSync(plan.targetDirectory)).toBe(false);
    expect(fs.existsSync(source)).toBe(true);
    expectNoTransactionResidue(workspace);
  });

  it('rolls back a failed atomic rename and preserves the source', () => {
    const { workspace, source, plan } = createFilePlan();

    const result = commitImportPlanWithOperations(plan, {
      rename: () => {
        throw new Error('injected rename failure');
      },
    });

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'commit-failed', rollbackClean: true }),
    });
    expect(fs.existsSync(plan.targetDirectory)).toBe(false);
    expect(fs.existsSync(source)).toBe(true);
    expectNoTransactionResidue(workspace);
  });

  it('preserves a lock owned by another import and reports commit-in-progress', () => {
    const { workspace, plan } = createFilePlan();
    const category = path.dirname(plan.targetDirectory);
    fs.mkdirSync(category, { recursive: true });
    const lock = path.join(category, `.${plan.metadata.slug}.import.lock`);
    fs.writeFileSync(lock, 'other-transaction');

    const result = commitImportPlan(plan);

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'commit-in-progress', rollbackClean: true }),
    });
    expect(fs.readFileSync(lock, 'utf8')).toBe('other-transaction');
    expect(fs.existsSync(plan.targetDirectory)).toBe(false);
    expect(fs.readdirSync(category)).toEqual([path.basename(lock)]);
    expect(fs.existsSync(workspace)).toBe(true);
  });

  it('refuses to commit a preview that still requires metadata confirmation', () => {
    const { plan, source } = createFilePlan({
      title: '生活筆記',
      sourceName: '生活筆記.md',
      body: '今天整理房間。',
    });
    expect(plan.canCommit).toBe(false);

    const result = commitImportPlan(plan);

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'plan-not-committable', rollbackClean: true }),
    });
    expect(fs.existsSync(source)).toBe(true);
    expect(fs.existsSync(plan.targetDirectory)).toBe(false);
  });

  it('removes the retained source only through a separate validated action', () => {
    const { source, plan } = createFolderPlan();
    const receipt = committedReceipt(plan);
    expect(fs.existsSync(source)).toBe(true);

    const removed = removeImportedSource(receipt);

    expect(removed).toEqual({ ok: true, removedPath: source });
    expect(fs.existsSync(source)).toBe(false);
    expect(fs.existsSync(receipt.targetArticlePath)).toBe(true);
  });

  it('refuses source removal when the source changed after commit', () => {
    const { source, plan } = createFilePlan();
    const receipt = committedReceipt(plan);
    fs.appendFileSync(source, '\nchanged');

    const removed = removeImportedSource(receipt);

    expect(removed).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'source-changed' }),
    });
    expect(fs.existsSync(source)).toBe(true);
    expect(fs.existsSync(receipt.targetArticlePath)).toBe(true);
  });

  it('refuses folder removal when unplanned files are present', () => {
    const { source, plan } = createFolderPlan();
    const receipt = committedReceipt(plan);
    fs.writeFileSync(path.join(source, 'notes.txt'), 'do not delete');

    const removed = removeImportedSource(receipt);

    expect(removed).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'source-not-removable' }),
    });
    expect(fs.readFileSync(path.join(source, 'notes.txt'), 'utf8')).toBe('do not delete');
  });

  it('refuses source removal when committed output was modified', () => {
    const { source, plan } = createFilePlan();
    const receipt = committedReceipt(plan);
    fs.appendFileSync(receipt.targetArticlePath, '\nmodified');

    const removed = removeImportedSource(receipt);

    expect(removed).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'target-changed' }),
    });
    expect(fs.existsSync(source)).toBe(true);
  });
});
