# 新文章上架流程

本文件定義之後透過 Codex 上架新研究文章時的標準流程。使用者可以把 raw markdown 放到待處理資料夾，或直接在對話中貼上完整文章；Codex 依此流程整理、清理 citation、建立正式文章路徑，最後移除已處理的 raw input（若有）。

## 目標

- 讓「新增文章」從手動複製整理，變成可重複執行的 Codex 流程。
- 預設採用單檔 markdown 上架，保持操作最簡單。
- 標題、正式檔名（slug）、分類、日期、tags 等 metadata，除非使用者明確指定，均由 Codex 依文章內容自行決定最合適的值。
- 只有在需要保留 research activity 或其他附件時，才使用資料夾模式。
- 上架時先只強制移除 OpenAI citation marker；其他明顯不是給讀者閱讀的引用或工具 wrapper，由 Codex 依內容判斷是否移除或改寫。

## 待處理資料夾

使用 repo 根目錄的 `_incoming/articles/` 作為新文章 raw markdown 暫存區。

### 預設：單檔模式

最簡單的做法是直接放一個 markdown 檔：

```text
_incoming/articles/<name>.md
```

此檔案即為完整文章 markdown。上架完成後，Codex 應移除此 raw input 檔案。

### 選用：資料夾模式

只有在需要保留 research activity、附件或圖片時，才使用資料夾：

```text
_incoming/articles/<name>/
  article.md
  research-activity.md
  assets/
```

- `article.md` 是正式文章主文。
- `research-activity.md` 是選用附件，會被放到文章結尾的 `<details>` 區塊。
- `assets/` 是選用資產資料夾；若文章真的需要圖片或其他檔案，再複製到正式文章的 `assets/`。

## Codex 上架輸入

當使用者要求「根據本文件上架新文章」時，Codex 應先判斷輸入來源。

### 來源一：`_incoming/articles/`

Codex 應先檢查 `_incoming/articles/`。若只有一個待處理項目，直接處理該項目。若有多個待處理項目，除非使用者明確要求全部上架，否則應先列出候選項目並請使用者確認。

### 來源二：對話直接貼上完整文章

若使用者直接在對話中貼上完整文章、報告或 markdown 文件，Codex 不應因為 `_incoming/articles/` 沒有待處理檔案而卡住；應將該貼文視為 raw markdown 輸入，照同一套 metadata 推斷、citation 清理、正式路徑建立與檢查流程上架。

直接貼文時沒有 raw input 檔案可刪除，因此「移除 raw input」步驟視為不適用並略過。

若使用者同時貼上「報告」與 research activity/附件，Codex 可以把報告作為正式文章主文、把 research activity 依附件策略放入 `<details>`；但**絕對不能更動任何屬於報告本文或 research activity（作為附件）的文字**。Codex 只能新增 front matter、建立路徑、補分類輔助檔，或處理使用者明確允許修改的包裝性文字。

## 推斷 metadata

Codex 應從 raw markdown 推斷下列資訊；除非使用者明確指定，標題、檔名/slug、分類與 tags 都由 Codex 自行決定最合適的值。

### title

優先使用文章中的第一個 H1：

```markdown
# 文章標題
```

若 raw markdown 沒有 H1，Codex 應根據內容補一個合適標題。

### category

文章正式路徑格式為：

```text
docs/<category>/<slug>/index.md
```

分類判斷建議：

- LLM、AI、agent、model、inference、compute、GPU、benchmark 類文章放 `docs/llm/`。
- Computer Science、taxonomy、programming、software engineering、data structure、algorithm 類文章放 `docs/cs/`。
- 健康類文章放 `docs/health/`。
- 碳排、能源、環境類文章放 `docs/carbon/`。
- 無法明確判斷時，Codex 應先詢問使用者，不要硬放。

### slug

`slug` 使用英文 kebab-case，應短而可讀，例如：

```text
agentic-ai-constrained-environments-analysis-2024-2026
local-llm-dev-performance-report
cs-super-tree-report
```

若 raw markdown 只有中文標題，Codex 應根據文章主題翻成英文 slug。

### date

使用上架當日日期，格式為 `YYYY-MM-DD`。

### tags

每篇文章至少放 1 個分類 tag，再依主題放 1–3 個主題 tag。

範例：

```yaml
tags:
  - LLM
  - Agentic AI
```

## 正式文章格式

正式文章檔案為：

```text
docs/<category>/<slug>/index.md
```

開頭使用 YAML front matter：

```yaml
---
date: YYYY-MM-DD
tags:
  - LLM
  - Topic Tag
---
```

