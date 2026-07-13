# llm-research-archive

長文研究筆記庫，使用 **MkDocs Material** 建成可搜尋、可分類、可部署的靜態網站。內容目前涵蓋 LLM / AI、碳排與能源、Computer Science，以及跨主題時間軸；網站設定語系為繁體中文（zh-TW）。

## 專案特色

- **MkDocs Material 知識庫**：支援 tabs / sections 導覽、instant navigation、深色模式、返回頂端、程式碼複製與搜尋標亮。
- **長文研究文章管理**：文章以 `docs/<category>/<slug>/index.md` 的方式整理，並透過 YAML front matter 記錄日期與 tags。
- **自動字數統計**：`hooks/word_counts.py` 會在 MkDocs build 時統計文章字數、閱讀時間，並產生 `docs/word-counts.md`。
- **Tags 與 Timeline**：啟用 `tags` 與 `blog` plugins，方便依主題或時間探索文章。
- **圖片閱讀體驗**：整合 `mkdocs-glightbox`，文章圖片可用 lightbox 放大檢視。
- **GitHub Pages 部署**：`.github/workflows/deploy.yml` 會在推送到 `main` 時建置並發布網站。

## 內容分類

| 分類 | 路徑 | 說明 |
| --- | --- | --- |
| 首頁 | `docs/index.md` | 網站入口、快速連結與閱讀體驗說明。 |
| LLM | `docs/llm/` | 大型語言模型、agentic AI、算力、benchmark 與本地開發效能研究。 |
| Carbon | `docs/carbon/` | 碳排、能源、再生能源容量與政策資料整理。 |
| CS | `docs/cs/` | 電腦科學、資料結構、演算法與分類法相關長文。 |
| Timeline | `docs/timeline/` | Blog / 時間軸文章歸檔。 |
| Tags | `docs/tags.md` | 跨分類標籤索引。 |
| 字數總表 | `docs/word-counts.md` | 由 hook 自動更新的文章字數與閱讀時間總表。 |

## 目前文章

- `docs/llm/agentic-ai-constrained-environments-analysis-2024-2026/`：Agentic AI 在高度受限環境下的規劃與反思機制分析。
- `docs/llm/local-llm-dev-performance-report/`：本地開源大型語言模型在實務軟體開發中的效能與部署價值研究。
- `docs/llm/why-tech-giants-need-more-compute-report/`：科技業龍頭為何認為 AI 算力仍然不足的原因、證據與趨勢分析。
- `docs/carbon/taiwan-renewable-energy-capacity-report/`：臺灣再生能源裝置容量發展、核能退場與未來供給目標整理。
- `docs/cs/cs-super-tree-report/`：電腦科學超級樹分類法與互動視覺化實作報告。
- `docs/timeline/posts/hello.md`：Timeline 範例文章。

## 專案結構

```text
.
├── docs/                         # MkDocs 內容根目錄
│   ├── index.md                  # 網站首頁
│   ├── article-publishing-workflow.md
│   ├── word-counts.md            # build 時由 hook 更新
│   ├── tags.md
│   ├── llm/
│   ├── carbon/
│   ├── cs/
│   ├── timeline/
│   ├── stylesheets/extra.css
│   └── javascripts/extra.js
├── hooks/word_counts.py          # MkDocs hook：字數統計與閱讀時間
├── tools/publish_article.py      # 從 _incoming/articles/ 無腦上架文章
├── tools/new_note.py             # 互動式建立新文章骨架
├── tools/remove_citations.py     # 清理 Deep Research / ChatGPT citation marker
├── _incoming/articles/           # 待上架文章暫存區與格式說明
├── mkdocs.yml                    # MkDocs Material 設定
├── requirements.txt              # Python / MkDocs 依賴
└── .github/workflows/deploy.yml  # GitHub Pages 自動部署
```

## 本機開發

### 1. 安裝依賴

建議使用 Python virtual environment：

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. 啟動本機預覽

```bash
mkdocs serve
```

啟動後可在瀏覽器開啟 MkDocs 顯示的本機網址（通常是 `http://127.0.0.1:8000/`）。

### 3. 建置檢查

```bash
mkdocs build --strict
```

`hooks/word_counts.py` 會在 build 過程中掃描有 `date` front matter 的文章，更新 `docs/word-counts.md`，並在文章頁顯示字數與預估閱讀時間。

## 新增文章（無腦上架流程）

你不需要手動建立 `docs/<category>/<slug>/index.md`、複製內文、挑 tags 或清 citation。最推薦的流程是：**把 raw markdown 丟進 `_incoming/articles/`，然後叫 Codex 依本 README 或 `docs/article-publishing-workflow.md` 上架。**

### 最短操作

1. 把新文章原始 Markdown 存成單一檔案：

   ```text
   _incoming/articles/my-new-report.md
   ```

2. 對 Codex 說：

   > 請根據 README 的無腦上架流程，把 `_incoming/articles/` 裡的新文章上架。

