import { _electron as electron } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const candidates =
  process.platform === 'win32'
    ? ['out/Research Observatory-win32-x64/llm-research-archive-desktop.exe']
    : process.platform === 'darwin'
      ? [
          `out/Research Observatory-darwin-${process.arch}/Research Observatory.app/Contents/MacOS/llm-research-archive-desktop`,
          `out/Research Observatory-darwin-${process.arch}/Research Observatory.app/Contents/MacOS/Research Observatory`,
        ]
      : ['out/Research Observatory-linux-x64/llm-research-archive-desktop'];
const executable = candidates.find(fs.existsSync);
if (!executable) throw new Error(`packaged executable not found: ${candidates.join(', ')}`);
const args = process.platform === 'linux' ? ['--no-sandbox'] : [];
const app = await electron.launch({
  executablePath: path.resolve(executable),
  args,
});
try {
  const page = await app.firstWindow({ timeout: 30000 });
  await page.waitForSelector('[data-testid="app-ready"]', { timeout: 30000 });
  await page.waitForFunction(
    () =>
      Number(
        document.querySelector('[data-testid="app-ready"]')?.getAttribute('data-article-count'),
      ) > 0,
    undefined,
    { timeout: 30000 },
  );
  const count = Number(await page.getAttribute('[data-testid="app-ready"]', 'data-article-count'));
  const title = '科技業龍頭為何認為「現在算力遠遠不夠」：原因、證據與三大主題深度分析';
  await page.getByLabel('搜尋文章').fill('算力遠遠不夠');
  await page.getByRole('button', { name: new RegExp(title.slice(0, 12)) }).click();
  await page.waitForSelector('article header h2');
  const h2 = await page.locator('article header h2').innerText();
  if (h2 !== title) throw new Error(`unexpected reader title ${h2}`);
  if (await page.evaluate(() => Reflect.has(window, 'require') || Reflect.has(window, 'process'))) {
    throw new Error('renderer exposes Node globals');
  }
  await page.getByRole('button', { name: '關於' }).click();
  await page.waitForSelector('[role="dialog"]');
  const commit = await page.locator('[data-testid="about-commit"]').innerText();
  const version = await page.locator('[data-testid="about-version"]').innerText();
  const expectedVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  if (!commit || commit === 'local') throw new Error(`packaged About commit is invalid: ${commit}`);
  if (version !== expectedVersion) {
    throw new Error(`packaged About version ${version} does not match ${expectedVersion}`);
  }
  console.log(
    `packaged smoke ok: ${executable}; platform=${process.platform}; arch=${process.arch}; articles=${count}; title=${h2}; commit=${commit}`,
  );
} finally {
  await app.close();
}
