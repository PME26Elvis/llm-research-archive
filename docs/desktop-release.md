# Desktop Release

Research Observatory Desktop 的程式碼與 reusable release pipeline 位於 [`app-main`](https://github.com/PME26Elvis/llm-research-archive/tree/app-main)。Default branch `main` 保留一個薄的手動 dispatcher，讓 GitHub Actions 的發布入口永遠可見。

完整 Desktop 入口請見 [`DESKTOP.md`](../DESKTOP.md)。

## 建立 draft release

1. 開啟 repository 的 **Actions**。
2. 選擇 **Desktop Release**。
3. 點選 **Run workflow**。
4. 建議第一次使用：
   - `target_ref`: `app-main`
   - `requested_version`: 留白，使用 target ref 的 `package.json` version
   - `channel`: `prerelease`
   - `publish`: `false`

Reusable workflow 會驗證 version、建立 Windows／Linux packages、執行 packaged smoke、驗證 release asset manifest，並建立 draft GitHub Release。

## 發布正式版本

先檢查 draft release、檔名、平台資產與 smoke 結果，再以相同 target ref 執行 `publish=true`。`stable` channel 應只用於準備公開的正式版本；一般開發驗證使用 `prerelease`。

Reusable implementation：[`app-main/.github/workflows/desktop-release-reusable.yml`](https://github.com/PME26Elvis/llm-research-archive/blob/app-main/.github/workflows/desktop-release-reusable.yml)。

## 文章內容來源

Desktop 打包的 `docs/` 不是獨立維護來源。正式文章只在 `main/docs` 編輯，Content Maintenance 會在 Desktop `npm run verify` 成功後，以一般 merge commit 同步到 `app-main`。
