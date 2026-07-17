import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from './electron-test';

test('renders one canonical Deep Research Guide in Astro and Classic', async ({
  launchElectron,
}) => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-guide-profile-'));
  const { app, page } = await launchElectron({
    args: [`--user-data-dir=${profile}`],
    cleanupPaths: [profile],
  });
  await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('guide-intro-card')).toBeVisible();
  await page.getByRole('button', { name: '稍後再看' }).click();
  await expect(page.getByTestId('guide-intro-card')).toBeHidden();
  await page.reload();
  await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('guide-intro-card')).toBeHidden();

  const firstArticle = page.getByTestId('article-list').getByRole('button').first();
  const firstTitle = await firstArticle.evaluate(
    (button) => button.childNodes.item(0).textContent?.trim() ?? '',
  );
  await firstArticle.click();
  await expect(page.locator('article header h2')).toHaveText(firstTitle);

  const contract = page.getByTestId('deep-research-guide-contract');
  await expect(contract).toHaveAttribute('data-guide-version', '1.0.0');
  await expect(contract).toHaveAttribute('data-guide-provider-count', '5');
  await expect(contract).toHaveAttribute('data-guide-timeline-count', '15');
  await expect(contract).toHaveAttribute('data-guide-source-count', '15');
  const astroDigest = await contract.getAttribute('data-guide-digest');
  expect(astroDigest).toMatch(/^drg1-[a-f0-9]{8}$/);

  const guideButton = page.getByTestId('open-deep-research-guide');
  await guideButton.click();
  const astroGuide = page.locator('[data-astro-guide]');
  await expect(astroGuide).toBeVisible();
  await expect(astroGuide.locator('[data-guide-locale="zh-TW"] h1')).toHaveText(
    'Deep Research 是什麼？',
  );
  await expect(astroGuide).toContainText('2024–2026 產品演進');
  await expect(astroGuide).toContainText('不得自行創造產品名稱');
  await expect(astroGuide.locator('a[data-guide-external]').first()).toHaveAttribute(
    'href',
    /^https:\/\//,
  );
  await astroGuide.getByRole('button', { name: '關閉說明' }).click();
  await expect(astroGuide).toBeHidden();
  await expect(guideButton).toBeFocused();
  await expect(page.locator('article header h2')).toHaveText(firstTitle);

  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.send('app:command', 'guide.archive');
  });
  await expect(astroGuide).toBeVisible();
  const astroArchiveSection = astroGuide.locator(
    '[data-guide-locale="zh-TW"] [data-guide-section="guide.archive"]',
  );
  await expect(astroArchiveSection).toBeVisible();
  await expect(astroArchiveSection).toBeInViewport();
  await astroGuide.getByRole('button', { name: '關閉說明' }).click();

  const articleGuideButton = page.getByRole('button', { name: '關於 Deep Research 類報告' });
  await articleGuideButton.click();
  await expect(astroGuide).toBeVisible();
  await astroGuide.getByRole('button', { name: '關閉說明' }).click();
  await expect(articleGuideButton).toBeFocused();

  await page.getByRole('button', { name: /Classic/ }).click();
  await expect(page.getByTestId('app-ready')).toHaveAttribute(
    'data-renderer-implementation',
    'classic',
    { timeout: 30000 },
  );
  const classicContract = page.getByTestId('deep-research-guide-contract');
  await expect(classicContract).toHaveAttribute('data-guide-digest', astroDigest ?? '');

  await page.getByRole('button', { name: '設定' }).click();
  await page.getByLabel('English').check();
  await page.getByRole('button', { name: 'Close settings' }).click();
  const classicFirstArticle = page.getByTestId('article-list').getByRole('button').first();
  await classicFirstArticle.click();
  const classicContextButton = page.getByRole('button', {
    name: 'About Deep Research-class reports',
  });
  await classicContextButton.click();
  const classicGuide = page.getByTestId('classic-deep-research-guide');
  await expect(classicGuide).toBeVisible();
  await expect(classicGuide.getByRole('heading', { name: 'What is Deep Research?' })).toBeVisible();
  await expect(classicGuide).toContainText('Gemini launches Deep Research');
  await expect(classicGuide).toContainText('never invent a product name');
  await expect(classicGuide).toHaveAttribute('data-guide-provider-count', '5');
  await expect(classicGuide).toHaveAttribute('data-guide-timeline-count', '15');
  await expect(classicGuide).toHaveAttribute('data-guide-source-count', '15');
  await classicGuide.getByRole('button', { name: 'Close guide' }).click();
  await expect(classicContextButton).toBeFocused();
});
