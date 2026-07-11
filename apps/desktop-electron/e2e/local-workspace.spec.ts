import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from './electron-test';

function writeArticle(root: string, title: string) {
  const dir = path.join(root, 'local', 'article');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'index.md'),
    `---\ndate: 2026-07-11\ntags: [local-workspace]\n---\n# ${title}\n\nLocal workspace body.\n`,
  );
}

test('selects, persists, diagnoses, and safely falls back from a local workspace', async ({
  launchElectron,
}) => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-workspace-profile-'));
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-local-workspace-'));
  writeArticle(workspace, 'Local Workspace Article');
  const broken = path.join(workspace, 'broken');
  fs.mkdirSync(broken);
  fs.writeFileSync(path.join(broken, 'index.md'), '---\ndate: [invalid\n---\n# Broken');
  const args = [`--user-data-dir=${profile}`];

  const first = await launchElectron({ args, cleanupPaths: [profile, workspace] });
  await expect(first.page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  const bundledCount = Number(
    await first.page.getByTestId('app-ready').getAttribute('data-article-count'),
  );
  expect(bundledCount).toBeGreaterThan(1);

  await first.app.evaluate(
    ({ dialog }, selectedPath) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [selectedPath] });
    },
    workspace,
  );
  await first.page.keyboard.press('Control+O');
  await expect(first.page.getByTestId('workspace-kind')).toHaveText('本機工作區');
  await expect(first.page.getByTestId('workspace-path')).toContainText(path.basename(workspace));
  await expect(first.page.getByTestId('app-ready')).toHaveAttribute('data-article-count', '1');
  await expect(first.page.getByRole('button', { name: /Local Workspace Article/ })).toBeVisible();
  await expect(first.page.getByTestId('workspace-diagnostics')).toContainText('broken/index.md');
  await first.app.close();

  const second = await launchElectron({ args });
  await expect(second.page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await expect(second.page.getByTestId('workspace-kind')).toHaveText('本機工作區');
  await expect(second.page.getByRole('button', { name: /Local Workspace Article/ })).toBeVisible();
  await second.app.close();

  fs.rmSync(workspace, { recursive: true, force: true });
  const third = await launchElectron({ args });
  await expect(third.page.getByTestId('app-ready')).toBeVisible({ timeout: 30000 });
  await expect(third.page.getByTestId('workspace-kind')).toHaveText('內建封存');
  await expect(third.page.getByTestId('workspace-diagnostics')).toContainText('已回復內建封存');
  const restoredCount = Number(
    await third.page.getByTestId('app-ready').getAttribute('data-article-count'),
  );
  expect(restoredCount).toBe(bundledCount);
});
