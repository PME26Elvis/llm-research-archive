import fs from 'node:fs';
import path from 'node:path';
import { scanArchiveWithDiagnostics } from '@research-observatory/content-engine';

export interface PersistedWorkspaceState {
  schemaVersion: 1;
  rootPath?: string;
}

export interface ValidatedWorkspace {
  rootPath: string;
  articleCount: number;
  warnings: string[];
  invalidFiles: string[];
}

export const DEFAULT_WORKSPACE_STATE: PersistedWorkspaceState = { schemaVersion: 1 };

export function normalizeWorkspaceState(value: unknown): PersistedWorkspaceState {
  if (!value || typeof value !== 'object') return DEFAULT_WORKSPACE_STATE;
  const rootPath = (value as Record<string, unknown>).rootPath;
  if (typeof rootPath !== 'string' || !path.isAbsolute(rootPath) || !rootPath.trim()) {
    return DEFAULT_WORKSPACE_STATE;
  }
  return { schemaVersion: 1, rootPath: path.normalize(rootPath) };
}

export function loadWorkspaceState(filePath: string): PersistedWorkspaceState {
  try {
    return normalizeWorkspaceState(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  } catch {
    return DEFAULT_WORKSPACE_STATE;
  }
}

export function saveWorkspaceState(filePath: string, state: PersistedWorkspaceState): void {
  const temporary = `${filePath}.tmp`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(temporary, `${JSON.stringify(normalizeWorkspaceState(state), null, 2)}\n`, {
    mode: 0o600,
  });
  fs.renameSync(temporary, filePath);
}

export function validateWorkspaceRoot(candidate: string): ValidatedWorkspace {
  if (!path.isAbsolute(candidate)) throw new Error('workspace-path-must-be-absolute');
  const rootPath = fs.realpathSync(candidate);
  if (!fs.statSync(rootPath).isDirectory()) throw new Error('workspace-not-directory');
  const { articles, diagnostics } = scanArchiveWithDiagnostics(rootPath);
  if (!articles.length) throw new Error('workspace-has-no-valid-articles');
  return {
    rootPath,
    articleCount: articles.length,
    warnings: diagnostics.warnings,
    invalidFiles: diagnostics.invalidFiles,
  };
}
