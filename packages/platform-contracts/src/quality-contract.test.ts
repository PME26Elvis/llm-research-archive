import { describe, expect, it } from 'vitest';
import {
  ArchiveDiagnosticsSchema,
  DesktopCommandSchema,
  RendererDiagnosticRequestSchema,
  StartupTelemetrySchema,
} from './index';

describe('quality and diagnostics contracts', () => {
  it('accepts bounded startup telemetry and local diagnostic events', () => {
    const result = ArchiveDiagnosticsSchema.parse({
      validArticles: 4,
      warnings: [],
      invalidFiles: [],
      brokenLinks: [],
      missingAssets: [],
      startup: {
        milestones: { 'process-start': 0, 'app-ready': 22, interactive: 130 },
        interactiveMs: 130,
        previousMedianMs: 120,
        materialRegression: false,
      },
      events: [
        {
          timestamp: '2026-07-13T00:00:00.000Z',
          level: 'warning',
          area: 'workspace',
          code: 'workspace-recovered',
          message: '先前工作區無法使用，已回復內建封存',
        },
      ],
    });
    expect(result.startup.interactiveMs).toBe(130);
    expect(result.events).toHaveLength(1);
  });

  it('rejects raw payload-shaped diagnostic data', () => {
    expect(() =>
      RendererDiagnosticRequestSchema.parse({
        area: 'renderer',
        code: 'render-failed',
        message: 'x'.repeat(501),
        rawPayload: { markdown: 'secret body' },
      }),
    ).toThrow();
  });

  it('exposes the Observatory native command', () => {
    expect(DesktopCommandSchema.parse('observatory.open')).toBe('observatory.open');
  });

  it('requires nonnegative startup measurements', () => {
    expect(() =>
      StartupTelemetrySchema.parse({
        milestones: { 'process-start': -1 },
        materialRegression: false,
      }),
    ).toThrow();
  });
});
