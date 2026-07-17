import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
export default defineConfig({
  resolve: {
    alias: {
      '@research-observatory/domain': r('./packages/domain/src/index.ts'),
      '@research-observatory/content-engine': r('./packages/content-engine/src/index.ts'),
      '@research-observatory/search-engine': r('./packages/search-engine/src/index.ts'),
      '@research-observatory/application': r('./packages/application/src/index.ts'),
      '@research-observatory/platform-contracts': r('./packages/platform-contracts/src/index.ts'),
      '@research-observatory/renderer-ui': r('./packages/renderer-ui/src/index.ts'),
    },
  },
  test: {
    include: [
      'packages/**/*.test.ts',
      'apps/**/*.test.ts',
      'apps/**/tests/**/*.spec.ts',
      'scripts/**/*.test.ts',
    ],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      all: true,
      include: [
        'packages/*/src/**/*.ts',
        'apps/desktop-electron/src/main/{asset-path,window-state,workspace-state,renderer-state,import-session,local-diagnostics,startup-telemetry}.ts',
        'apps/desktop-electron/src/renderer/{copy-code,desktop-commands,layout-preferences,mermaid-renderer,navigation-history,preferences,syntax-highlight}.ts',
      ],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/index.d.ts'],
    },
  },
});
