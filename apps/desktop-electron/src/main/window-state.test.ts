import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  loadWindowState,
  normalizeWindowState,
  saveWindowState,
  type PersistedWindowState,
} from './window-state';

const displays = [{ x: 0, y: 0, width: 1600, height: 900 }];

describe('window state', () => {
  it('clamps dimensions to minimums and the active work area', () => {
    expect(
      normalizeWindowState(
        { bounds: { x: 10, y: 20, width: 100, height: 4000 }, maximized: false },
        displays,
      ),
    ).toEqual({
      schemaVersion: 1,
      bounds: { x: 10, y: 20, width: 800, height: 900 },
      maximized: false,
    });
  });

  it('recenters an off-screen window on the primary display', () => {
    const normalized = normalizeWindowState(
      { bounds: { x: 5000, y: 5000, width: 1000, height: 700 }, maximized: true },
      displays,
    );
    expect(normalized.bounds).toEqual({ x: 300, y: 100, width: 1000, height: 700 });
    expect(normalized.maximized).toBe(true);
  });

  it('loads defaults from a missing or malformed file', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-window-state-'));
    const file = path.join(root, 'window-state.json');
    expect(loadWindowState(file, displays).bounds.width).toBe(1280);
    fs.writeFileSync(file, '{broken');
    expect(loadWindowState(file, displays).bounds.height).toBe(840);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('writes atomically and reloads the saved state', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-window-state-'));
    const file = path.join(root, 'nested', 'window-state.json');
    const state: PersistedWindowState = {
      schemaVersion: 1,
      bounds: { x: 40, y: 50, width: 900, height: 700 },
      maximized: false,
    };
    saveWindowState(file, state);
    expect(loadWindowState(file, displays)).toEqual(state);
    expect(fs.existsSync(`${file}.tmp`)).toBe(false);
    fs.rmSync(root, { recursive: true, force: true });
  });
});
