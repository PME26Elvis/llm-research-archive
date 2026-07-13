const MAX_HIGHLIGHTS = 12;
const MAX_HIGHLIGHT_LENGTH = 180;

export function parseReleaseHighlights(raw = '') {
  const seen = new Set();
  const highlights = [];
  for (const part of String(raw).split(/[\n,，;；]+/)) {
    const cleaned = part
      .replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, '')
      .replace(/[\u0000-\u001f\u007f]+/g, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) continue;
    if (cleaned.length > MAX_HIGHLIGHT_LENGTH) {
      throw new Error(`release highlight exceeds ${MAX_HIGHLIGHT_LENGTH} characters`);
    }
    const key = cleaned.toLocaleLowerCase('en-US');
    if (seen.has(key)) continue;
    seen.add(key);
    highlights.push(cleaned);
    if (highlights.length > MAX_HIGHLIGHTS) {
      throw new Error(`release notes support at most ${MAX_HIGHLIGHTS} highlights`);
    }
  }
  return highlights;
}

export function renderReleaseNotes({ tag, highlights = [], versionSource = 'automatic' }) {
  const items = highlights.length
    ? highlights
    : ['Verified maintenance release for the current desktop baseline.'];
  return [
    `# Research Observatory ${tag}`,
    '',
    '## Highlights',
    ...items.map((item) => `- ${item}`),
    '',
    '## Verified builds',
    '- Windows x64 installer and portable ZIP',
    '- Linux x64 portable ZIP, DEB, and RPM',
    '- macOS Apple Silicon and Intel ZIPs',
    '- Checksums, release manifest, and CycloneDX SBOM',
    '',
    `Version selection: \`${versionSource}\`.`,
    '',
    '> macOS ZIPs are ad-hoc signed but not Apple-notarized; Gatekeeper may require an explicit Open action.',
    '',
  ].join('\n');
}

if (process.argv[1]?.endsWith('release-notes.mjs') && process.argv[2]) {
  const fs = await import('node:fs');
  const outputPath = process.argv[2];
  const tag = process.env.RELEASE_TAG;
  if (!tag) throw new Error('RELEASE_TAG is required');
  const highlights = parseReleaseHighlights(process.env.RELEASE_NOTES_INPUT);
  fs.writeFileSync(
    outputPath,
    renderReleaseNotes({
      tag,
      highlights,
      versionSource: process.env.RELEASE_VERSION_SOURCE || 'automatic',
    }),
  );
  console.log(`wrote release notes with ${highlights.length} highlight(s) to ${outputPath}`);
}
