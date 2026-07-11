export const LAYOUT_PREFERENCES_KEY = 'research-observatory.layout.v1';
export const MIN_SIDEBAR_WIDTH = 240;
export const MAX_SIDEBAR_WIDTH = 620;
export const DEFAULT_SIDEBAR_WIDTH = 360;

export interface LayoutPreferences {
  schemaVersion: 1;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
}

export const DEFAULT_LAYOUT_PREFERENCES: LayoutPreferences = {
  schemaVersion: 1,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  sidebarCollapsed: false,
};

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function clampSidebarWidth(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SIDEBAR_WIDTH;
  return Math.round(Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, value)));
}

export function normalizeLayoutPreferences(value: unknown): LayoutPreferences {
  if (!value || typeof value !== 'object') return DEFAULT_LAYOUT_PREFERENCES;
  const record = value as Record<string, unknown>;
  return {
    schemaVersion: 1,
    sidebarWidth: clampSidebarWidth(Number(record.sidebarWidth)),
    sidebarCollapsed: record.sidebarCollapsed === true,
  };
}

export function loadLayoutPreferences(storage: StorageLike): LayoutPreferences {
  const raw = storage.getItem(LAYOUT_PREFERENCES_KEY);
  if (!raw) return DEFAULT_LAYOUT_PREFERENCES;
  try {
    return normalizeLayoutPreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_LAYOUT_PREFERENCES;
  }
}

export function saveLayoutPreferences(
  storage: StorageLike,
  preferences: LayoutPreferences,
): LayoutPreferences {
  const normalized = normalizeLayoutPreferences(preferences);
  storage.setItem(LAYOUT_PREFERENCES_KEY, JSON.stringify(normalized));
  return normalized;
}

export function adjustSidebarWidth(width: number, delta: number): number {
  return clampSidebarWidth(width + delta);
}
