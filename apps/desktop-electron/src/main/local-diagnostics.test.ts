import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { LocalDiagnostics, redactDiagnosticText } from './local-diagnostics';

describe('LocalDiagnostics', () => {
  it('redacts secrets, absolute paths, and configured workspace roots', () => {
    const root = path.join(os.tmpdir(), 'private-workspace');
    const text = redactDiagnosticText(
      `failure at ${path.join(root, 'article.md')} token=super-secret authorization: Bearer abc`,
      [root],
    );
    expect(text).not.toContain(root);
    expect(text).not.toContain('super-secret');
    expect(text).not.toContain('Bearer abc');
    expect(text).toContain('[workspace]');
  });

  it('keeps a bounded atomic event history and supports clearing', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'local-diagnostics-'));
    const file = path.join(directory, 'events.json');
    const diagnostics = new LocalDiagnostics(file, 3, 4096);
    for (let index = 0; index < 5; index += 1) {
      diagnostics.record('error', 'main', `event-${index}`, `message ${index}`);
    }
    expect(diagnostics.recent().map((event) => event.code)).toEqual([
      'event-2',
      'event-3',
      'event-4',
    ]);
    expect(fs.statSync(file).mode & 0o777).toBe(0o600);
    diagnostics.clear();
    expect(diagnostics.recent()).toEqual([]);
    fs.rmSync(directory, { recursive: true, force: true });
  });
});
