import fs from 'node:fs';
import path from 'node:path';

export interface WindowBounds {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

export interface PersistedWindowState {
  schemaVersion: 1;
  bounds: WindowBounds;
  maximized: boolean;
}

export interface WorkArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_WINDOW_STATE: PersistedWindowState = {
  schemaVersion: 1,
  bounds: { width: 1280, height: 840 },
  maximized: false,
};

const MIN_WINDOW_WIDTH = 800;
const MIN_WINDOW_HEIGHT = 600;

function overlaps(bounds: Required<WindowBounds>, area: WorkArea): boolean {
  const visibleWidth = Math.min(bounds.x + bounds.width, area.x + area.width) - Math.max(bounds.x, area.x);
  const visibleHeight = Math.min(bounds.y + bounds.height, area.y + area.height) - Math.max(bounds.y, area.y);
  return visibleWidth >= 120 && visibleHeight >= 80;
}

export function normalizeWindowState(
  value: unknown,
  workAreas: WorkArea[],
): PersistedWindowState {
  const primary = workAreas[0] ?? { x: 0, y: 0, width: 1920, height: 1080 };
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const boundsValue = record.bounds;
  const raw = boundsValue && typeof boundsValue === 'object' ? (boundsValue as Record<string, unknown>) : {};
  const width = Math.min(primary.width, Math.max(MIN_WINDOW_WIDTH, Number(raw.width) || 1280));
  const height = Math.min(primary.height, Math.max(MIN_WINDOW_HEIGHT, Number(raw.height) || 840));
  const candidate: Required<WindowBounds> = {
    x: Number.isFinite(Number(raw.x)) ? Number(raw.x) : primary.x,
    y: Number.isFinite(Number(raw.y)) ? Number(raw.y) : primary.y,
    width: Math.round(width),
    height: Math.round(height),
  };
  const visible = workAreas.some((area) => overlaps(candidate, area));
  return {
    schemaVersion: 1,
    bounds: visible
      ? candidate
      : {
          x: primary.x + Math.max(0, Math.round((primary.width - candidate.width) / 2)),
          y: primary.y + Math.max(0, Math.round((primary.height - candidate.height) / 2)),
          width: candidate.width,
          height: candidate.height,
        },
    maximized: record.maximized === true,
  };
}

export function loadWindowState(filePath: string, workAreas: WorkArea[]): PersistedWindowState {
  try {
    return normalizeWindowState(JSON.parse(fs.readFileSync(filePath, 'utf8')), workAreas);
  } catch {
    return normalizeWindowState(DEFAULT_WINDOW_STATE, workAreas);
  }
}

export function saveWindowState(filePath: string, state: PersistedWindowState): void {
  const temporary = `${filePath}.tmp`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, filePath);
}
