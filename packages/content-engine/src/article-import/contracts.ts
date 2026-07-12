export type ImportSourceKind = 'markdown-file' | 'article-folder';
export type ImportIssueSeverity = 'warning' | 'error';

export type ImportIssueCode =
  | 'source-not-found'
  | 'unsupported-source'
  | 'source-symlink'
  | 'source-escape'
  | 'article-not-found'
  | 'invalid-frontmatter'
  | 'invalid-metadata'
  | 'category-fallback'
  | 'slug-fallback'
  | 'ignored-source-entry'
  | 'asset-symlink'
  | 'asset-escape'
  | 'missing-asset-reference'
  | 'target-symlink';

export interface ImportIssue {
  severity: ImportIssueSeverity;
  code: ImportIssueCode;
  message: string;
  path?: string;
}

export interface ImportMetadata {
  title: string;
  category: string;
  slug: string;
  tags: string[];
  date: string;
}

export interface ImportMetadataOverrides {
  title?: string;
  category?: string;
  slug?: string;
  tags?: readonly string[];
  date?: string;
}

export interface ImportCleanupSummary {
  citationMarkersRemoved: number;
  entityWrappersUnwrapped: number;
  imagePlaceholdersRemoved: number;
  nonPortableImagesRemoved: number;
}

export interface ImportSourceDescriptor {
  kind: ImportSourceKind;
  rootPath: string;
  articlePath: string;
  researchPath?: string;
  assetsPath?: string;
}

export interface ImportAssetPlan {
  sourcePath: string;
  relativePath: string;
  outputPath: string;
  sizeBytes: number;
  sha256: string;
}

export interface ImportOutputFilePlan {
  kind: 'article' | 'asset';
  relativePath: string;
  sourcePath?: string;
  sizeBytes: number;
  sha256: string;
}

export interface ImportConflict {
  code: 'target-exists';
  path: string;
  message: string;
}

export interface ImportPlan {
  schemaVersion: 1;
  planId: string;
  source: ImportSourceDescriptor;
  sourceFingerprint: string;
  workspaceRoot: string;
  targetDirectory: string;
  targetArticlePath: string;
  targetArticleRelativePath: string;
  metadata: ImportMetadata;
  articleContent: string;
  articleSha256: string;
  cleanup: ImportCleanupSummary;
  assets: ImportAssetPlan[];
  outputFiles: ImportOutputFilePlan[];
  warnings: ImportIssue[];
  conflicts: ImportConflict[];
  requiresMetadataConfirmation: boolean;
  canCommit: boolean;
}

export type ImportPlanResult =
  { ok: true; plan: ImportPlan } | { ok: false; issues: ImportIssue[] };

export interface CreateImportPlanInput {
  sourcePath: string;
  workspaceRoot: string;
  publicationDate?: string;
  overrides?: ImportMetadataOverrides;
}

export type ImportCommitErrorCode =
  | 'plan-not-committable'
  | 'stale-plan'
  | 'target-conflict'
  | 'commit-in-progress'
  | 'workspace-read-only'
  | 'stage-failed'
  | 'validation-failed'
  | 'commit-failed'
  | 'rollback-failed';

export interface ImportCommitError {
  code: ImportCommitErrorCode;
  message: string;
  path?: string;
  cause?: string;
  rollbackClean: boolean;
  residualPath?: string;
}

export interface ImportCommitReceiptAsset {
  relativePath: string;
  sha256: string;
  sizeBytes: number;
}

export interface ImportCommitReceipt {
  schemaVersion: 1;
  planId: string;
  source: ImportSourceDescriptor;
  sourceFingerprint: string;
  workspaceRoot: string;
  targetDirectory: string;
  targetArticlePath: string;
  articleSha256: string;
  assets: ImportCommitReceiptAsset[];
  committedAt: string;
  sourceRetained: true;
}

export type ImportCommitResult =
  { ok: true; receipt: ImportCommitReceipt } | { ok: false; error: ImportCommitError };

export type ImportSourceRemovalErrorCode =
  | 'invalid-receipt'
  | 'target-changed'
  | 'source-not-found'
  | 'source-changed'
  | 'source-not-removable'
  | 'source-removal-failed';

export interface ImportSourceRemovalError {
  code: ImportSourceRemovalErrorCode;
  message: string;
  path?: string;
  cause?: string;
}

export type ImportSourceRemovalResult =
  { ok: true; removedPath: string } | { ok: false; error: ImportSourceRemovalError };

export function importIssue(
  severity: ImportIssueSeverity,
  code: ImportIssueCode,
  message: string,
  issuePath?: string,
): ImportIssue {
  return { severity, code, message, ...(issuePath ? { path: issuePath } : {}) };
}
