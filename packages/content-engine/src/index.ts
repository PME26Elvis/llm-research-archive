import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import {
  Article,
  ArchiveManifestV1,
  asArticleId,
  asCategoryId,
  ReadingStats,
} from '@research-observatory/domain';
export function readingStats(markdown: string): ReadingStats {
  const noCode = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[\^?\d+\]|\[\d+\]/g, ' ');
  const cjk = (noCode.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
  const latin = (noCode.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) || []).length;
  const displayCount = cjk + latin;
  return {
    displayCount,
    cjkCharacters: cjk,
    latinNumberTokens: latin,
    estimatedMinutes: Math.max(1, Math.ceil(displayCount / 500)),
  };
}
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'article';
export function parseArticle(file: string, root: string): Article {
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const title = String(data.title || path.basename(path.dirname(file)));
  const rel = path.relative(root, file).split(path.sep).join('/');
  const parts = rel.split('/');
  const category = parts.length > 2 ? parts[0] : 'general';
  const slug = parts.length > 2 ? parts[1] : slugify(title);
  const markdown = parsed.content.trim();
  const headings = [...markdown.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((m) => ({
    depth: m[1].length,
    text: m[2].trim(),
    slug: slugify(m[2]),
  }));
  const links = [...markdown.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => ({
    label: m[1],
    href: m[2],
    internal: !/^https?:/i.test(m[2]),
  }));
  return {
    id: asArticleId(`${category}/${slug}`),
    slug,
    title,
    date: String(data.date || '1970-01-01'),
    updatedAt: data.updated ? String(data.updated) : undefined,
    category: asCategoryId(category),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    sourcePath: rel,
    assetRoot: path.dirname(rel),
    markdown,
    excerpt: markdown.replace(/[#>*_`]/g, '').slice(0, 180),
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
      else if (
        e.name === 'index.md' &&
        !/^(observatory|timeline)$/.test(path.basename(path.dirname(p)))
      )
        files.push(p);
    }
  };
  walk(root);
  return files
    .map((f) => parseArticle(f, root))
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
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
