import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';

const root = (path) => fileURLToPath(new URL(`../../${path}`, import.meta.url));

export default defineConfig({
  output: 'static',
  build: {
    format: 'file',
    assets: '_astro',
  },
  integrations: [react()],
  markdown: { syntaxHighlight: false },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: app-asset:",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
      ],
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
      },
    },
  },
  vite: {
    resolve: {
      alias: {
        '@research-observatory/domain': root('packages/domain/src/index.ts'),
        '@research-observatory/content-engine': root('packages/content-engine/src/index.ts'),
        '@research-observatory/search-engine': root('packages/search-engine/src/index.ts'),
        '@research-observatory/application': root('packages/application/src/index.ts'),
        '@research-observatory/platform-contracts': root(
          'packages/platform-contracts/src/index.ts',
        ),
        '@research-observatory/renderer-ui': root('packages/renderer-ui/src/index.ts'),
      },
    },
    build: {
      sourcemap: false,
    },
  },
});
