import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'apps/desktop-electron/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 60_000,
  expect: {
    timeout: 30_000,
  },
  outputDir: 'test-results',
  preserveOutput: 'failures-only',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
});
