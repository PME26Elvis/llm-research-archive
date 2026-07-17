import { expect, test } from './electron-test';

test('routes native commands through the typed preload channel and command palette', async ({
  launchElectron,
}) => {
  const { app, page } = await launchElectron();
  await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });

  const menuLabels = await app.evaluate(
    ({ Menu }) => Menu.getApplicationMenu()?.items.map((item) => item.label) ?? [],
  );
  expect(menuLabels).toEqual(expect.arrayContaining(['導覽', '檢視', '說明']));

  await page.keyboard.press('Control+K');
  const palette = page.getByRole('dialog', { name: '指令面板' });
  await expect(palette).toBeVisible();
  await page.getByLabel('搜尋指令').fill('搜尋');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('搜尋文章')).toBeFocused();

  await page.keyboard.press('Control+F');
  await expect(page.getByLabel('搜尋文章')).toBeFocused();

  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.send('app:command', 'about.open');
  });
  await expect(page.getByRole('dialog', { name: '關於 Research Observatory' })).toBeVisible();
  await page.getByRole('button', { name: '關閉' }).click();

  const articleButtons = page.getByTestId('article-list').getByRole('button');
  const firstTitle = await articleButtons
    .nth(0)
    .evaluate((button) => button.childNodes.item(0).textContent?.trim() ?? '');
  const secondTitle = await articleButtons
    .nth(1)
    .evaluate((button) => button.childNodes.item(0).textContent?.trim() ?? '');
  expect(firstTitle).not.toBe('');
  expect(secondTitle).not.toBe(firstTitle);
  await articleButtons.nth(0).click();
  await expect(page.locator('article header h2')).toHaveText(firstTitle);
  await articleButtons.nth(1).click();
  await expect(page.locator('article header h2')).toHaveText(secondTitle);
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.send('app:command', 'navigation.back');
  });
  await expect(page.locator('article header h2')).toHaveText(firstTitle);

  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.send('app:command', 'unknown.command');
  });
  await expect(page.getByRole('dialog', { name: '指令面板' })).toHaveCount(0);
});
