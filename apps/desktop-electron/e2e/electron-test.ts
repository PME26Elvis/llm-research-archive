import {
  _electron as electron,
  expect,
  test as base,
  type ElectronApplication,
  type Page,
} from '@playwright/test';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);

interface LaunchElectronOptions {
  env?: Record<string, string>;
  cleanupPaths?: string[];
}

interface ElectronSession {
  app: ElectronApplication;
  page: Page;
}

interface SessionRecord {
  session: ElectronSession;
  cleanupPaths: string[];
  logs: string[];
}

interface ElectronFixtures {
  launchElectron(options?: LaunchElectronOptions): Promise<ElectronSession>;
}

export const test = base.extend<ElectronFixtures>({
  launchElectron: async ({}, use, testInfo) => {
    const sessions: SessionRecord[] = [];

    await use(async (options = {}) => {
      const app = await electron.launch({
        executablePath: require('electron'),
        args: ['.', '--no-sandbox'],
        env: { ...(process.env as Record<string, string>), ...(options.env ?? {}) },
      });

      try {
        const page = await app.firstWindow();
        const logs: string[] = [];
        const child = app.process();

        child.stdout?.on('data', (chunk) => {
          logs.push(`[main:stdout] ${String(chunk).trimEnd()}`);
        });
        child.stderr?.on('data', (chunk) => {
          logs.push(`[main:stderr] ${String(chunk).trimEnd()}`);
        });
        page.on('console', (message) => {
          logs.push(`[renderer:${message.type()}] ${message.text()}`);
        });
        page.on('pageerror', (error) => {
          logs.push(`[renderer:error] ${error.stack ?? error.message}`);
        });

        await app.context().tracing.start({
          screenshots: true,
          snapshots: true,
          sources: true,
        });

        const session = { app, page };
        sessions.push({
          session,
          cleanupPaths: options.cleanupPaths ?? [],
          logs,
        });
        return session;
      } catch (error) {
        await app.close().catch(() => undefined);
        throw error;
      }
    });

    const failed = testInfo.status !== testInfo.expectedStatus;

    for (const [index, record] of sessions.entries()) {
      const { app, page } = record.session;
      const label = sessions.length === 1 ? 'electron' : `electron-${index + 1}`;

      if (failed) {
        try {
          const screenshotPath = testInfo.outputPath(`${label}-failure.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          await testInfo.attach(`${label}-failure`, {
            path: screenshotPath,
            contentType: 'image/png',
          });
        } catch (error) {
          record.logs.push(`[diagnostics:screenshot] ${String(error)}`);
        }

        try {
          const tracePath = testInfo.outputPath(`${label}-trace.zip`);
          await app.context().tracing.stop({ path: tracePath });
          await testInfo.attach(`${label}-trace`, {
            path: tracePath,
            contentType: 'application/zip',
          });
        } catch (error) {
          record.logs.push(`[diagnostics:trace] ${String(error)}`);
        }

        const logPath = testInfo.outputPath(`${label}.log`);
        fs.writeFileSync(
          logPath,
          record.logs.length
            ? `${record.logs.join('\n')}\n`
            : 'No Electron console output was captured.\n',
        );
        await testInfo.attach(`${label}-log`, {
          path: logPath,
          contentType: 'text/plain',
        });
      } else {
        await app.context().tracing.stop().catch(() => undefined);
      }

      await app.close().catch(() => undefined);
      for (const cleanupPath of record.cleanupPaths) {
        fs.rmSync(cleanupPath, { recursive: true, force: true });
      }
    }
  },
});

export { expect };
