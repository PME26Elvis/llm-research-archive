import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_RENDERER_IMPLEMENTATION,
  loadRendererImplementation,
  saveRendererImplementation,
} from './renderer-state';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function stateFile(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-renderer-state-'));
  roots.push(root);
  return path.join(root, 'renderer-state.json');
}

describe('renderer implementation state', () => {
  it('defaults to Astro and persists a classic selection', () => {
    const file = stateFile();
    expect(loadRendererImplementation(file, '')).toBe(DEFAULT_RENDERER_IMPLEMENTATION);
    saveRendererImplementation(file, 'classic');
    expect(loadRendererImplementation(file, '')).toBe('classic');
  });

  it('uses a validated environment override without corrupting persisted state', () => {
    const file = stateFile();
    saveRendererImplementation(file, 'classic');
    expect(loadRendererImplementation(file, 'astro')).toBe('astro');
    expect(loadRendererImplementation(file, 'invalid')).toBe('classic');
  });
});
