import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  addCleanupSummaries,
  cleanImportMarkdown,
  imageTarget,
  markdownImagePattern,
} from './cleanup';
import type {
  CreateImportPlanInput,
  ImportAssetPlan,
  ImportConflict,
  ImportMetadata,
  ImportOutputFilePlan,
  ImportPlan,
  ImportPlanResult,
} from './contracts';
import { importIssue } from './contracts';
import { resolveImportMetadata } from './metadata';
import {
  collectImportAssets,
  existingImportSymlinkAncestor,
  inspectImportSource,
  isImportPathInsideRoot,
  resolveImportWorkspaceRoot,
} from './source';

function ensureH1(markdown: string, title: string): string {
  const body = markdown.trim();
  if (/^#\s+.+?\s*$/mu.test(body)) return body.replace(/^#\s+.+?\s*$/mu, `# ${title}`);
  return `# ${title}${body ? `\n\n${body}` : ''}`;
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function createArticleContent(metadata: ImportMetadata, body: string, research?: string): string {
  const frontmatter = [
    '---',
    `date: ${metadata.date}`,
    'tags:',
    ...metadata.tags.map((tag) => `  - ${yamlString(tag)}`),
    '---',
    '',
  ].join('\n');
  const appendix = research
    ? `\n\n<details>\n<summary>附件（展開）</summary>\n\n${research.trim()}\n\n</details>`
    : '';
  return `${frontmatter}${ensureH1(body, metadata.title)}${appendix}\n`;
}

function localImageReferences(markdown: string): string[] {
  const references: string[] = [];
  for (const match of markdown.matchAll(markdownImagePattern)) {
    const target = imageTarget(match[2]);
    if (!target || /^(?:https?:|data:|app-asset:|#)/iu.test(target)) continue;
    references.push(target.replace(/^\.\//u, ''));
  }
  return references;
}

function createPlanId(plan: Omit<ImportPlan, 'planId' | 'canCommit'>): string {
  const stable = {
    schemaVersion: plan.schemaVersion,
    sourceKind: plan.source.kind,
    sourceName: path.basename(plan.source.rootPath),
    targetArticleRelativePath: plan.targetArticleRelativePath,
    metadata: plan.metadata,
    articleContent: plan.articleContent,
    cleanup: plan.cleanup,
    assets: plan.assets.map(({ relativePath, outputPath, sizeBytes }) => ({
      relativePath,
      outputPath,
      sizeBytes,
    })),
    warnings: plan.warnings.map(({ code, message }) => ({ code, message })),
    conflicts: plan.conflicts.map(({ code, message }) => ({ code, message })),
    requiresMetadataConfirmation: plan.requiresMetadataConfirmation,
  };
  return crypto.createHash('sha256').update(JSON.stringify(stable)).digest('hex');
}

export function createImportPlan(input: CreateImportPlanInput): ImportPlanResult {
  const sourceResult = inspectImportSource(input.sourcePath);
  if (!sourceResult.ok) return sourceResult;

  const workspaceResult = resolveImportWorkspaceRoot(input.workspaceRoot);
  if (!workspaceResult.ok) return workspaceResult;

  let parsed: ReturnType<typeof matter>;
  const raw = fs.readFileSync(sourceResult.source.articlePath, 'utf8');
  try {
    parsed = matter(raw);
  } catch {
    return {
      ok: false,
      issues: [
        importIssue(
          'error',
          'invalid-frontmatter',
          'Article front matter could not be parsed.',
          sourceResult.source.articlePath,
        ),
      ],
    };
  }

  const articleCleaned = cleanImportMarkdown(parsed.content);
  let cleanup = articleCleaned.cleanup;
  let research: string | undefined;
  if (sourceResult.source.researchPath) {
    const cleanedResearch = cleanImportMarkdown(
      fs.readFileSync(sourceResult.source.researchPath, 'utf8'),
    );
    cleanup = addCleanupSummaries(cleanup, cleanedResearch.cleanup);
    research = cleanedResearch.markdown;
  }

  const metadataResult = resolveImportMetadata({
    source: sourceResult.source,
    data: parsed.data as Record<string, unknown>,
    markdown: articleCleaned.markdown,
    publicationDate: input.publicationDate,
    overrides: input.overrides,
  });
  if (!metadataResult.ok) return metadataResult;

  let assets: ImportAssetPlan[] = [];
  if (sourceResult.source.assetsPath) {
    const assetResult = collectImportAssets(sourceResult.source.assetsPath);
    if (!assetResult.ok) return assetResult;
    assets = assetResult.assets;
  }

  const warnings = [...sourceResult.warnings, ...metadataResult.warnings];
  const availableAssets = new Set(assets.map((asset) => asset.outputPath));
  for (const reference of localImageReferences(articleCleaned.markdown)) {
    if (!availableAssets.has(reference)) {
      warnings.push(
        importIssue(
          'warning',
          'missing-asset-reference',
          'Article references a local image that is not present in the import asset plan.',
          reference,
        ),
      );
    }
  }
  warnings.sort(
    (left, right) =>
      left.code.localeCompare(right.code) || (left.path || '').localeCompare(right.path || ''),
  );

  const targetDirectory = path.resolve(
    workspaceResult.root,
    metadataResult.metadata.category,
    metadataResult.metadata.slug,
  );
  if (!isImportPathInsideRoot(workspaceResult.root, targetDirectory)) {
    return {
      ok: false,
      issues: [importIssue('error', 'invalid-metadata', 'Target path escaped the workspace root.')],
    };
  }
  const symlinkAncestor = existingImportSymlinkAncestor(workspaceResult.root, targetDirectory);
  if (symlinkAncestor) {
    return {
      ok: false,
      issues: [
        importIssue(
          'error',
          'target-symlink',
          'Target path contains an existing symbolic-link component.',
          symlinkAncestor,
        ),
      ],
    };
  }

  const targetArticlePath = path.join(targetDirectory, 'index.md');
  const targetArticleRelativePath = path
    .relative(workspaceResult.root, targetArticlePath)
    .split(path.sep)
    .join('/');
  const articleContent = createArticleContent(
    metadataResult.metadata,
    articleCleaned.markdown,
    research,
  );
  const conflicts: ImportConflict[] = fs.existsSync(targetDirectory)
    ? [
        {
          code: 'target-exists',
          path: targetDirectory,
          message: 'Target article directory already exists and must not be overwritten.',
        },
      ]
    : [];
  const outputFiles: ImportOutputFilePlan[] = [
    {
      kind: 'article',
      relativePath: targetArticleRelativePath,
      sizeBytes: Buffer.byteLength(articleContent),
    },
    ...assets.map((asset) => ({
      kind: 'asset' as const,
      relativePath: `${metadataResult.metadata.category}/${metadataResult.metadata.slug}/${asset.outputPath}`,
      sourcePath: asset.sourcePath,
      sizeBytes: asset.sizeBytes,
    })),
  ];

  const withoutId: Omit<ImportPlan, 'planId' | 'canCommit'> = {
    schemaVersion: 1,
    source: sourceResult.source,
    workspaceRoot: workspaceResult.root,
    targetDirectory,
    targetArticlePath,
    targetArticleRelativePath,
    metadata: metadataResult.metadata,
    articleContent,
    cleanup,
    assets,
    outputFiles,
    warnings,
    conflicts,
    requiresMetadataConfirmation: metadataResult.requiresMetadataConfirmation,
  };
  const canCommit = conflicts.length === 0 && !metadataResult.requiresMetadataConfirmation;
  return {
    ok: true,
    plan: {
      ...withoutId,
      planId: createPlanId(withoutId),
      canCommit,
    },
  };
}
