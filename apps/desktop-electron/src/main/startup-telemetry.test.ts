import { expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { StartupTelemetry } from './startup-telemetry';

it('records ordered startup milestones and flags material regression against bounded history', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'startup-telemetry-'));
  const file = path.join(directory, 'startup.json');
  fs.writeFileSync(
    file,
    JSON.stringify({
      schemaVersion: 1,
      runs: Array.from({ length: 5 }, (_, index) => ({
        completedAt: `2026-01-0${index + 1}T00:00:00.000Z`,
        interactiveMs: 1000,
      })),
    }),
  );
  let current = 0;
  const telemetry = new StartupTelemetry(0, () => current);
  telemetry.attachHistoryFile(file);
  current = 100;
  telemetry.mark('app-ready');
  current = 1300;
  const summary = telemetry.mark('interactive');
  expect(summary.milestones['app-ready']).toBe(100);
  expect(summary.interactiveMs).toBe(1300);
  expect(summary.previousMedianMs).toBe(1000);
  expect(summary.materialRegression).toBe(true);
  expect(JSON.parse(fs.readFileSync(file, 'utf8')).runs).toHaveLength(6);
  fs.rmSync(directory, { recursive: true, force: true });
});
