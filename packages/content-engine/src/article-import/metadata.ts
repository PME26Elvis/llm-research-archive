import crypto from 'node:crypto';
import { cleanHeadingText } from '@research-observatory/domain';
import type {
  ImportIssue,
  ImportMetadata,
  ImportMetadataOverrides,
  ImportSourceDescriptor,
} from './contracts';
import { importIssue } from './contracts';

interface CategoryRule {
  id: string;
  tag: string;
  keywords: readonly string[];
  topicTags: readonly (readonly [string, string])[];
}

const categoryRules: readonly CategoryRule[] = [
  {
    id: 'llm',
    tag: 'LLM',
    keywords: [
      'llm',
      'ai',
      'agent',
      'model',
      'inference',
      'compute',
      'gpu',
      'benchmark',
      '人工智慧',
      '模型',
      '算力',
    ],
    topicTags: [
      ['agent', 'Agentic AI'],
      ['inference', 'Inference'],
      ['gpu', 'GPU'],
      ['benchmark', 'Benchmark'],
    ],
  },
  {
    id: 'cs',
    tag: 'CS',
    keywords: [
      'computer science',
      'programming',
      'software',
      'algorithm',
      'data structure',
      'taxonomy',
      '演算法',
      '資料結構',
      '軟體',
    ],
    topicTags: [
      ['software', 'Software Engineering'],
      ['algorithm', 'Algorithm'],
      ['programming', 'Programming'],
    ],
  },
  {
    id: 'health',
    tag: 'Health',
    keywords: [
      'health',
      'medical',
      'medicine',
      'nutrition',
      'fitness',
      'sleep',
      '健康',
      '醫療',
      '營養',
      '睡眠',
    ],
    topicTags: [
      ['nutrition', 'Nutrition'],
      ['fitness', 'Fitness'],
      ['sleep', 'Sleep'],
    ],
  },
  {
    id: 'carbon',
    tag: 'Carbon',
    keywords: [
      'carbon',
      'energy',
      'renewable',
      'emission',
      'climate',
      '碳',
      '能源',
      '再生能源',
      '排放',
      '氣候',
    ],
    topicTags: [
      ['energy', 'Energy'],
      ['renewable', 'Renewable Energy'],
      ['emission', 'Emissions'],
      ['climate', 'Climate'],
    ],
  },
];

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeImportKebabCase(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Mark}+/gu, '')
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '')
    .slice(0, 80)
    .replace(/-$/u, '');
}

function inferCategory(text: string): string | undefined {
  const lower = text.toLocaleLowerCase();
  let best: { id: string; score: number } | undefined;
  for (const rule of categoryRules) {
    const score = rule.keywords.reduce(
      (total, keyword) => total + (lower.includes(keyword.toLocaleLowerCase()) ? 1 : 0),
      0,
    );
    if (score > 0 && (!best || score > best.score)) best = { id: rule.id, score };
  }
  return best?.id;
}

function categoryTag(category: string): string {
  return (
    categoryRules.find((rule) => rule.id === category)?.tag ||
    category
      .split('-')
      .map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1))
      .join(' ')
  );
}

function inferTopicTags(text: string, category: string): string[] {
  const rule = categoryRules.find((candidate) => candidate.id === category);
  if (!rule) return [];
  const lower = text.toLocaleLowerCase();
  return rule.topicTags
    .filter(([keyword]) => lower.includes(keyword.toLocaleLowerCase()))
    .map(([, tag]) => tag);
}

function normalizeTags(values: readonly string[], category: string): string[] {
  const candidates = [categoryTag(category), ...values];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of candidates) {
    const tag = value.trim().replace(/\s+/gu, ' ');
    const key = tag.toLocaleLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    normalized.push(tag.slice(0, 80));
    if (normalized.length === 8) break;
  }
  return normalized;
}

function validIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function metadataIssues(metadata: ImportMetadata): ImportIssue[] {
  const issues: ImportIssue[] = [];
  if (!metadata.title || metadata.title.length > 200) {
    issues.push(
      importIssue('error', 'invalid-metadata', 'Title must contain 1 to 200 characters.'),
    );
  }
  if (!kebabCasePattern.test(metadata.category) || metadata.category.length > 80) {
    issues.push(
      importIssue('error', 'invalid-metadata', 'Category must be lowercase English kebab-case.'),
    );
  }
  if (!kebabCasePattern.test(metadata.slug) || metadata.slug.length > 80) {
    issues.push(
      importIssue('error', 'invalid-metadata', 'Slug must be lowercase English kebab-case.'),
    );
  }
  if (!validIsoDate(metadata.date)) {
    issues.push(importIssue('error', 'invalid-metadata', 'Date must be a real YYYY-MM-DD date.'));
  }
  if (!metadata.tags.length || metadata.tags.some((tag) => !tag.trim() || tag.length > 80)) {
    issues.push(
      importIssue('error', 'invalid-metadata', 'Tags must contain 1 to 8 non-empty values.'),
    );
  }
  return issues;
}

