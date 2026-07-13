export * from './article-import';

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import { z } from 'zod';
import {
  Article,
  ArchiveManifestV1,
  asArticleId,
  asCategoryId,
  ReadingStats,
  HeadingSlugger,
  baseHeadingSlug,
  cleanHeadingText,
} from '@research-observatory/domain';

const excludedSourcePaths = new Set([
  'index.md',
  'tags.md',
  'word-counts.md',
  'article-publishing-workflow.md',
  'timeline/index.md',
  'observatory/index.md',
]);
const metadataSchema = z
  .object({
    date: z.union([z.string(), z.date()]),
    tags: z.array(z.string()).default([]),
    title: z.string().optional(),
    updated: z.union([z.string(), z.date()]).optional(),
  })
  .passthrough();
const cleanInline = cleanHeadingText;
const slugify = baseHeadingSlug;
export function readingStats(markdown: string): ReadingStats {
  const text = cleanInline(
    markdown
      .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, ' ')
      .replace(/.*?/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  );
  const cjk = (text.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) || []).length;
  const latin = (
    text
      .replace(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g, ' ')
      .match(/[A-Za-z0-9]+(?:[-'’][A-Za-z0-9]+)*/g) || []
  ).length;
  const displayCount = cjk + latin;
  return {
    displayCount,
    cjkCharacters: cjk,
    latinNumberTokens: latin,
    estimatedMinutes: displayCount ? Math.max(1, Math.round(displayCount / 500)) : 0,
  };
}
export function isArticlePath(sourcePath: string, data: unknown): boolean {
  return !excludedSourcePaths.has(sourcePath) && metadataSchema.safeParse(data).success;
}
export function titleFromMarkdown(markdown: string, fallback: string): string {
  return cleanInline(markdown.match(/^#\s+(.+?)\s*$/m)?.[1] || fallback).trim();
}
export function resolveInternalArticleId(fromSourcePath: string, href: string): any {
  const clean = href.split('#')[0];
  if (!clean || /^(https?:|mailto:|javascript:|data:|file:)/i.test(clean)) return undefined;
  const fromDir = path.posix.dirname(fromSourcePath);
  let target = path.posix.normalize(path.posix.join(fromDir, clean));
  if (target.endsWith('/')) target += 'index.md';
  if (!target.endsWith('.md')) target = path.posix.join(target, 'index.md');
  const parts = target.split('/');
  if (parts.length >= 3 && parts.at(-1) === 'index.md') return `${parts[0]}/${parts[1]}`;
  return undefined;
}
export function parseArticle(file: string, root: string): Article | undefined {
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = matter(raw);
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (!isArticlePath(rel, parsed.data)) return undefined;
  const data = metadataSchema.parse(parsed.data);
  const parts = rel.split('/');
  const category = parts.length > 2 ? parts[0] : '未分類';
  const slug =
    parts.length > 2
      ? parts[1]
      : slugify(
          titleFromMarkdown(
            parsed.content,
            String(data.title || path.basename(path.dirname(file))),
          ),
        );
  const markdown = parsed.content.trim();
  const title = titleFromMarkdown(markdown, data.title || path.basename(path.dirname(file)));
  const headingSlugger = new HeadingSlugger();
  const headings = [...markdown.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((m) => {
    const text = cleanInline(m[2]).trim();
    return { depth: m[1].length, text, slug: headingSlugger.slug(text) };
  });
  const links = [...markdown.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => {
    const href = m[2];
    const internal = !/^(https?:|mailto:|javascript:|data:|file:)/i.test(href);
    return {
      label: m[1],
      href,
      internal,
      targetArticleId: internal ? resolveInternalArticleId(rel, href) : undefined,
    };
  });
  const date =
    data.date instanceof Date
      ? data.date.toISOString().slice(0, 10)
      : String(data.date).slice(0, 10);
  const updatedAt = data.updated
    ? data.updated instanceof Date
      ? data.updated.toISOString().slice(0, 10)
      : String(data.updated).slice(0, 10)
    : undefined;
  return {
    id: asArticleId(`${category}/${slug}`),
    slug,
    title,
    date,
    updatedAt,
    category: asCategoryId(category),
    tags: data.tags,
    sourcePath: rel,
    assetRoot: path.dirname(rel),
    markdown,
    excerpt: cleanInline(markdown).replace(/\s+/g, ' ').slice(0, 180),
    readingStats: readingStats(markdown),
    links,
    headings,
  };
}
export interface ArchiveDiagnostics {
  warnings: string[];
  invalidFiles: string[];
  brokenLinks: string[];
  missingAssets: string[];
}

export interface ArchiveScanResult {
  articles: Article[];
  diagnostics: ArchiveDiagnostics;
}

function isInsideRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

function isFormalArticleCandidate(sourcePath: string): boolean {
  return path.posix.basename(sourcePath) === 'index.md' && !excludedSourcePaths.has(sourcePath);
}

export function scanArchiveWithDiagnostics(root = 'docs'): ArchiveScanResult {
  const realRoot = fs.realpathSync(root);
  const files: string[] = [];
  const diagnostics: ArchiveDiagnostics = {
    warnings: [],
    invalidFiles: [],
    brokenLinks: [],
    missingAssets: [],
  };

  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      const relative = path.relative(realRoot, full).split(path.sep).join('/');
      const stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) {
        diagnostics.warnings.push(`${relative}: symlink skipped`);
        continue;
      }
      if (stat.isDirectory()) {
        visit(full);
        continue;
      }
      if (!stat.isFile() || !entry.name.endsWith('.md')) continue;
      const realFile = fs.realpathSync(full);
      if (!isInsideRoot(realRoot, realFile)) {
        diagnostics.warnings.push(`${relative}: path escaped workspace root`);
        continue;
      }
      files.push(realFile);
    }
  };

  visit(realRoot);
  const articles: Article[] = [];
  for (const file of files.sort()) {
    const relative = path.relative(realRoot, file).split(path.sep).join('/');
    try {
      const article = parseArticle(file, realRoot);
      if (article) articles.push(article);
      else if (isFormalArticleCandidate(relative)) diagnostics.invalidFiles.push(relative);
    } catch {
      diagnostics.invalidFiles.push(relative);
    }
  }
  articles.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

  const articleIds = new Set(articles.map((article) => article.id));
  for (const article of articles) {
    for (const link of article.links) {
      if (link.internal && link.targetArticleId && !articleIds.has(link.targetArticleId)) {
        diagnostics.brokenLinks.push(`${article.sourcePath}: ${link.href}`);
      }
    }
    const sourceDirectory = path.dirname(path.join(realRoot, article.sourcePath));
    for (const match of article.markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
      const raw = match[1]
        .trim()
        .replace(/^<|>$/g, '')
        .split(/\s+["']/)[0];
      if (!raw || /^(?:https?:|data:|app-asset:|#)/i.test(raw)) continue;
      const asset = path.resolve(sourceDirectory, raw);
      if (!isInsideRoot(realRoot, asset) || !fs.existsSync(asset)) {
        diagnostics.missingAssets.push(`${article.sourcePath}: ${raw}`);
      }
    }
  }

  diagnostics.warnings.sort();
  diagnostics.invalidFiles.sort();
  diagnostics.brokenLinks.sort();
  diagnostics.missingAssets.sort();
  return { articles, diagnostics };
}

export function scanArchive(root = 'docs'): Article[] {
  return scanArchiveWithDiagnostics(root).articles;
}

export function createManifest(root = 'docs'): ArchiveManifestV1 {
  const articles = scanArchiveWithDiagnostics(root).articles;
  const cats = new Map<string, number>(),
    tags = new Map<string, number>();
  for (const a of articles) {
    cats.set(a.category, (cats.get(a.category) || 0) + 1);
    for (const t of a.tags) tags.set(t, (tags.get(t) || 0) + 1);
  }
  const entries = articles.map(
    ({ id, slug, title, date, updatedAt, category, tags, excerpt, readingStats, sourcePath }) => ({
      id,
      slug,
      title,
      date,
      updatedAt,
      category,
      tags,
      excerpt,
      readingStats,
      sourcePath,
    }),
  );
  const hash = crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex');
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    contentHash: hash,
    generatedBy: 'content-engine@0.1.0',
    articles: entries,
    categories: [...cats].sort().map(([id, count]) => ({ id: asCategoryId(id), title: id, count })),
    tags: [...tags].sort().map(([tag, count]) => ({ tag, count })),
  };
}
