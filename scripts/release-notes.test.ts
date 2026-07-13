import { describe, expect, it } from 'vitest';
import { parseReleaseHighlights, renderReleaseNotes } from './release-notes.mjs';

describe('release notes', () => {
  it('normalizes comma, full-width comma, semicolon, newline, and existing bullets', () => {
    expect(parseReleaseHighlights('add language, fix something；- fix another\n* Add language')).toEqual([
      'add language',
      'fix something',
      'fix another',
    ]);
  });

  it('renders release highlights as Markdown bullets with verified platform context', () => {
    const notes = renderReleaseNotes({
      tag: 'v0.1.3',
      versionSource: 'auto-next-patch',
      highlights: ['Add bilingual interface', 'Improve release notes'],
    });
    expect(notes).toContain('## Highlights\n- Add bilingual interface\n- Improve release notes');
    expect(notes).toContain('## Verified builds');
    expect(notes).toContain('macOS Apple Silicon and Intel');
  });

  it('rejects unbounded inputs and supplies a safe default', () => {
    expect(() => parseReleaseHighlights('x'.repeat(181))).toThrow(/180/);
    expect(renderReleaseNotes({ tag: 'v1.0.0' })).toContain('Verified maintenance release');
  });
});
