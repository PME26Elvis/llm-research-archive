const MAX_ITEMS = 20;
const MAX_ITEM_LENGTH = 200;
const MAX_TOTAL_LENGTH = 2400;

export function parseReleaseNotes(raw = '') {
  if (typeof raw !== 'string') throw new TypeError('release notes input must be a string');
  if (raw.length > MAX_TOTAL_LENGTH) {
    throw new Error(`release notes input exceeds ${MAX_TOTAL_LENGTH} characters`);
  }
  const items = raw
    .split(/[\n,;]+/)
    .map((item) => item.trim().replace(/^[-*+]\s+/, ''))
    .filter(Boolean);
  if (items.length > MAX_ITEMS) throw new Error(`release notes may contain at most ${MAX_ITEMS} items`);
  for (const item of items) {
    if (item.length > MAX_ITEM_LENGTH) {
      throw new Error(`release note item exceeds ${MAX_ITEM_LENGTH} characters: ${item.slice(0, 40)}`);
    }
  }
  return [...new Set(items)];
}

export function formatReleaseNotesMarkdown({ tag, versionSource, raw = '' }) {
  const items = parseReleaseNotes(raw);
  const lines = [`Desktop release ${tag} (${versionSource}).`];
  if (items.length) {
    lines.push('', "## What's changed", '', ...items.map((item) => `- ${item}`));
  }
  lines.push(
    '',
    '## Verification',
    '',
    '- Full quality gate',
    '- Windows x64 packaged smoke',
    '- Linux x64 packaged smoke',
    '- macOS Apple Silicon packaged smoke',
    '- macOS Intel packaged smoke',
    '- Exact release asset verification',
  );
  return `${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const output = process.argv[2];
  if (!output) throw new Error('usage: node scripts/release-notes.mjs <output-file>');
  const { writeFileSync } = await import('node:fs');
  writeFileSync(
    output,
    formatReleaseNotesMarkdown({
      tag: process.env.RELEASE_TAG || 'unversioned',
      versionSource: process.env.RELEASE_VERSION_SOURCE || 'unknown',
      raw: process.env.RELEASE_NOTES || '',
    }),
  );
}
