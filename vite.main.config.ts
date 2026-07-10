import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const alias = { '@research-observatory/domain': r('./packages/domain/src/index.ts'), '@research-observatory/content-engine': r('./packages/content-engine/src/index.ts'), '@research-observatory/search-engine': r('./packages/search-engine/src/index.ts'), '@research-observatory/application': r('./packages/application/src/index.ts'), '@research-observatory/platform-contracts': r('./packages/platform-contracts/src/index.ts') };
export default defineConfig({ resolve: { alias }, build: { sourcemap: true, rollupOptions: { external: ['electron'] } } });
