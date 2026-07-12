# 待上架文章暫存區

把尚未上架的 raw Markdown 放在這裡。Codex／維護者應依 [`docs/article-publishing-workflow.md`](../../docs/article-publishing-workflow.md) 處理，優先使用 `python tools/publish_article.py`。

## 預設：單檔模式

```text
_incoming/articles/my-new-report.md
```

當資料夾中只有一個待處理項目時：

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

## 自動維護

正式文章進入 `main/docs` 後，Content Maintenance 會自動：

1. 更新 root README generated article catalog。
2. 驗證並同步 canonical `docs/` 到 `app-main`。
3. 使用一般 merge commit 合併 Desktop content-sync PR。

不要直接手動編輯 README generated article catalog，也不要把 `app-main/docs` 當成另一份文章來源。
