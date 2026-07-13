import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { SearchIndex } from '../packages/search-engine/src/index.ts';
import {
  buildArchiveBrowseModel,
  filterArticlesByBrowse,
} from '../packages/renderer-ui/src/browse.ts';

const QUERY_P95_BUDGET_MS = 100;
const FILTER_P95_BUDGET_MS = 100;
const RENDERER_BLOCK_BUDGET_MS = 50;

function syntheticArticles(count) {
  return Array.from({ length: count }, (_, index) => {
    const category = `category-${index % 20}`;
    const tag = `tag-${index % 50}`;
    const month = String((index % 12) + 1).padStart(2, '0');
    return {
      id: `${category}/article-${index}`,
      slug: `article-${index}`,
      title: `Synthetic article ${index} common needle-${index % 17}`,
      date: `2026-${month}-${String((index % 28) + 1).padStart(2, '0')}`,
      category,
      tags: [tag, 'benchmark'],
      markdown: `Benchmark body ${index} contains common search text and token-${index % 97}.`,
      excerpt: `Synthetic article ${index}`,
      sourcePath: `${category}/article-${index}/index.md`,
      assetRoot: `${category}/article-${index}`,
      readingStats: {
        displayCount: 20,
        cjkCharacters: 0,
        latinNumberTokens: 20,
        estimatedMinutes: 1,
      },
      links: [],
      headings: [],
    };
  });
}

function duration(operation) {
  const start = performance.now();
  const value = operation();
  return { value, milliseconds: performance.now() - start };
}

function percentile(values, percentileValue) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * percentileValue) - 1);
  return sorted[index] ?? 0;
}

function benchmarkCorpus(count) {
  const articles = syntheticArticles(count);
  const construction = duration(() => new SearchIndex(articles));
  const serialized = duration(() => construction.value.serialize());
  const deserialized = duration(() => SearchIndex.deserialize(serialized.value));
  const queryDurations = [];
  const filterDurations = [];
  const rendererDurations = [];

  for (let iteration = 0; iteration < 60; iteration += 1) {
    queryDurations.push(
      duration(() => deserialized.value.search(`needle-${iteration % 17}`)).milliseconds,
    );
    filterDurations.push(
      duration(() => deserialized.value.filter({ mode: 'tag', facet: `tag-${iteration % 50}` }))
        .milliseconds,
    );
    rendererDurations.push(
      duration(() => {
        buildArchiveBrowseModel(articles);
        filterArticlesByBrowse(articles, 'category', `category-${iteration % 20}`);
      }).milliseconds,
    );
  }

  return {
    articleCount: count,
    constructionMs: construction.milliseconds,
    serializationMs: serialized.milliseconds,
    deserializationMs: deserialized.milliseconds,
    serializedBytes: Buffer.byteLength(serialized.value),
    warmQueryP95Ms: percentile(queryDurations, 0.95),
    filterUpdateP95Ms: percentile(filterDurations, 0.95),
    rendererSynchronousMaxMs: Math.max(...rendererDurations),
  };
}

const results = [benchmarkCorpus(1_000), benchmarkCorpus(10_000)];
for (const result of results) {
  if (result.warmQueryP95Ms > QUERY_P95_BUDGET_MS) {
    throw new Error(
      `${result.articleCount}-article warm query p95 ${result.warmQueryP95Ms.toFixed(2)}ms exceeds ${QUERY_P95_BUDGET_MS}ms`,
    );
  }
  if (result.filterUpdateP95Ms > FILTER_P95_BUDGET_MS) {
    throw new Error(
      `${result.articleCount}-article filter p95 ${result.filterUpdateP95Ms.toFixed(2)}ms exceeds ${FILTER_P95_BUDGET_MS}ms`,
    );
  }
  if (result.rendererSynchronousMaxMs > RENDERER_BLOCK_BUDGET_MS) {
    throw new Error(
      `${result.articleCount}-article renderer operation ${result.rendererSynchronousMaxMs.toFixed(2)}ms exceeds ${RENDERER_BLOCK_BUDGET_MS}ms`,
    );
  }
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  budgets: {
    warmQueryP95Ms: QUERY_P95_BUDGET_MS,
    filterUpdateP95Ms: FILTER_P95_BUDGET_MS,
    rendererSynchronousMaxMs: RENDERER_BLOCK_BUDGET_MS,
  },
  results,
};
const destination = path.resolve('dist/performance/search-benchmark.json');
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
