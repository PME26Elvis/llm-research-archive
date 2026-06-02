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

## 新增文章

### 方式一：使用工具建立骨架

```bash
python tools/new_note.py
```

依提示輸入標題、分類與 tags 後，工具會建立：

```text
docs/<category>/<slug>/index.md
docs/<category>/<slug>/assets/
```

### 方式二：從 `_incoming/articles/` 上架

若有待上架文章，可先放入 `_incoming/articles/`，再依 `docs/article-publishing-workflow.md` 的流程整理 metadata、分類、slug、附件與 citation 清理。

建議正式文章格式：

```yaml
---
date: YYYY-MM-DD
tags:
  - LLM
  - Topic Tag
---

# 文章標題
```

文章路徑建議固定為：

```text
docs/<category>/<english-kebab-case-slug>/index.md
```

## 實用工具

- `python tools/new_note.py`：建立新文章目錄、`index.md` 與 `assets/`。
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
