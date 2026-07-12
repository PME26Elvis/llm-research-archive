# Desktop Release

Research Observatory Desktop 的程式碼與 reusable release pipeline 位於 [`app-main`](https://github.com/PME26Elvis/llm-research-archive/tree/app-main)。Default branch `main` 保留一個薄的手動 dispatcher，讓 GitHub Actions 的發布入口永遠可見。

完整 Desktop 入口請見 [`DESKTOP.md`](https://github.com/PME26Elvis/llm-research-archive/blob/main/DESKTOP.md)。

## 最安全的預設執行方式

1. 開啟 repository 的 **Actions**。
2. 選擇 **Desktop Release**。
3. 點選 **Run workflow**。
4. 保留預設值：
   - `target_ref`: `app-main`
   - `requested_version`: 留白
   - `channel`: `prerelease`
   - `publish`: `false`

這組設定會建立經完整驗證的 **draft release**，不會立刻公開發布。

## 版本與 tag 不需要手動填寫

Workflow 沒有獨立的 tag 欄位。Tag 由最終版本自動產生，格式為 `v<version>`。

當 `requested_version` 留白時，preflight 會同時掃描：

- `target_ref` 的 `package.json` version
- repository 中既有的 `v*` Git tags
- draft GitHub Releases
- 已發布的 GitHub Releases

選擇規則：

1. `package.json` version 尚未使用時，直接採用該版本。
2. 該版本已存在，或已有更高版本時，從目前最高版本自動進位一個 patch。
3. 選出的版本會真正套用到暫時性的 build workspace，讓 About 視窗、Forge package metadata、檔名、manifest、SBOM 與 GitHub tag 完全一致。

例如：

| 目前狀態 | 留白時自動選擇 |
| --- | --- |
| `package.json = 0.1.0`，沒有既有版本 | `0.1.0` → tag `v0.1.0` |
| 已存在 `v0.1.0` | `0.1.1` → tag `v0.1.1` |
| 最高既有版本為 `v0.3.7` | `0.3.8` → tag `v0.3.8` |

需要固定版本時仍可填入精確 SemVer，例如 `0.4.0`。如果該版本已經被 Git tag、draft release 或 published release 使用，workflow 會在 preflight 以明確訊息拒絕，而不會做到封裝後才發現碰撞。

## 驗證與輸出平台

Reusable workflow 會先執行完整的 `npm run verify`，再分別在原生 runner 建立並啟動實際封裝結果：

| 平台 | 輸出 |
| --- | --- |
| Windows x64 | Setup EXE、portable ZIP |
| Linux x64 | portable ZIP、DEB、RPM |
| macOS Apple Silicon | arm64 ZIP |
| macOS Intel | x64 ZIP |

每個平台都必須通過 packaged smoke。之後 aggregate job 才會建立：

- `SHA256SUMS.txt`
- `release-manifest.json`
- CycloneDX `sbom.cdx.json`

GitHub Release 上傳後還會驗證資產數量、檔名、大小、重複檔案與 target commit。

> macOS ZIP 使用 ad-hoc signing，但目前沒有 Apple Developer 憑證與 notarization。第一次開啟時，Gatekeeper 可能要求使用者在 Finder 右鍵選擇 **Open**，或到系統設定允許開啟。

## Draft 與正式發布

- `publish=false`：建立 draft，適合先檢查檔名、manifest、checksums 與各平台資產。
- `publish=true`：所有驗證通過後才把該 release 轉為公開狀態。
- `channel=prerelease`：公開時標記為 prerelease。
- `channel=stable`：公開時作為正式穩定版；不接受帶 prerelease suffix 的版本。

建議流程是先用全部預設值取得 draft，確認後再以相同 `target_ref` 執行公開發布。由於留白版本會避開已存在版本，第二次執行預設參數時會選擇下一個 patch，而不是重撞舊 tag。

Reusable implementation：[`app-main/.github/workflows/desktop-release-reusable.yml`](https://github.com/PME26Elvis/llm-research-archive/blob/app-main/.github/workflows/desktop-release-reusable.yml)。

## 文章內容來源

Desktop 打包的 `docs/` 不是獨立維護來源。正式文章只在 `main/docs` 編輯，Content Maintenance 會在 Desktop `npm run verify` 成功後，以一般 merge commit 同步到 `app-main`。