接著保留或補上文章 H1：

```markdown
# 文章標題
```

如果正式路徑已存在，Codex 必須停止並詢問使用者，不可覆蓋既有文章。

## Citation 清理策略

上架前必須先清理 OpenAI Deep Research / ChatGPT 產生的 citation marker。

目前既有工具是：

```bash
python tools/remove_citations.py
```

但 `tools/remove_citations.py` 會掃描整個 `docs/`。若只處理單篇新文章，Codex 可以使用相同核心 regex 對新文章內容做局部清理：

```python
re.compile(r'[ \t]*\uE200cite\uE202[^\uE201]*\uE201')
```

此 regex 目標是移除下列形式的 marker：

```text
\uE200cite\uE202...\uE201
```

除了強制移除 OpenAI citation marker 之外，Codex 還應用 AI 判斷檢查文章中是否有明顯不是給讀者閱讀的 citation、工具 wrapper 或生成痕跡，例如：

- `entity...` 類 entity wrapper。
- `image_group...` 類沒有實際圖片資產的 image placeholder。
- 明顯是研究工具內部紀錄、搜尋提示、截圖規劃、引用管理筆記的段落。

處理原則：

- 若 wrapper 只是包住一般專有名詞，改成純文字。
- 若 image placeholder 沒有對應實際資產，刪除該 placeholder，或改寫成一般文字說明。
- 若段落明顯是 research activity，而使用資料夾模式提供了 `research-activity.md`，可放入附件。
- 若段落明顯是 research activity，但使用者沒有要求保留附件，預設可以移除，以維持正式文章可讀性。
- 不要刪除正常 markdown 連結、表格、程式碼、Mermaid 圖或文章正文。
- 若使用者明確要求保留報告本文或 research activity 原文（例如直接貼文並聲明不可更動），則該原文屬受保護文字；即使其中含有 citation marker、entity wrapper 或其他生成痕跡，也不得改寫或刪除，只能在檢查結果中註明是依使用者要求保留。

## 附件策略

預設不強制建立附件，因為此 repo 的目標是簡單、快速、自動化上架文章。

### 無附件

單檔模式預設只建立正式文章，不額外加 `<details>`。

### 有 research activity

若使用資料夾模式提供 `research-activity.md`，在正式文章結尾加入：

```markdown
<details>
<summary>附件（展開）</summary>

Research activity 或其他補充內容放這裡。

</details>
```

若 research activity 過長、格式混亂，或包含大量不適合公開閱讀的中間推理與引用管理筆記，Codex 可以摘要後放入附件，或詢問使用者是否略過。

## 分類輔助檔

若文章新增到既有分類，通常不需要更動分類檔。

若新增全新分類，需建立：

```text
docs/<category>/index.md
docs/<category>/.meta.yml
```

`index.md` 範例：

```markdown
# Category Name
```

`.meta.yml` 範例：

```yaml
tags:
  - Category Tag
```

## 上架完成後移除 raw input

成功建立正式文章後，刪除已處理的 raw input。

- 單檔模式：刪除 `_incoming/articles/<name>.md`。
- 資料夾模式：刪除 `_incoming/articles/<name>/`。

刪除前必須確認正式文章已建立完成，且 citation 清理已完成。

## 建議檢查

完成上架後至少執行：

```bash
git status --short
rg -n 'cite|\uE200cite|image_group|entity' docs/<category>/<slug>/index.md
sed -n '1,40p' docs/<category>/<slug>/index.md
```

如果環境允許，再執行：

```bash
mkdocs build
```

## Commit message 建議

單篇文章：

```text
新增文章: <文章短標題>
```

多篇文章：

```text
新增多篇文章
```

只新增或調整流程文件：

```text
新增文章上架流程文件
```

## 之後的使用方式

使用者之後可以這樣要求 Codex：

> 請根據 `docs/article-publishing-workflow.md`，把 `_incoming/articles/` 裡的新 markdown 上架成文章，完成後移除 raw input。

Codex 應依序：

1. 找出 `_incoming/articles/` 中的待處理項目。
2. 讀取 raw markdown。
3. 推斷 title、category、slug、date、tags。
4. 清理 OpenAI citation marker。
5. 用 AI 判斷移除或改寫明顯不是給讀者閱讀的 citation、工具 wrapper 或 research activity 痕跡。
6. 建立 `docs/<category>/<slug>/index.md`。
7. 視需要加入 `<details>` 附件。
8. 移除已處理的 raw input；若文章由對話直接貼上，則此步驟不適用。
9. 執行檢查並回報新增路徑。
