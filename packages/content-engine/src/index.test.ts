import { describe, it, expect } from 'vitest';
import { readingStats, createManifest, scanArchive } from './index';
describe('content engine', () => {
  it('counts cjk and latin without code', () => {
    expect(readingStats('你好 world `skip` ```code```').displayCount).toBe(3);
  });
  it('scans corpus deterministically', () => {
    const m = createManifest('docs');
    expect(m.schemaVersion).toBe(1);
    expect(m.articles.length).toBeGreaterThan(0);
    expect(scanArchive('docs')[0].id).toBeTruthy();
  });
});
