# 待上架文章暫存區

把尚未上架的 raw markdown 放在這裡，之後 Codex 會依照 `docs/article-publishing-workflow.md` 處理。

## 預設：單檔模式

最簡單的方式是直接放一個 markdown 檔：

```text
_incoming/articles/my-new-report.md
```

Codex 上架完成後會建立正式文章，並移除這個 raw input 檔案。

## 選用：資料夾模式

只有在需要保留 research activity、附件或圖片時，才使用資料夾：

```text
_incoming/articles/my-new-report/
  article.md
  research-activity.md
  assets/
```

`article.md` 是正式文章主文；`research-activity.md` 會被放進文章結尾的「附件（展開）」區塊。
