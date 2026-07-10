import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const alias = {
  '@research-observatory/platform-contracts': r('./packages/platform-contracts/src/index.ts'),
};
export default defineConfig({
  resolve: { alias },
  build: { sourcemap: true, rollupOptions: { external: ['electron'] } },
});
