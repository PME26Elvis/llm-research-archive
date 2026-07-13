import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ElectronApplication, Locator, Page } from '@playwright/test';
import { expect, test } from './electron-test';

function createWorkspaceFixture(title: string) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-import-profile-'));
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-import-workspace-'));
  const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-import-source-'));
  const baseline = path.join(workspace, 'baseline', 'existing');
  const source = path.join(sourceRoot, 'article.md');
  fs.mkdirSync(baseline, { recursive: true });
  fs.writeFileSync(
    path.join(baseline, 'index.md'),
    '---\ndate: 2026-07-01\ntags: [baseline]\n---\n# Existing Workspace Article\n\nBaseline body.\n',
  );
  fs.writeFileSync(source, `# ${title}\n\nLLM GPU benchmark content.\n`);
  return { profile, workspace, sourceRoot, source };
}

async function chooseMarkdownSource(
  app: ElectronApplication,
  page: Page,
  source: string,
): Promise<Locator> {
  await app.evaluate(({ dialog }, selectedPath) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: [selectedPath],
    });
  }, source);
  await page.keyboard.press('Control+Shift+I');
  const dialog = page.getByRole('dialog', { name: '匯入文章' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /選擇 Markdown 檔案/ }).click();
  await expect(dialog.getByLabel('標題')).toBeVisible();
  return dialog;
}

test('previews, edits, commits, retains, navigates, and reloads an imported article', async ({
  launchElectron,
}) => {
  const fixture = createWorkspaceFixture('Desktop Imported Article');
  const args = [`--user-data-dir=${fixture.profile}`];
  const env = { ARCHIVE_CONTENT_ROOT: fixture.workspace };
  const first = await launchElectron({
    args,
    env,
    cleanupPaths: [fixture.profile, fixture.workspace, fixture.sourceRoot],
  });
  await expect(first.page.getByTestId('app-ready')).toBeVisible({
    timeout: 30000,
  });

  const dialog = await chooseMarkdownSource(first.app, first.page, fixture.source);
  await expect(dialog.getByTestId('import-target-path')).toHaveText(
    'llm/desktop-imported-article/index.md',
  );
  await dialog.getByLabel('slug').fill('desktop-import-e2e');
  await dialog.getByRole('button', { name: '更新並重新驗證預覽' }).click();
  await expect(dialog.getByTestId('import-target-path')).toHaveText(
    'llm/desktop-import-e2e/index.md',
  );
  await dialog.getByTestId('commit-import').click();

  await expect(first.page.getByRole('dialog', { name: '匯入文章' })).toBeHidden();
  await expect(
    first.page
      .getByTestId('reader')
      .getByRole('heading', { name: 'Desktop Imported Article', level: 1 }),
  ).toBeVisible();
  expect(fs.existsSync(fixture.source)).toBe(true);
  expect(fs.existsSync(path.join(fixture.workspace, 'llm', 'desktop-import-e2e', 'index.md'))).toBe(
    true,
  );
  await first.app.close();

  const second = await launchElectron({ args, env });
  await expect(second.page.getByTestId('app-ready')).toBeVisible({
    timeout: 30000,
  });
  await expect(second.page.getByRole('button', { name: /Desktop Imported Article/ })).toBeVisible();
});

test('rejects a late target conflict without partial output or source deletion', async ({
  launchElectron,
}) => {
  const fixture = createWorkspaceFixture('Late Conflict Article');
  const session = await launchElectron({
    env: { ARCHIVE_CONTENT_ROOT: fixture.workspace },
    cleanupPaths: [fixture.profile, fixture.workspace, fixture.sourceRoot],
    args: [`--user-data-dir=${fixture.profile}`],
  });
  await expect(session.page.getByTestId('app-ready')).toBeVisible({
    timeout: 30000,
  });

  const dialog = await chooseMarkdownSource(session.app, session.page, fixture.source);
  const target = path.join(fixture.workspace, 'llm', 'late-conflict-article');
  fs.mkdirSync(target, { recursive: true });
  const sentinel = path.join(target, 'keep.txt');
  fs.writeFileSync(sentinel, 'keep');

  await dialog.getByTestId('commit-import').click();
  await expect(dialog.getByRole('alert')).toContainText('目標文章已存在');
  expect(fs.readFileSync(sentinel, 'utf8')).toBe('keep');
  expect(fs.existsSync(fixture.source)).toBe(true);
  expect(fs.existsSync(path.join(target, 'index.md'))).toBe(false);
  const categoryEntries = fs.readdirSync(path.dirname(target));
  expect(categoryEntries.some((entry) => entry.includes('.import-'))).toBe(false);
  expect(categoryEntries.some((entry) => entry.endsWith('.import.lock'))).toBe(false);
});

test('removes the source only after explicit successful confirmation', async ({
  launchElectron,
}) => {
  const fixture = createWorkspaceFixture('Disposable Source Article');
  const session = await launchElectron({
    env: { ARCHIVE_CONTENT_ROOT: fixture.workspace },
    cleanupPaths: [fixture.profile, fixture.workspace, fixture.sourceRoot],
    args: [`--user-data-dir=${fixture.profile}`],
  });
  await expect(session.page.getByTestId('app-ready')).toBeVisible({
    timeout: 30000,
  });

  const dialog = await chooseMarkdownSource(session.app, session.page, fixture.source);
  await dialog.getByLabel('匯入成功且再次驗證後，刪除原始來源').check();
  await dialog.getByTestId('commit-import').click();

  await expect(session.page.getByRole('dialog', { name: '匯入文章' })).toBeHidden();
  expect(fs.existsSync(fixture.source)).toBe(false);
  expect(
    fs.existsSync(path.join(fixture.workspace, 'llm', 'disposable-source-article', 'index.md')),
  ).toBe(true);
});
