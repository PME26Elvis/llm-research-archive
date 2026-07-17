import fs from 'node:fs';
import {
  DeepResearchGuideSchema,
  GUIDE_RESEARCH_CUTOFF,
  GUIDE_VERSION,
  getDeepResearchGuide,
  getGuideDigest,
} from '@research-observatory/deep-research-guide';

const sourceRegisterPath = 'project-docs/research/deep-research-source-register.json';
const sourceRegister = JSON.parse(fs.readFileSync(sourceRegisterPath, 'utf8'));
if (sourceRegister.researchCutoff !== GUIDE_RESEARCH_CUTOFF) {
  throw new Error('source register research cutoff diverges from the canonical package');
}
const canonicalSources = getDeepResearchGuide('zh-TW').sources;
if (JSON.stringify(sourceRegister.sources) !== JSON.stringify(canonicalSources)) {
  throw new Error('source register diverges from the canonical package');
}
if (!sourceRegister.negativeFinding?.finding?.includes('No official source')) {
  throw new Error('source register does not preserve the DeepSeek negative finding');
}

const locales = ['zh-TW', 'en'];
const snapshots = locales.map((locale) => {
  const guide = DeepResearchGuideSchema.parse(getDeepResearchGuide(locale));
  const sourceIds = new Set(guide.sources.map((source) => source.id));
  for (const event of guide.timeline) {
    for (const sourceId of event.sourceIds) {
      if (!sourceIds.has(sourceId))
        throw new Error(`${locale} timeline source missing: ${sourceId}`);
    }
  }
  for (const provider of guide.providers) {
    for (const sourceId of provider.sourceIds) {
      if (!sourceIds.has(sourceId))
        throw new Error(`${locale} provider source missing: ${sourceId}`);
    }
  }
  if (!guide.sources.every((source) => source.url.startsWith('https://'))) {
    throw new Error(`${locale} guide contains a non-HTTPS source`);
  }
  if (!guide.negativeFinding.finding.toLocaleLowerCase().includes('deep research')) {
    throw new Error(`${locale} guide does not preserve the DeepSeek naming asymmetry`);
  }
  return {
    locale,
    digest: getGuideDigest(locale),
    sectionCount: guide.sections.length,
    providerCount: guide.providers.length,
    timelineCount: guide.timeline.length,
    sourceCount: guide.sources.length,
  };
});

const structuralKeys = ['sectionCount', 'providerCount', 'timelineCount', 'sourceCount'];
for (const key of structuralKeys) {
  if (snapshots[0][key] !== snapshots[1][key]) {
    throw new Error(`guide locale structural mismatch: ${key}`);
  }
}

const publicGuide = 'docs/about/deep-research/index.md';
if (!fs.existsSync(publicGuide))
  throw new Error(`public Deep Research guide missing: ${publicGuide}`);
const markdown = fs.readFileSync(publicGuide, 'utf8');
for (const marker of [
  `guide-version: ${GUIDE_VERSION}`,
  `research-cutoff: ${GUIDE_RESEARCH_CUTOFF}`,
  'DeepSeek Deep Research',
  'GOOGLE-2024-12-11-DEEP-RESEARCH',
  'OPENAI-2025-02-02-DEEP-RESEARCH',
]) {
  if (!markdown.includes(marker)) throw new Error(`public guide missing marker: ${marker}`);
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  guideVersion: GUIDE_VERSION,
  researchCutoff: GUIDE_RESEARCH_CUTOFF,
  snapshots,
  publicGuide,
  sourceRegisterPath,
};
fs.mkdirSync('dist/quality', { recursive: true });
fs.writeFileSync('dist/quality/deep-research-guide.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
