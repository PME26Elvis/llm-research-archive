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
  const implementation = await page.getAttribute(
    '[data-testid="app-ready"]',
    'data-renderer-implementation',
  );
  if (implementation !== 'astro') {
    throw new Error(`packaged default renderer is ${implementation}; expected astro`);
  }
  if ((await page.locator('[data-astro-entry="research-observatory"]').count()) !== 1) {
    throw new Error('packaged Astro entry marker is missing');
  }
  const guideContract = page.locator('[data-testid="deep-research-guide-contract"]');
  if ((await guideContract.getAttribute('data-guide-version')) !== '1.0.0') {
    throw new Error('packaged Deep Research Guide version is invalid');
  }
  if ((await guideContract.getAttribute('data-guide-provider-count')) !== '5') {
    throw new Error('packaged Deep Research Guide provider contract is invalid');
  }
  if ((await guideContract.getAttribute('data-guide-timeline-count')) !== '15') {
    throw new Error('packaged Deep Research Guide timeline contract is invalid');
  }
  if ((await guideContract.getAttribute('data-guide-source-count')) !== '15') {
    throw new Error('packaged Deep Research Guide source contract is invalid');
  }
  const astroGuideDigest = await guideContract.getAttribute('data-guide-digest');
  if (!/^drg1-[a-f0-9]{8}$/.test(astroGuideDigest ?? '')) {
    throw new Error(`packaged Deep Research Guide digest is invalid: ${astroGuideDigest}`);
  }
  await page.getByTestId('open-deep-research-guide').click();
  await page.waitForSelector('[data-astro-guide]:not([hidden])', { timeout: 30000 });
  await page.waitForSelector(
    '[data-astro-guide]:not([hidden]) [data-guide-section="guide.timeline"]',
    { timeout: 30000 },
  );
  await page.getByRole('button', { name: '關閉說明' }).click();
  await page.getByRole('button', { name: /Classic/ }).click();
  await page.waitForSelector('[data-testid="app-ready"][data-renderer-implementation="classic"]', {
    timeout: 30000,
  });
  if (
    (await page.getByTestId('deep-research-guide-contract').getAttribute('data-guide-digest')) !==
    astroGuideDigest
  ) {
    throw new Error('Astro and Classic Deep Research Guide digests differ');
  }
  await page.getByTestId('open-deep-research-guide').click();
  await page.waitForSelector('[data-testid="classic-deep-research-guide"]', { timeout: 30000 });
  if (
    (await page
      .getByTestId('classic-deep-research-guide')
      .getAttribute('data-guide-source-count')) !== '15'
  ) {
    throw new Error('packaged Classic Deep Research Guide source contract is invalid');
  }
  await page.getByRole('button', { name: '關閉說明' }).click();
  await page.getByRole('button', { name: /Astro/ }).click();
  await page.waitForSelector('[data-testid="app-ready"][data-renderer-implementation="astro"]', {
    timeout: 30000,
  });
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
  await page
    .getByTestId('navigation-pane')
    .getByRole('button', { name: '關於', exact: true })
    .click();
  await page
    .getByRole('dialog', { name: /關於 Research Observatory/ })
    .waitFor({ state: 'visible', timeout: 30000 });
  const commit = await page.locator('[data-testid="about-commit"]').innerText();
  const version = await page.locator('[data-testid="about-version"]').innerText();
  const expectedVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  if (!commit || commit === 'local') throw new Error(`packaged About commit is invalid: ${commit}`);
  if (version !== expectedVersion) {
    throw new Error(`packaged About version ${version} does not match ${expectedVersion}`);
  }
  console.log(
    `packaged smoke ok: ${executable}; platform=${process.platform}; arch=${process.arch}; articles=${count}; renderer=astro+classic; title=${h2}; commit=${commit}`,
  );
} finally {
  await app.close();
}
