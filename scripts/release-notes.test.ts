import { describe, expect, it } from 'vitest';
import { formatReleaseNotesMarkdown, parseReleaseNotes } from './release-notes.mjs';

describe('release notes', () => {
  it('accepts comma, semicolon, newline, and pasted Markdown bullets', () => {
    expect(parseReleaseNotes('add language, fix search;\n- improve release notes')).toEqual([
      'add language',
      'fix search',
      'improve release notes',
    ]);
  });

  it('deduplicates entries and renders a Markdown feature list', () => {
    expect(
      formatReleaseNotesMarkdown({
        tag: 'v0.1.3',
        versionSource: 'auto-next-patch',
        raw: 'Add language, Add language, Fix menu',
      }),
    ).toContain("## What's changed\n\n- Add language\n- Fix menu");
  });

  it('rejects unbounded inputs', () => {
    expect(() => parseReleaseNotes(Array.from({ length: 21 }, (_, i) => `item ${i}`).join(','))).toThrow(
      /at most 20/,
    );
    expect(() => parseReleaseNotes('x'.repeat(201))).toThrow(/exceeds 200/);
  });
});