3. Codex 會完成：
   - 讀取 raw markdown。
   - 從 H1 / 內容推斷標題、分類、英文 kebab-case slug、日期與 tags。
   - 清理 Deep Research / ChatGPT citation marker、entity wrapper、無實際資產的 image placeholder。
   - 建立正式路徑 `docs/<category>/<slug>/index.md` 與 `assets/`。
   - 若 raw input 來自 `_incoming/articles/`，上架成功後移除該 raw input。
   - 執行檢查（至少確認檔案、front matter、citation marker；可行時執行 `mkdocs build --strict`）。

### AI 上架工具

repo 內提供 `tools/publish_article.py` 給 Codex 或維護者使用。當 `_incoming/articles/` 只有一篇待上架文章時，可直接執行：

```bash
python tools/publish_article.py
```

如果有多篇或需要指定資訊，可明確帶參數：

```bash
python tools/publish_article.py _incoming/articles/my-new-report.md \
  --category llm \
  --slug my-new-report \
  --tags "LLM,Agentic AI"
```

工具會：

- 支援單檔模式：`_incoming/articles/<name>.md`。
- 支援資料夾模式：`_incoming/articles/<name>/article.md`、選用 `research-activity.md`、選用 `assets/`。
- 自動加上 YAML front matter：`date` 與 `tags`。
- 若文章沒有 H1，依檔名 / 參數補 H1。
- 拒絕覆蓋已存在的正式文章。
- 預設移除已處理的 raw input；若要保留可加 `--keep-raw`。

> `tools/publish_article.py` 是「機械化上架」工具；分類、slug、tags 若 AI 判斷得更準，Codex 可以在執行時補上參數，或在建立後做必要微調。

### 上架邏輯

正式文章固定放在：

```text
docs/<category>/<english-kebab-case-slug>/index.md
```

分類邏輯：

- LLM / AI / agent / model / inference / compute / GPU / benchmark：放 `docs/llm/`。
- Computer Science / programming / software engineering / data structure / algorithm / taxonomy：放 `docs/cs/`。
- 健康、醫療、營養、睡眠、運動：放 `docs/health/`。
- 碳排、能源、再生能源、環境、氣候：放 `docs/carbon/`。
- 無法明確判斷時，Codex 應先詢問，不要硬塞分類。

metadata 邏輯：

- `title`：優先使用文章第一個 H1；沒有 H1 才補標題。
- `slug`：用英文 kebab-case，短、可讀、可從 URL 理解主題。
- `date`：使用上架當日 `YYYY-MM-DD`。
- `tags`：至少一個分類 tag（例如 `LLM` / `CS` / `Carbon` / `Health`），再加 1–3 個主題 tag。

正式文章開頭應長這樣：

```yaml
---
date: YYYY-MM-DD
tags:
  - LLM
  - Topic Tag
---

# 文章標題
```

詳細 SOP、Codex 行為規則、附件策略與檢查清單請看 `docs/article-publishing-workflow.md`。

## 實用工具

- `python tools/publish_article.py`：從 `_incoming/articles/` 將 raw markdown 上架成正式文章，自動補 front matter、清理 AI citation marker，並移除 raw input。
- `python tools/new_note.py`：互動式建立新文章目錄、`index.md` 與 `assets/`；適合只想先開空白骨架時使用。
- `python tools/remove_citations.py`：掃描 `docs/**/*.md`，移除 OpenAI Deep Research / ChatGPT citation marker。
- `mkdocs build --strict`：嚴格建置網站，同時觸發字數統計 hook。

> 注意：`tools/remove_citations.py` 會直接修改 `docs/` 底下符合條件的 Markdown 檔案，執行前建議先確認 git working tree 狀態。

## 部署

本 repo 已設定 GitHub Actions：當 `main` 分支收到 push 時，workflow 會：

1. 建立 Python 環境。
2. 安裝 `requirements.txt` 中的 MkDocs 依賴。
3. 執行 `mkdocs build --strict`。
4. 將產出的 `site/` 發布到 GitHub Pages。

網站 URL 由 `mkdocs.yml` 設定為：

```text
https://PME26Elvis.github.io/llm-research-archive/
```

## 維護建議

- 新文章請至少提供 `date` 與 `tags`，否則不會被字數統計視為正式文章。
- 新分類請補上 `docs/<category>/index.md` 與必要的 `.meta.yml`，讓導覽更清楚。
- 若文章含圖片，建議放在同篇文章的 `assets/` 目錄中。
- 上架由 AI 研究工具輸出的文章時，請先清理 citation marker、entity wrapper 或沒有實際資產的 image placeholder。
- 修改文章後建議執行 `mkdocs build --strict`，確認導覽、tags、字數總表與 plugin 設定都能正常產生。

## Research Observatory Desktop

This branch contains the completed TypeScript/Electron desktop implementation. Use `npm ci`, then `npm run verify` for coverage, architecture, accessibility, dependency, performance, build, and renderer-footprint gates. Desktop CI additionally runs Electron E2E plus native Windows x64, Linux x64, macOS arm64, and macOS x64 make, packaged smoke, and installed-footprint checks. The app reads canonical Markdown from `docs/` by default and can select validated local workspaces through the native UI.
