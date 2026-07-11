import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from './electron-test';

test('persists accessible pane sizing and native window bounds across restart', async ({
  launchElectron,
}) => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-layout-e2e-'));
  const args = [`--user-data-dir=${profile}`];
  const first = await launchElectron({ args, cleanupPaths: [profile] });
  await expect(first.page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });

  const separator = first.page.getByRole('separator', { name: '調整導覽欄寬度' });
  await expect(separator).toHaveAttribute('aria-valuenow', '360');
  await separator.focus();
  await first.page.keyboard.press('End');
  await expect(separator).toHaveAttribute('aria-valuenow', '620');
  await first.page.getByRole('button', { name: '隱藏導覽欄' }).click();
  await expect(first.page.getByTestId('app-ready')).toHaveAttribute(
    'data-sidebar-collapsed',
    'true',
  );

  await first.app.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0];
    window.unmaximize();
    window.setBounds({ x: 40, y: 40, width: 900, height: 650 });
  });
  await first.page.waitForTimeout(400);
  await first.app.close();

  const second = await launchElectron({ args });
  await expect(second.page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await expect(second.page.getByTestId('app-ready')).toHaveAttribute(
    'data-sidebar-collapsed',
    'true',
  );
  await second.page.getByRole('button', { name: '顯示導覽欄' }).click();
  await expect(second.page.getByRole('separator', { name: '調整導覽欄寬度' })).toHaveAttribute(
    'aria-valuenow',
    '620',
  );

  const bounds = await second.app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].getNormalBounds(),
  );
  expect(bounds.width).toBe(900);
  expect(bounds.height).toBe(650);
});
