# 待上架文章暫存區

把尚未上架的 raw Markdown 放在這裡。單一待處理項目合併到 `main` 後，Content Maintenance 會自動呼叫 `python tools/publish_article.py`；Codex／維護者也可依 [`docs/article-publishing-workflow.md`](../../docs/article-publishing-workflow.md) 在本機先行發布與檢查。

## 預設：單檔模式

```text
_incoming/articles/my-new-report.md
```

本機預覽或手動發布：

```bash
python tools/publish_article.py
```

工具會建立正式文章、補 metadata、更新 root README 的可點擊文章目錄，並在全部成功後移除 raw input。

## 選用：資料夾模式

只有在需要保留 research activity、附件或圖片時使用：

```text
_incoming/articles/my-new-report/
  article.md
  research-activity.md
  assets/
```

- `article.md`：正式文章主文。
- `research-activity.md`：選用附件，放入文章結尾的「附件（展開）」區塊。
- `assets/`：選用圖片或其他文章資產。

## Actions 安全規則

Content Maintenance 每次只會自動發布 **一個** top-level incoming item：

- 0 個：不執行發布。
- 1 個：執行 transaction-safe publication；建立正式文章與 README catalog 後才移除 raw input。
- 2 個以上：明確失敗並保留所有 inputs，避免 category、slug 或 rollback 邊界變得模糊；請拆成個別提交或由 Codex／維護者逐一發布。
- metadata 無法可靠推論、目標已存在或 README catalog 無法更新：發布失敗，raw input 保留，不留下半成品。

## 後續自動維護

正式文章進入 `main/docs` 後，Content Maintenance 會自動：

1. 更新 root README generated article catalog。
2. 將 canonical `docs/` 套用到最新 `app-main` tree。
3. 執行完整 Desktop `npm run verify`。
4. 更新並保留 `automation/sync-main-content` branch。
5. 以 no-ff 一般 merge commit 推進 `app-main`；若期間出現其他更新，push 會安全失敗而不覆寫。

不要直接手動編輯 README generated article catalog，也不要把 `app-main/docs` 當成另一份文章來源。
