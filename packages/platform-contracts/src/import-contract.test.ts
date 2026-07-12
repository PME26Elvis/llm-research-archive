import { describe, expect, it } from 'vitest';
import {
  DesktopCommandSchema,
  ImportCommitRequestSchema,
  ImportCommitResultSchema,
  ImportPlanPreviewDtoSchema,
  ImportPreviewRefreshRequestSchema,
  ImportSourceSelectionRequestSchema,
} from './index';

const preview = {
  planId: 'a'.repeat(64),
  source: { kind: 'markdown-file' as const, displayName: 'report.md' },
  targetWorkspaceName: 'archive',
  targetArticleRelativePath: 'llm/report/index.md',
  metadata: {
    title: 'Report',
    category: 'llm',
    slug: 'report',
    tags: ['LLM'],
    date: '2026-07-12',
  },
  cleanup: {
    citationMarkersRemoved: 1,
    entityWrappersUnwrapped: 0,
    imagePlaceholdersRemoved: 0,
    nonPortableImagesRemoved: 0,
  },
  assets: [],
  outputFiles: [
    {
      kind: 'article' as const,
      relativePath: 'llm/report/index.md',
      sizeBytes: 100,
    },
  ],
  warnings: [],
  conflicts: [],
  requiresMetadataConfirmation: false,
  canCommit: true,
};

describe('desktop import contracts', () => {
  it('accepts only the finite import command and source chooser modes', () => {
    expect(DesktopCommandSchema.parse('import.open')).toBe('import.open');
    expect(ImportSourceSelectionRequestSchema.parse({ kind: 'markdown-file' })).toEqual({
      kind: 'markdown-file',
    });
    expect(ImportSourceSelectionRequestSchema.safeParse({ kind: 'executable' }).success).toBe(
      false,
    );
  });

  it('validates sanitized previews without absolute source paths or write authority', () => {
    expect(ImportPlanPreviewDtoSchema.parse(preview).targetArticleRelativePath).toBe(
      'llm/report/index.md',
    );
    expect(
      ImportPlanPreviewDtoSchema.safeParse({
        ...preview,
        sourcePath: '/tmp/x',
      }).success,
    ).toBe(false);
  });

  it('requires complete validated metadata before refreshing a preview', () => {
    expect(
      ImportPreviewRefreshRequestSchema.parse({
        planId: preview.planId,
        metadata: preview.metadata,
      }),
    ).toEqual({ planId: preview.planId, metadata: preview.metadata });
    expect(
      ImportPreviewRefreshRequestSchema.safeParse({
        planId: preview.planId,
        metadata: { ...preview.metadata, slug: '../escape' },
      }).success,
    ).toBe(false);
  });

  it('models commit authority as an opaque plan id plus an explicit source-removal choice', () => {
    expect(ImportCommitRequestSchema.parse({ planId: preview.planId })).toEqual({
      planId: preview.planId,
      removeSource: false,
    });
    const result = ImportCommitResultSchema.parse({
      status: 'committed',
      articleId: 'llm/report',
      workspace: {
        kind: 'local',
        rootPath: '/tmp/archive',
        displayName: 'archive',
        articleCount: 2,
        warnings: [],
        invalidFiles: [],
      },
      sourceStatus: 'retained',
    });
    expect(result.status).toBe('committed');
    if (result.status !== 'committed') return;
    expect(result.articleId).toBe('llm/report');
  });
});
