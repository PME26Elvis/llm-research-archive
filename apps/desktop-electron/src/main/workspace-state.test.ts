import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WORKSPACE_STATE,
  loadWorkspaceState,
  normalizeWorkspaceState,
  saveWorkspaceState,
  validateWorkspaceRoot,
} from './workspace-state';

function article(root: string, name: string, body = 'Body') {
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'index.md'),
    `---\ndate: 2026-01-01\ntags: [workspace]\n---\n# ${name}\n\n${body}\n`,
  );
}

describe('workspace state', () => {
  it('normalizes only absolute persisted paths', () => {
    expect(normalizeWorkspaceState({ rootPath: 'relative' })).toEqual(DEFAULT_WORKSPACE_STATE);
    expect(normalizeWorkspaceState(null)).toEqual(DEFAULT_WORKSPACE_STATE);
    expect(normalizeWorkspaceState({ rootPath: path.resolve('/tmp/archive') }).rootPath).toBe(
      path.normalize(path.resolve('/tmp/archive')),
    );
  });

  it('writes atomically and recovers malformed files', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-workspace-state-'));
    const file = path.join(root, 'nested', 'workspace.json');
    const selected = path.join(root, 'archive');
    saveWorkspaceState(file, { schemaVersion: 1, rootPath: selected });
    expect(loadWorkspaceState(file)).toEqual({ schemaVersion: 1, rootPath: selected });
    expect(fs.existsSync(`${file}.tmp`)).toBe(false);
    fs.writeFileSync(file, '{broken');
    expect(loadWorkspaceState(file)).toEqual(DEFAULT_WORKSPACE_STATE);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('accepts valid articles while isolating malformed files', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-workspace-'));
    article(root, 'valid');
    const broken = path.join(root, 'broken');
    fs.mkdirSync(broken);
    fs.writeFileSync(path.join(broken, 'index.md'), '---\ndate: [invalid\n---\n# Broken');
    const workspace = validateWorkspaceRoot(root);
    expect(workspace.articleCount).toBe(1);
    expect(workspace.invalidFiles).toContain('broken/index.md');
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('rejects empty workspaces and reports symlink entries', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-workspace-'));
    expect(() => validateWorkspaceRoot(root)).toThrow(/no-valid-articles/);
    article(root, 'valid');
    const target = path.join(root, 'outside.md');
    fs.writeFileSync(target, '# Outside');
    fs.symlinkSync(target, path.join(root, 'linked.md'));
    const workspace = validateWorkspaceRoot(root);
    expect(workspace.warnings.some((warning) => warning.includes('linked.md'))).toBe(true);
    fs.rmSync(root, { recursive: true, force: true });
  });
});