function frontmatterTags(data: Record<string, unknown>): string[] {
  if (Array.isArray(data.tags))
    return data.tags.filter((tag): tag is string => typeof tag === 'string');
  if (typeof data.tags === 'string') {
    return data.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function frontmatterDate(data: Record<string, unknown>): string | undefined {
  if (data.date instanceof Date) return data.date.toISOString().slice(0, 10);
  if (typeof data.date === 'string') return data.date.slice(0, 10);
  return undefined;
}

function sourceFallbackName(source: ImportSourceDescriptor): string {
  const normalized = source.rootPath.replace(/\\/gu, '/');
  const name = normalized.split('/').at(-1) || 'article';
  return source.kind === 'markdown-file' ? name.replace(/\.[^.]+$/u, '') : name;
}

export function resolveImportMetadata(input: {
  source: ImportSourceDescriptor;
  data: Record<string, unknown>;
  markdown: string;
  publicationDate?: string;
  overrides?: ImportMetadataOverrides;
}):
  | {
      ok: true;
      metadata: ImportMetadata;
      warnings: ImportIssue[];
      requiresMetadataConfirmation: boolean;
    }
  | { ok: false; issues: ImportIssue[] } {
  const rawTitle =
    input.overrides?.title ||
    (typeof input.data.title === 'string' ? input.data.title : undefined) ||
    input.markdown.match(/^#\s+(.+?)\s*$/mu)?.[1] ||
    sourceFallbackName(input.source).replace(/[-_]+/gu, ' ');
  const title = cleanHeadingText(rawTitle).trim() || 'Untitled article';
  const inferenceText = `${title}\n${input.markdown}`;
  const inferredCategory = inferCategory(inferenceText);
  const declaredCategory =
    input.overrides?.category ||
    (typeof input.data.category === 'string' ? input.data.category : undefined);
  if (declaredCategory && !kebabCasePattern.test(declaredCategory)) {
    return {
      ok: false,
      issues: [
        importIssue(
          'error',
          'invalid-metadata',
          'Explicit category must already be lowercase English kebab-case.',
        ),
      ],
    };
  }
  const category = declaredCategory || inferredCategory || 'uncategorized';
  const requiresMetadataConfirmation = !declaredCategory && !inferredCategory;
  const warnings: ImportIssue[] = [];
  if (requiresMetadataConfirmation) {
    warnings.push(
      importIssue(
        'warning',
        'category-fallback',
        'Category could not be inferred; uncategorized requires explicit confirmation or correction.',
      ),
    );
  }

  const explicitSlug =
    input.overrides?.slug || (typeof input.data.slug === 'string' ? input.data.slug : undefined);
  if (explicitSlug && !kebabCasePattern.test(explicitSlug)) {
    return {
      ok: false,
      issues: [
        importIssue(
          'error',
          'invalid-metadata',
          'Explicit slug must already be lowercase English kebab-case.',
        ),
      ],
    };
  }
  let slug = explicitSlug || normalizeImportKebabCase(title);
  if (!slug) slug = normalizeImportKebabCase(sourceFallbackName(input.source));
  if (!slug) {
    slug = `article-${crypto.createHash('sha256').update(inferenceText).digest('hex').slice(0, 12)}`;
    warnings.push(
      importIssue(
        'warning',
        'slug-fallback',
        'Title and source name contained no Latin slug characters; a deterministic slug was generated.',
      ),
    );
  }

  const sourceTags = frontmatterTags(input.data);
  const tagCandidates =
    input.overrides?.tags ??
    (sourceTags.length ? sourceTags : inferTopicTags(inferenceText, category));
  const metadata: ImportMetadata = {
    title,
    category,
    slug,
    tags: normalizeTags(tagCandidates, category),
    date:
      input.overrides?.date ||
      frontmatterDate(input.data) ||
      input.publicationDate ||
      new Date().toISOString().slice(0, 10),
  };
  const issues = metadataIssues(metadata);
  return issues.length
    ? { ok: false, issues }
    : { ok: true, metadata, warnings, requiresMetadataConfirmation };
}
