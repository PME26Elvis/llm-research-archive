import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from './electron-test';

test('ships Astro by default and persists the retained Classic entry across restart', async ({
  launchElectron,
}) => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-renderer-profile-'));
  const args = [`--user-data-dir=${profile}`];
  const env = { OBSERVATORY_RENDERER: '' };

  const first = await launchElectron({ args, env });
  const firstApp = first.page.getByTestId('app-ready');

  await expect(firstApp).toBeVisible({ timeout: 30000 });
  await expect(firstApp).toHaveAttribute('data-renderer-implementation', 'astro');
  await expect(first.page.locator('[data-astro-entry="research-observatory"]')).toHaveCount(1);
  await expect(first.page.getByTestId('renderer-implementation')).toContainText('Astro');

  await first.page.getByRole('button', { name: /Classic/ }).click();
  await expect(firstApp).toHaveAttribute('data-renderer-implementation', 'classic', {
    timeout: 30000,
  });
  await expect(first.page.locator('[data-astro-entry="research-observatory"]')).toHaveCount(0);
  await expect(first.page.getByTestId('renderer-implementation')).toContainText('Classic');
  await first.app.close();

  const second = await launchElectron({ args, env, cleanupPaths: [profile] });
  const secondApp = second.page.getByTestId('app-ready');
  await expect(secondApp).toBeVisible({ timeout: 30000 });
  await expect(secondApp).toHaveAttribute('data-renderer-implementation', 'classic');
  await expect(second.page.locator('[data-astro-entry="research-observatory"]')).toHaveCount(0);

  await second.page.getByRole('button', { name: /Astro/ }).click();
  await expect(secondApp).toHaveAttribute('data-renderer-implementation', 'astro', {
    timeout: 30000,
  });
  await expect(second.page.locator('[data-astro-entry="research-observatory"]')).toHaveCount(1);
});
