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
export function scanArchive(root = 'docs'): Article[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) files.push(p);
    }
  };
  walk(root);
  return files
    .map((f) => parseArticle(f, root))
    .filter((a): a is Article => Boolean(a))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}
export function createManifest(root = 'docs'): ArchiveManifestV1 {
  const articles = scanArchive(root);
  const cats = new Map<string, number>(),
    tags = new Map<string, number>();
  for (const a of articles) {
    cats.set(a.category, (cats.get(a.category) || 0) + 1);
    for (const t of a.tags) tags.set(t, (tags.get(t) || 0) + 1);
  }
  const entries = articles.map(
    ({ id, slug, title, date, category, tags, excerpt, readingStats, sourcePath }) => ({
      id,
      slug,
      title,
      date,
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
