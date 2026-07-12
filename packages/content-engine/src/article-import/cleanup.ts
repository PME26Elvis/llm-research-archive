import type { ImportCleanupSummary } from './contracts';

const citationMarkerPattern = /[ \t]*\uE200cite\uE202[^\uE201]*\uE201/gu;
const entityWrapperPattern = /\uE200entity\uE202([^\uE201]*)\uE201/gu;
const imageGroupPattern = /[ \t]*\uE200image_group\uE202[^\uE201]*\uE201/gu;
export const markdownImagePattern = /!\[([^\]]*)\]\(([^)\n]+)\)/gu;

function countMatches(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].length;
}

export function emptyCleanupSummary(): ImportCleanupSummary {
  return {
    citationMarkersRemoved: 0,
    entityWrappersUnwrapped: 0,
    imagePlaceholdersRemoved: 0,
    nonPortableImagesRemoved: 0,
  };
}

export function addCleanupSummaries(
  left: ImportCleanupSummary,
  right: ImportCleanupSummary,
): ImportCleanupSummary {
  return {
    citationMarkersRemoved: left.citationMarkersRemoved + right.citationMarkersRemoved,
    entityWrappersUnwrapped: left.entityWrappersUnwrapped + right.entityWrappersUnwrapped,
    imagePlaceholdersRemoved: left.imagePlaceholdersRemoved + right.imagePlaceholdersRemoved,
    nonPortableImagesRemoved: left.nonPortableImagesRemoved + right.nonPortableImagesRemoved,
  };
}

function entityVisibleText(payload: string): string {
  const trimmed = payload.trim();
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (
      Array.isArray(parsed) &&
      parsed.length >= 2 &&
      typeof parsed[1] === 'string' &&
      parsed[1].trim()
    ) {
      return parsed[1].trim();
    }
  } catch {
    // Older wrappers contain plain text rather than JSON.
  }
  return trimmed;
}

export function imageTarget(destination: string): string {
  return destination
    .trim()
    .replace(/^<|>$/g, '')
    .split(/\s+["']/u)[0];
}

function isNonPortableImageTarget(target: string): boolean {
  return (
    /^(?:sandbox:|attachment:|file:|blob:)/iu.test(target) || /^turn\d+image\d+$/iu.test(target)
  );
}

export function cleanImportMarkdown(markdown: string): {
  markdown: string;
  cleanup: ImportCleanupSummary;
} {
  const cleanup = emptyCleanupSummary();
  cleanup.citationMarkersRemoved = countMatches(markdown, citationMarkerPattern);
  cleanup.entityWrappersUnwrapped = countMatches(markdown, entityWrapperPattern);
  cleanup.imagePlaceholdersRemoved = countMatches(markdown, imageGroupPattern);

  let cleaned = markdown
    .replace(citationMarkerPattern, '')
    .replace(entityWrapperPattern, (_match, payload: string) => entityVisibleText(payload))
    .replace(imageGroupPattern, '');

  cleaned = cleaned.replace(
    markdownImagePattern,
    (full: string, alt: string, destination: string) => {
      if (!isNonPortableImageTarget(imageTarget(destination))) return full;
      cleanup.nonPortableImagesRemoved += 1;
      return alt.trim();
    },
  );

  return { markdown: cleaned, cleanup };
}
