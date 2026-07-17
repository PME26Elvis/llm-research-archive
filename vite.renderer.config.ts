import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
export default defineConfig({
  root: 'apps/desktop-electron/src/renderer',
  plugins: [react()],
  resolve: {
    alias: {
      '@research-observatory/renderer-ui': r('./packages/renderer-ui/src/index.ts'),
      '@research-observatory/deep-research-guide': r('./packages/deep-research-guide/src/index.ts'),
      '@research-observatory/domain': r('./packages/domain/src/index.ts'),
    },
  },
  build: { outDir: '../../../../.vite/renderer/main_window', emptyOutDir: true },
});
