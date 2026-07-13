import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

export const startupMilestones = [
  'process-start',
  'app-ready',
  'archive-ready',
  'window-created',
  'renderer-ready',
  'interactive',
] as const;
export type StartupMilestone = (typeof startupMilestones)[number];

export interface StartupTelemetrySummary {
  milestones: Partial<Record<StartupMilestone, number>>;
  interactiveMs?: number;
  previousMedianMs?: number;
  materialRegression: boolean;
}

interface StartupHistoryV1 {
  schemaVersion: 1;
  runs: { completedAt: string; interactiveMs: number }[];
}

function median(values: readonly number[]): number | undefined {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export class StartupTelemetry {
  private readonly milestones: Partial<Record<StartupMilestone, number>> = { 'process-start': 0 };
  private historyFile = '';
  private persisted = false;

  constructor(
    private readonly startedAt = performance.now(),
    private readonly now: () => number = () => performance.now(),
  ) {}

  attachHistoryFile(filePath: string): void {
    this.historyFile = filePath;
  }

  mark(milestone: StartupMilestone): StartupTelemetrySummary {
    if (this.milestones[milestone] === undefined) {
      this.milestones[milestone] = Math.max(0, this.now() - this.startedAt);
    }
    if (milestone === 'interactive') this.persist();
    return this.summary();
  }

  summary(): StartupTelemetrySummary {
    const interactiveMs = this.milestones.interactive;
    const previousMedianMs = median(this.readHistory().runs.map((run) => run.interactiveMs));
    return {
      milestones: { ...this.milestones },
      ...(interactiveMs === undefined ? {} : { interactiveMs }),
      ...(previousMedianMs === undefined ? {} : { previousMedianMs }),
      materialRegression: Boolean(
        interactiveMs !== undefined &&
        previousMedianMs !== undefined &&
        interactiveMs - previousMedianMs >= 250 &&
        interactiveMs >= previousMedianMs * 1.25,
      ),
    };
  }

  private persist(): void {
    if (this.persisted || !this.historyFile || this.milestones.interactive === undefined) return;
    const history = this.readHistory();
    history.runs.push({
      completedAt: new Date().toISOString(),
      interactiveMs: this.milestones.interactive,
    });
    history.runs = history.runs.slice(-20);
    fs.mkdirSync(path.dirname(this.historyFile), { recursive: true });
    const temporary = `${this.historyFile}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(history, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(temporary, this.historyFile);
    this.persisted = true;
  }

  private readHistory(): StartupHistoryV1 {
    if (!this.historyFile) return { schemaVersion: 1, runs: [] };
    try {
      const value = JSON.parse(
        fs.readFileSync(this.historyFile, 'utf8'),
      ) as Partial<StartupHistoryV1>;
      if (value.schemaVersion !== 1 || !Array.isArray(value.runs)) throw new Error('invalid');
      return {
        schemaVersion: 1,
        runs: value.runs
          .filter((run): run is { completedAt: string; interactiveMs: number } =>
            Boolean(
              run &&
              typeof run.completedAt === 'string' &&
              Number.isFinite(run.interactiveMs) &&
              run.interactiveMs >= 0,
            ),
          )
          .slice(-20),
      };
    } catch {
      return { schemaVersion: 1, runs: [] };
    }
  }
}
