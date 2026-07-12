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
}

export interface ImportOutputFilePlan {
  kind: 'article' | 'asset';
  relativePath: string;
  sourcePath?: string;
  sizeBytes: number;
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
  workspaceRoot: string;
  targetDirectory: string;
  targetArticlePath: string;
  targetArticleRelativePath: string;
  metadata: ImportMetadata;
  articleContent: string;
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

export function importIssue(
  severity: ImportIssueSeverity,
  code: ImportIssueCode,
  message: string,
  issuePath?: string,
): ImportIssue {
  return { severity, code, message, ...(issuePath ? { path: issuePath } : {}) };
}
