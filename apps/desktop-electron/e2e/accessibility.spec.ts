import { expect, test } from './electron-test';

test('keyboard users can reach reader and use the accessible Observatory summary', async ({
  launchElectron,
}) => {
  const { page } = await launchElectron();
  await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });

  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveText('跳至文章內容');
  await page.keyboard.press('Enter');
  await expect(page.locator(':focus')).toHaveAttribute('id', 'main-reader');

  const observatoryButton = page.getByRole('button', { name: 'Observatory' });
  await observatoryButton.focus();
  await observatoryButton.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Observatory 封存摘要' });
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('observatory-stats')).toContainText('文章數');
  await expect(dialog.getByRole('table')).toHaveCount(2);
  await expect(page.locator(':focus')).toHaveText('關閉');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveText('關閉');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(':focus')).toHaveText('Observatory');
});

test('desktop remains operable at 200 percent zoom and reduced motion', async ({
  launchElectron,
}) => {
  const { app, page } = await launchElectron();
  await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]?.webContents.setZoomFactor(2);
  });
  await expect(page.getByLabel('搜尋文章')).toBeVisible();
  await page.getByLabel('搜尋文章').fill('算力');
  await expect(page.getByTestId('article-list').getByRole('button').first()).toBeVisible();
  await page.getByTestId('article-list').getByRole('button').first().click();
  await expect(page.getByTestId('reader')).toBeVisible();
  await expect(
    page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
  ).resolves.not.toBe('smooth');
});

test('workspace diagnostics expose startup milestones and can be cleared without paths', async ({
  launchElectron,
}) => {
  const { page } = await launchElectron();
  await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  const diagnostics = page.getByTestId('workspace-diagnostics');
  await diagnostics.locator('summary').click();
  await expect(page.getByTestId('startup-telemetry')).toContainText('process-start');
  await expect(page.getByTestId('startup-telemetry')).toContainText('interactive');
  await diagnostics.getByRole('button', { name: '清除本機診斷' }).click();
  await expect(diagnostics).toContainText('尚無本機診斷事件');
});
