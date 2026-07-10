import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const alias = {
  '@research-observatory/domain': r('./packages/domain/src/index.ts'),
  '@research-observatory/content-engine': r('./packages/content-engine/src/index.ts'),
  '@research-observatory/search-engine': r('./packages/search-engine/src/index.ts'),
  '@research-observatory/application': r('./packages/application/src/index.ts'),
  '@research-observatory/platform-contracts': r('./packages/platform-contracts/src/index.ts'),
};
function resolveCommit() {
  if (process.env.RELEASE_TARGET_COMMIT) return process.env.RELEASE_TARGET_COMMIT;
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'local';
  }
}
export default defineConfig({
  resolve: { alias },
  define: { __OBSERVATORY_BUILD_COMMIT__: JSON.stringify(resolveCommit()) },
  build: { sourcemap: true, rollupOptions: { external: ['electron'] } },
});
