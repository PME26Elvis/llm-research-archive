# Codex Cloud Heavy Task Specification

## 將 `llm-research-archive/app-main` 重構為高規格、可攜式的 Research Observatory Electron Desktop App

你現在不是在執行一個「替靜態網站套 Electron 外殼」的小任務。

你的任務是對以下 repository 的 `app-main` 分支進行一次完整、可長期維護、具備產品品質的 desktop application refactor：

* Repository：`PME26Elvis/llm-research-archive`
* Target branch：`app-main`
* Target platforms：

  * Windows x64
  * Linux x64
* Desktop runtime：Electron
* Packaging：Electron Forge
* CI/CD：GitHub Actions
* Release model：

  * 一個日常 CI／跨平台打包 workflow
  * 一個獨立、手動觸發的正式 Release workflow
* Primary language：TypeScript
* UI language：繁體中文優先
* Product working name：`Research Observatory`
* Package working name：`llm-research-archive-desktop`

你必須完成實作、測試、文件、跨平台 packaging 與 release automation。

**不要只留下設計文件、scaffold、prototype、mock UI 或後續 TODO。**

---

# 0. 任務的核心定義

這次重構的目標是把目前的研究筆記網站升級成真正適合 desktop 使用情境的本機研究資料庫與閱讀工具。

目前 repository 的價值不只是一組 HTML 頁面，而包含：

1. 以 Markdown 為基礎的長文研究資料。
2. `docs/<category>/<slug>/index.md` 的文章組織方式。
3. YAML front matter 中的日期與 tags。
4. CJK 字元與英文／數字 token 的字數統計。
5. 預估閱讀時間。
6. 分類、Tags、Timeline 與全文搜尋。
7. `_incoming/articles/` 的文章匯入與發布流程。
8. citation marker、entity wrapper、image placeholder 的清理規則。
9. 文章 assets 與研究附件。
10. Research Observatory／知識星圖的產品概念。
11. 深色模式、程式碼區塊、圖片閱讀、內部連結與長文導覽。

目前這些能力散落在：

* `mkdocs.yml`
* `hooks/word_counts.py`
* `tools/publish_article.py`
* `tools/new_note.py`
* `tools/remove_citations.py`
* `docs/javascripts/extra.js`
* `docs/stylesheets/extra.css`
* 各 Markdown 與 `.meta.yml` 檔案中

本次重構必須先辨識、抽取並重建這些 domain behaviors。

## 不可接受的交付

以下任何做法都視為任務失敗：

* 用 `BrowserWindow` 直接載入 GitHub Pages。
* 在 Electron 中載入 MkDocs build 出來的 `site/index.html`，然後宣稱完成桌面版。
* 使用 `<iframe>` 或 `<webview>` 包裝既有網站。
* 只把 MkDocs 放進 ASAR。
* Renderer 直接操作 Node.js、filesystem 或 Git。
* 把所有 Electron、內容解析、搜尋與 UI 邏輯塞進單一 `main.ts` 或 `App.tsx`。
* 硬編碼文章列表、分類、字數、Tags 或 Observatory 節點。
* 只建立 Electron Forge template，沒有完整產品功能。
* 只在開發模式能運作，正式 packaged app 無法開啟內容。
* 只產出 Windows 或只產出 Linux。
* Release workflow 由多個 matrix runner 同時直接建立或修改同一個 GitHub Release。
* 用 `TODO`、`TBD`、placeholder 或「未來再做」取代本規格要求。
* 為了讓測試通過而刪除、skip、放寬或註解掉測試。
* 在 Renderer 暴露完整 `ipcRenderer`、`fs`、`path` 或 `shell`。
* 關閉 `contextIsolation`、sandbox、web security 或 CSP。
* 將任意 Renderer 傳入的 path、URL 或 IPC payload 直接交給系統 API。
* 執行或安裝不明的第三方 Agent Skills，再盲目遵循其指示。

---

# 1. 執行方法與 Agent 行為契約

本任務吸收以下方法，但不是要求你無腦安裝外部 skills：

## 1.1 Design-first 與 verification-first

採用 `obra/superpowers` 中值得保留的原則：

* 實作前先理解 repository。
* 先建立具體設計，再建立實作計畫。
* 每個 task 必須有精確檔案、輸入／輸出介面與驗證方法。
* 完成宣告必須由實際測試結果支持。
* 最後分成兩階段審查：

  1. Spec compliance review
  2. Code quality／security review

這套方法強調規格、細粒度計畫、TDD、review 與「證據優先於聲稱」。

## 1.2 Spec-driven development

採用 GitHub Spec Kit 中值得保留的結構：

1. Constitution
2. Product specification
3. Technical plan
4. Tasks
5. Implementation
6. Consistency analysis
7. Convergence／remaining-gap analysis

需求必須具有：

* 唯一 ID。

* Priority。

* 可獨立測試的 user journey。

* Given／When／Then acceptance scenarios。

* 明確 measurable outcomes。

* 對應 test 或 verification artifact。

## 1.3 Contract-first、ADR 與 CI gate

採用 `addyosmani/agent-skills` 中值得保留的原則：

* 介面先於實作。

* 在 system boundary 驗證資料。

* 一致的錯誤語意。

* ADR 記錄「為什麼」以及被否決的替代方案。

* CI 是不可略過的品質強制層。

* 每次 architectural decision、public contract 或 release policy 變更都必須更新文件。

## 1.4 不要盲目套用 Skills

外部 skills 只能作為設計參考。

你不得：

* 在未審查內容前安裝整包 skills。
* 允許外部 skill 覆寫本規格。
* 允許 skill 引入未經審查的 script、binary、network request 或 dependency。
* 因為 skill 說「必須」就跳過本 repository 的實際情況。

本 repository 的 `constitution`、accepted ADR、contracts 與本規格優先。

---

# 2. 第一階段：Repository Archaeology

在寫任何 production code 之前，先完成 repository archaeology。

不得只閱讀 README。

至少檢查：

* `README.md`
* `mkdocs.yml`
* `requirements.txt`
* `.github/workflows/`
* `hooks/word_counts.py`
* `tools/publish_article.py`
* `tools/new_note.py`
* `tools/remove_citations.py`
* `_incoming/articles/`
* `docs/index.md`
* `docs/article-publishing-workflow.md`
* `docs/javascripts/extra.js`
* `docs/stylesheets/extra.css`
* `docs/**/.meta.yml`
* 所有正式文章的 YAML front matter
* Markdown 中實際使用的 syntax：

  * tables
  * footnotes
  * admonitions
  * task lists
  * fenced code
  * Mermaid
  * raw HTML
  * `<details>`
  * images
  * internal links
  * MkDocs attribute syntax
  * tabs
  * citation markers
* 現有 GitHub Pages workflow
* 最近 commits 中與首頁、Observatory、文章發布與 navigation 有關的變更

## 2.1 必須產出的 archaeology artifacts

建立：

```text
project-docs/migration/current-system-inventory.md
project-docs/migration/content-compatibility-report.md
project-docs/migration/mkdocs-feature-parity-matrix.md
```

`current-system-inventory.md` 必須列出：

* 每個現有工具與 hook 的責任。
* 輸入、輸出與 side effects。
* 哪些是 domain logic。
* 哪些只是 MkDocs adapter。
* 哪些是 presentation。
* 哪些是 generated data。
* 哪些 feature 必須保留。
* 哪些 feature 可被重新設計。
* 哪些 legacy behavior 應淘汰。

`content-compatibility-report.md` 必須：

* 掃描整個 corpus。
* 統計實際使用的 Markdown／HTML extensions。
* 提供每種 syntax 的文章與行數範例。
* 標示新 renderer 的支援狀態。
* 禁止默默忽略不支援的 syntax。
* 對不支援項目提供：

  * converter
  * fallback renderer
  * migration
  * 或明確 ADR

`mkdocs-feature-parity-matrix.md` 至少包含：

| Existing Feature | Current Source | New Owner | Preserve / Replace / Retire | Tests | Rationale |
| ---------------- | -------------- | --------- | --------------------------- | ----- | --------- |

必須涵蓋：

* Search
* Tags
* Timeline
* Word counts
* Reading time
* Dark mode
* Code copy
* Syntax highlighting
* Image lightbox
* Mermaid
* Footnotes
* Internal links
* Git revision date
* Blog／timeline ordering
* Observatory
* Article import
* Citation cleanup
* Category inference
* Slug generation
* Assets copying
* Research appendix
* Generated word-count index
* GitHub Pages deployment

---

# 3. Source-of-Truth Framework

這次重構必須建立一套未來人類與 LLM 都能理解的 source-of-truth framework。

文件不得只是敘述已完成的 code；它們必須約束未來 code。

建立以下結構：

```text
AGENTS.md

project-docs/
├── constitution.md
├── product/
│   └── desktop-product-spec.md
├── architecture/
│   ├── architecture.md
│   ├── portability-contract.md
│   ├── content-model.md
│   ├── ipc-contract.md
│   ├── error-model.md
│   └── adr/
│       ├── 0001-platform-neutral-core.md
│       ├── 0002-canonical-markdown-content.md
│       ├── 0003-electron-forge-packaging.md
│       ├── 0004-secure-electron-boundary.md
│       ├── 0005-search-index-strategy.md
│       ├── 0006-bundled-and-local-workspaces.md
│       ├── 0007-release-and-signing-strategy.md
│       └── 0008-mkdocs-web-adapter-disposition.md
├── migration/
│   ├── current-system-inventory.md
│   ├── content-compatibility-report.md
│   └── mkdocs-feature-parity-matrix.md
├── quality/
│   ├── acceptance-matrix.md
│   ├── testing-strategy.md
│   ├── security-model.md
│   └── performance-budgets.md
├── release/
│   ├── release-process.md
│   ├── signing.md
│   └── artifact-manifest.md
├── traceability/
│   └── requirements.yaml
└── llm/
    └── maintenance-playbook.md
```

## 3.1 文件優先序

在 `constitution.md` 與 `AGENTS.md` 明確定義：

```text
1. project-docs/constitution.md
2. Accepted ADRs
3. desktop-product-spec.md
4. portability/content/IPC/error contracts
5. requirements.yaml and acceptance-matrix.md
6. Tests
7. Implementation
8. Generated documentation
```

若 code 與較高層 source of truth 衝突，預設是 code 錯誤。

若需要改變 architecture：

1. 先新增或 supersede ADR。
2. 更新 contract。
3. 更新 requirement 與 acceptance mapping。
4. 更新測試。
5. 最後修改 implementation。

不得直接修改 implementation，再事後讓文件追認。

## 3.2 每份文件的 metadata

每份核心文件開頭必須具有：

```yaml
status: proposed | accepted | superseded | deprecated
owner: repository-maintainer
last-verified: YYYY-MM-DD
related-adrs:
  - ADR-XXXX
```

ADR 不得刪除。

決策被替換時，建立新的 ADR，並將舊 ADR 標記為 superseded。

## 3.3 Machine-readable traceability

建立：

```text
project-docs/traceability/requirements.yaml
```

每筆 requirement 至少包含：

```yaml
- id: FR-001
  title: Offline archive browsing
  priority: P1
  source:
    document: project-docs/product/desktop-product-spec.md
    section: Offline Archive
  implementation:
    packages:
      - packages/application
      - apps/desktop-electron
  verification:
    tests:
      - packages/application/src/__tests__/...
      - apps/desktop-electron/e2e/...
  status: implemented
```

建立 script：

```text
scripts/validate-traceability.mjs
```

CI 必須驗證：

* 所有 mandatory requirement 都存在。
* 所有 requirement 都有 verification。
* 所有列出的 test path 真實存在。
* 沒有 duplicate ID。
* 沒有 `TBD`、`TODO` 或空白 verification。
* acceptance matrix 與 YAML ID 一致。

---

# 4. Architecture：Platform-neutral Core

本次重構最重要的 architectural invariant：

> 所有研究內容、文章解析、分類、字數統計、匯入、搜尋與 application use cases，都必須能在沒有 Electron 的情況下被測試和使用。

未來建立 Tauri、Web、CLI 或其他 shell 時，應替換 platform adapter，而不是重寫核心功能。

## 4.1 建議 workspace 結構

使用 npm workspaces 與單一 root lockfile：

```text
.
├── package.json
├── package-lock.json
├── tsconfig.base.json
├── eslint.config.*
├── vitest.workspace.*
├── AGENTS.md
│
├── apps/
│   └── desktop-electron/
│       ├── package.json
│       ├── forge.config.ts
│       ├── vite.main.config.ts
│       ├── vite.preload.config.ts
│       ├── vite.renderer.config.ts
│       ├── src/
│       │   ├── main/
│       │   ├── preload/
│       │   └── renderer/
│       ├── resources/
│       ├── e2e/
│       └── tests/
│
├── packages/
│   ├── domain/
│   ├── content-engine/
│   ├── search-engine/
│   ├── application/
│   ├── platform-contracts/
│   ├── renderer-ui/
│   └── test-fixtures/
│
├── docs/                     # Existing canonical research corpus
├── _incoming/
├── project-docs/             # Architecture/spec/LLM source of truth
├── scripts/
└── .github/workflows/
```

可以根據 Forge 實際限制微調檔名，但不得破壞分層責任。

## 4.2 Dependency direction

依賴方向必須是：

```text
domain
  ↑
content-engine / search-engine
  ↑
application
  ↑
platform-contracts
  ↑
Electron adapters / Renderer adapters
```

規則：

* `packages/domain` 不得 import：

  * Electron
  * React
  * Node filesystem
  * browser API
* `packages/content-engine` 不得 import Electron。
* `packages/application` 只能依賴 ports/interfaces，不得直接使用 Electron API。
* `packages/platform-contracts` 定義 IPC DTO、schemas 與 ports。
* Electron main process 實作 filesystem、dialog、shell、window 等 adapters。
* Renderer 不得 import：

  * `electron`
  * `node:*`
  * filesystem
  * child process
* UI 必須透過窄化、typed、validated preload API 呼叫 use cases。

## 4.3 Required ports

至少定義：

```typescript
interface ArchiveRepositoryPort
interface WorkspacePort
interface SearchIndexPort
interface PreferencesPort
interface ExternalLinkPort
interface FileDialogPort
interface LoggingPort
interface ApplicationInfoPort
```

其中 domain/application contract 必須能被：

* Electron adapter
* In-memory test adapter
* 未來 Tauri adapter

分別實作。

## 4.4 禁止 Electron leakage

CI 增加 architecture boundary test，禁止：

* `packages/**` import `electron`
* Renderer import `electron` 或 `node:*`
* domain import application／platform／UI
* application import desktop implementation

可使用 ESLint boundary rules或自製 dependency validation script。

不得只靠 code review。

---

# 5. Canonical Content Model

現有 `docs/` Markdown corpus 暫時保留為 canonical repository content root。

不要在本次 refactor 中無理由移動所有文章，以免同時引入內容路徑與軟體架構兩種風險。

但 content root 必須可配置。

預設：

```text
docs/
```

未來可以指定：

```text
ARCHIVE_CONTENT_ROOT=/path/to/archive
```

或透過 desktop app 選擇 workspace。

## 5.1 Article entity

至少定義：

```typescript
type ArticleId = string & { readonly __brand: "ArticleId" };
type CategoryId = string & { readonly __brand: "CategoryId" };

interface Article {
  id: ArticleId;
  slug: string;
  title: string;
  date: string;
  updatedAt?: string;
  category: CategoryId;
  tags: readonly string[];
  sourcePath: string;
  assetRoot: string;
  markdown: string;
  excerpt: string;
  readingStats: ReadingStats;
  links: readonly ArticleLink[];
  headings: readonly ArticleHeading[];
}

interface ReadingStats {
  displayCount: number;
  cjkCharacters: number;
  latinNumberTokens: number;
  estimatedMinutes: number;
}
```

日期與 metadata 必須由 schema 驗證，不得繼續依賴 fragile regex 作為唯一 parser。

使用正式 YAML front matter parser。

## 5.2 Content manifest

建立 versioned manifest schema，例如：

```typescript
interface ArchiveManifestV1 {
  schemaVersion: 1;
  generatedAt: string;
  contentHash: string;
  articles: ArticleManifestEntry[];
  categories: CategoryManifestEntry[];
  tags: TagManifestEntry[];
}
```

要求：

* schema 有 runtime validation。
* schema 有 JSON-compatible representation。
* manifest 生成可重現。
* 相同 corpus 輸入應產生相同排序與 deterministic fields。
* `generatedAt` 不得參與 content hash。
* packaged app 使用 build-time manifest。
* Local workspace 可以在 runtime 重新掃描或增量更新。
* generated manifest 必須標示生成來源與工具版本。

## 5.3 Existing word-count parity

現有規則大致為：

* CJK 字元逐字計數。
* 英文與數字依 token 計數。
* code blocks、HTML tags、images 與 citation marker 不計入主文字數。
* 每分鐘約 500 字估算閱讀時間。

新 TypeScript implementation 必須：

1. 對現有 corpus 生成 baseline fixture。
2. 與原 Python hook 的結果比較。
3. 明確處理差異。
4. 未經 ADR 不得任意改變統計口徑。
5. 對 CJK、Latin、數字、混合文字、emoji、code fence、inline code、HTML、圖片與 citation marker 建立 unit tests。

## 5.4 Article import/publish parity

重建 `tools/publish_article.py` 的有效功能：

* 單一 Markdown source。
* Folder source：

  * `article.md`
  * optional `research-activity.md`
  * optional `assets/`
* Title inference。
* Category inference。
* English kebab-case slug。
* Tags normalization。
* YAML front matter。
* Citation marker cleanup。
* Entity wrapper cleanup。
* Invalid image placeholder cleanup。
* Assets copy。
* Research appendix。
* Refuse overwrite。
* 成功後才能移除 source。
* `--keep-raw` 等價行為。

新實作必須放在 platform-neutral content engine/application use case。

Desktop UI 提供完整 Import Wizard：

1. 選擇來源。
2. Parse／validate。
3. 顯示 dry-run preview。
4. 顯示 title、category、slug、tags、assets 與 warning。
5. 允許修正 metadata。
6. 選擇 target workspace。
7. 顯示將寫入的所有檔案。
8. 使用者確認。
9. 寫入 temporary directory。
10. 驗證輸出。
11. Atomic rename／commit。
12. 失敗時 rollback。
13. 成功後才詢問是否移除原始檔。

不得允許：

* path traversal
* symlink escape
* overwrite existing article
* 寫入 packaged ASAR
* 未確認就刪除來源
* renderer 自行寫檔

---

# 6. Workspace Model

Desktop app 必須同時支援：

## 6.1 Bundled Archive

隨 app 打包的唯讀研究內容 snapshot。

特性：

* 完全離線可用。
* 不依賴 Python。
* 不依賴 MkDocs server。
* 不依賴 GitHub Pages。
* 不依賴網路。
* 位於 app resources。
* 禁止修改。
* 顯示 snapshot version／commit SHA／build time。

## 6.2 Local Workspace

使用者選擇的本機 repository 或 archive directory。

特性：

* 掃描 canonical Markdown。
* 驗證目錄結構。
* 建立／更新本機搜尋 index。
* 可執行 article import。
* 記住最近 workspace。
* workspace 不存在時提供恢復介面。
* 不得因單篇文章損壞而讓整個 app crash。
* 顯示 diagnostics：

  * valid articles
  * warnings
  * invalid files
  * broken links
  * missing assets

## 6.3 User Library

若使用者沒有選擇 repository，允許在：

```text
app.getPath("userData")/library
```

建立可寫的 user library。

需具備 schema version 與 migration framework。

避免 SQLite 或 native module，除非經 ADR 證明有必要。

初始版本可使用：

* Markdown files
* JSON preferences
* JSON／serialized search index
* atomic temp-file writes

理由是降低 Electron native module rebuild 與跨平台 packaging 風險。

---

# 7. Renderer 與 Desktop Product Experience

這不是把網頁縮進視窗。

Desktop app 至少具備下列真正的 desktop 體驗。

## 7.1 Main layout

建議使用：

```text
┌───────────────────────────────────────────────────────────┐
│ Native title/menu/command area                            │
├──────────────┬────────────────────────┬───────────────────┤
│ Navigation   │ Article/Search results │ Reader / Details  │
│              │                        │                   │
└──────────────┴────────────────────────┴───────────────────┘
```

要求：

* Navigation pane 可收合。
* Search results／article list 可調整寬度。
* Reader pane 保持合理行寬。
* 小視窗時自動切換雙欄／單欄。
* 記住 pane sizes。
* 支援全螢幕、最大化與視窗狀態恢復。
* 最小尺寸需經實際 UI 測試決定。
* 不得依賴 hover 才能使用核心功能。

## 7.2 Mandatory navigation

必須有：

* Home
* Research Observatory
* All Articles
* Categories
* Tags
* Timeline
* Reading Stats
* Import Article
* Workspace Diagnostics
* Settings
* About／Build Information

## 7.3 Native menu and shortcuts

至少支援：

| Action                        | Windows/Linux            |
| ----------------------------- | ------------------------ |
| Global search／command palette | `Ctrl+K`                 |
| Focus search                  | `Ctrl+F`                 |
| Open workspace                | `Ctrl+O`                 |
| Import article                | `Ctrl+Shift+I`           |
| Back／forward                  | `Alt+Left` / `Alt+Right` |
| Increase text size            | `Ctrl++`                 |
| Decrease text size            | `Ctrl+-`                 |
| Reset text size               | `Ctrl+0`                 |
| Toggle navigation             | configurable             |
| Reload in development         | development only         |
| Developer tools               | development only         |

正式 production build 不得預設暴露 DevTools menu。

## 7.4 Search

全文搜尋必須：

* 完全離線。
* 支援 title、body、tags、category。
* title 權重最高。
* tags 次之。
* body 次之。
* 支援繁體中文。
* 支援英文。
* 支援中英混合 query。
* 提供 snippet 與 highlight。
* 支援 category／tag／date filters。
* 支援 keyboard navigation。
* 無結果時提供 query feedback。
* 不得每次 keypress 都重新 parse 全部 Markdown。
* index implementation 必須隱藏在 `SearchIndexPort` 後。

選用 MiniSearch、FlexSearch 或其他純 JavaScript engine 前，建立 ADR，比較：

* CJK tokenization
* fuzzy matching
* index size
* serialization
* dependency health
* CSP compatibility
* browser/Electron compatibility

## 7.5 Reader

Article Reader 必須支援：

* Heading hierarchy
* Table of contents
* Anchor navigation
* Back／forward history
* GFM tables
* Task lists
* Footnotes
* Fenced code
* Inline code
* Syntax highlighting
* Copy code
* Images
* Image lightbox
* Local assets
* Internal article links
* External links
* `<details>`／`<summary>`
* Mermaid
* Safe subset of raw HTML
* Reading stats
* Category and tags
* Source path
* Open source location／reveal in folder，在 local workspace 模式下
* Broken-link state
* Missing-asset state

所有 Markdown HTML 必須 sanitize。

不得允許：

* `<script>`
* inline event handlers
* remote executable content
* arbitrary iframe
* embedded remote web application
* `javascript:` URL
* 任意 `file:` URL

## 7.6 Research Observatory

保留並升級目前的「研究觀測站／知識星圖」概念。

目前 Observatory 已有 Canvas、filters、節點與文章導覽概念，不應退化成純裝飾首頁。

新版要求：

* 節點由 content manifest 真實生成。
* 不得硬編碼文章資料。
* category／tag／link 關係可決定節點群組或連線。
* 支援 category filter。
* 支援 tag filter。
* 點選節點顯示 article summary。
* 可進入 article。
* 支援 keyboard navigation。
* 提供非 Canvas 的 accessible list fallback。
* 尊重 `prefers-reduced-motion`。
* reduced-motion 模式停止持續動畫。
* 視窗失焦或頁面不可見時停止 animation loop。
* 不得持續浪費 CPU／GPU。
* 大量文章時採樣、clustering 或 level-of-detail。
* 建立 synthetic 1,000／10,000 article benchmark，避免節點數增加後失效。

---

# 8. Technology Stack

採用：

* Current supported Node.js LTS at implementation time。
* Current stable supported Electron release。
* Electron Forge。
* Forge Vite integration。
* React。
* TypeScript strict mode。
* npm workspaces。
* Vitest。
* React Testing Library。
* Playwright Electron E2E。
* ESLint。
* Prettier。
* Runtime schema validation library，例如 Zod。
* Unified／remark／rehype ecosystem，或經 ADR 證明更適合的 Markdown pipeline。
* Local-only search library，經 ADR 決定。

Electron 官方目前將 Forge 作為整合 packaging 工具推薦，並由 makers 產生各平台安裝格式。

## 8.1 Version policy

不得寫：

```json
"electron": "latest"
```

要求：

* 實作當下查閱官方資料。
* 選擇 current stable supported version。
* 在 `package.json` 使用明確範圍。
* `package-lock.json` 鎖定實際版本。
* ADR 記錄選擇日期與版本。
* Dependabot 每週檢查 npm 與 GitHub Actions updates。
* Electron major update 不得自動合併。
* 每次 major upgrade 必須跑 Windows/Linux packaging smoke tests。

## 8.2 Dependency policy

每個重要 dependency 必須在 ADR 或 dependency inventory 說明：

* 用途
* alternatives
* 是否在 main／preload／renderer
* runtime 或 dev-only
* security surface
* license
* 是否增加 native module
* 是否影響 packaging

原則：

* 優先純 TypeScript／JavaScript。
* 避免 native module。
* 避免 remote CDN。
* 所有資產本機打包。
* 不引入大型 state framework，除非有明確需求。
* 不因為 template 預設就保留無用 dependency。
* 不使用已 deprecated Electron API。

---

# 9. Electron Security Model

Electron security 是 mandatory acceptance gate。

BrowserWindow 至少設定：

```typescript
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    webSecurity: true,
    preload: PRELOAD_PATH,
  },
});
```

Electron 官方 security guidance 要求隔離 Renderer、啟用 sandbox、限制 navigation／new windows、驗證 IPC sender、使用 restrictive CSP，並避免向不可信內容暴露 Electron API。

## 9.1 Preload API

Preload 只能透過 `contextBridge` 暴露明確 API，例如：

```typescript
interface DesktopBridge {
  archive: {
    getManifest(): Promise<Result<ArchiveManifestDto>>;
    getArticle(input: GetArticleInput): Promise<Result<ArticleDto>>;
    search(input: SearchInput): Promise<Result<SearchResultDto[]>>;
  };
  workspace: {
    choose(): Promise<Result<WorkspaceSummaryDto | null>>;
    getCurrent(): Promise<Result<WorkspaceSummaryDto>>;
    diagnose(): Promise<Result<WorkspaceDiagnosticsDto>>;
  };
  import: {
    selectSource(): Promise<Result<ImportSourceDto | null>>;
    preview(input: ImportPreviewInput): Promise<Result<ImportPlanDto>>;
    commit(input: ImportCommitInput): Promise<Result<ImportResultDto>>;
  };
  system: {
    openExternal(input: OpenExternalInput): Promise<Result<void>>;
    revealSource(input: RevealSourceInput): Promise<Result<void>>;
    getBuildInfo(): Promise<Result<BuildInfoDto>>;
  };
}
```

不得暴露：

```typescript
window.electron.ipcRenderer
window.require
window.fs
window.shell
```

## 9.2 IPC contract

建立單一 source of truth：

```text
packages/platform-contracts/src/ipc/
```

要求：

* channel names 集中定義。
* request schema。
* response schema。
* error schema。
* main side validation。
* renderer side response validation。
* IPC sender／frame validation。
* 不接受任意 method name。
* 不接受任意 filesystem path。
* 不把 raw Error stack 傳給 Renderer。
* 不在 IPC payload 中傳遞 class instance。

錯誤統一使用：

```typescript
type Result<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: {
        code: ApplicationErrorCode;
        message: string;
        details?: Record<string, unknown>;
        recoverable: boolean;
      };
    };
```

## 9.3 Navigation and links

* App 使用 secure custom protocol，例如 `app://`。
* 不直接依賴 `file://` 作為主要 renderer protocol。
* 阻擋所有非 app navigation。
* `setWindowOpenHandler` 預設 deny。
* External URL 僅允許明確 schema：

  * `https:`
  * 必要時 `mailto:`
* `http:`、`file:`、`javascript:`、`data:` 預設拒絕。
* External URL 由 main process validate 後使用 `shell.openExternal`。
* 所有 remote resource 預設禁用。

## 9.4 Permissions

對：

* camera
* microphone
* geolocation
* notifications
* MIDI
* USB
* serial
* Bluetooth
* clipboard-read
* screen capture

預設拒絕。

本 app 不應需要上述權限。

## 9.5 CSP

Production CSP 至少達到：

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' app: data:;
font-src 'self';
connect-src 'self';
object-src 'none';
frame-src 'none';
base-uri 'none';
form-action 'none';
```

若 syntax highlighting 或其他 library 需要調整，必須：

* 最小化 allowlist。
* 寫入 security model。
* 建立 CSP test。
* 禁止使用 `unsafe-eval`。

## 9.6 Electron Fuses

研究並在 Forge 中使用官方 Electron Fuses plugin 或等價設定。

至少評估：

* Disable `RunAsNode`
* Disable Node CLI inspect arguments
* Enable cookie encryption
* Enable embedded ASAR integrity validation
* Only load app from ASAR

實際可用 fuse 依所選 Electron 版本驗證，不得照抄過時名稱。

---

# 10. Error Handling、Logging 與 Recovery

建立 application error taxonomy：

```typescript
type ApplicationErrorCode =
  | "CONTENT_INVALID"
  | "ARTICLE_NOT_FOUND"
  | "ASSET_NOT_FOUND"
  | "WORKSPACE_NOT_FOUND"
  | "WORKSPACE_PERMISSION_DENIED"
  | "WORKSPACE_UNSUPPORTED"
  | "IMPORT_CONFLICT"
  | "IMPORT_VALIDATION_FAILED"
  | "IMPORT_WRITE_FAILED"
  | "SEARCH_INDEX_FAILED"
  | "EXTERNAL_URL_REJECTED"
  | "IPC_VALIDATION_FAILED"
  | "INTERNAL_ERROR";
```

要求：

* domain error 不依賴 Electron。
* Renderer 顯示可理解、可恢復的訊息。
* React error boundary。
* Workspace diagnostics page。
* 單篇文章損壞不造成全 app crash。
* index 損壞可重建。
* preferences 損壞可備份後重設。
* 寫入採 atomic temp file／directory strategy。
* unexpected main-process error 寫入本機 log。
* logs 不得包含文章全文、secret、完整敏感 path 或 IPC raw payload。
* 預設無 telemetry。
* 不建立 analytics network request。
* About page 明確說明 app 為 offline-first。

---

# 11. Testing Strategy

不得只測 React component。

必須建立完整測試金字塔。

## 11.1 Unit tests

至少涵蓋：

* YAML front matter parsing
* title extraction
* category inference
* slug generation
* tag normalization
* citation cleanup
* entity cleanup
* image placeholder cleanup
* CJK counting
* Latin／number token counting
* reading time
* path normalization
* path traversal rejection
* symlink escape rejection
* internal link resolution
* asset resolution
* manifest generation
* deterministic manifest sorting
* content hashing
* error mapping
* preference migrations
* URL allowlist
* IPC schemas

## 11.2 Golden／compatibility tests

從現有 corpus 選擇代表性文章建立 fixtures：

* 中英文混合。
* tables。
* footnotes。
* code fences。
* images。
* raw HTML。
* research appendix。
* Mermaid。
* internal links。
* citation markers。
* 長文章。

對每篇驗證：

* title
* date
* category
* tags
* slug
* source path
* word counts
* reading minutes
* headings
* internal links
* assets
* rendered semantic structure

## 11.3 Contract tests

每個 port 必須有 reusable contract test。

例如相同 `ArchiveRepositoryPort` contract test 應能對：

* In-memory adapter
* Bundled archive adapter
* Local filesystem adapter

執行。

## 11.4 Renderer tests

使用 React Testing Library，涵蓋：

* keyboard navigation
* search result selection
* filters
* reader state
* empty state
* diagnostics
* import preview
* import conflict
* theme
* reduced motion
* error boundary
* accessible labels
* focus restoration

## 11.5 Electron E2E

使用 Playwright Electron support。

至少測試：

1. App 啟動。
2. Bundled archive 載入。
3. 搜尋。
4. 開啟文章。
5. Internal navigation。
6. Back／forward。
7. External URL 被 main process 處理。
8. 禁止 app 內 navigation 到 remote URL。
9. `window.process`、`window.require` 不存在。
10. 選擇 test workspace。
11. Import dry run。
12. Import commit。
13. Conflict rollback。
14. Window state restore。
15. Theme restore。
16. Production CSP。

## 11.6 Packaging smoke tests

Windows 與 Linux native runner 都必須：

* 執行 `npm ci`。
* 執行 quality gates。
* 執行 `electron-forge make`。
* 確認預期 artifact 存在。
* 啟動 packaged／unpacked production executable。
* 等待 main window ready signal。
* 確認 bundled archive 可以讀取。
* 正常關閉。

Linux 使用 `xvfb-run`。

不得把「Forge command exit code 0」當作完整 smoke test。

## 11.7 Coverage

最低門檻：

* `packages/domain`：

  * statements 95%
  * branches 90%
* `packages/content-engine`：

  * statements 90%
  * branches 85%
* `packages/application`：

  * statements 90%
  * branches 85%
* Overall：

  * statements 80%
  * branches 75%

UI snapshot coverage 不得拿來取代行為測試。

---

# 12. Performance Budgets

建立可執行 benchmark，不要只寫文件。

## 12.1 Search

對 synthetic 10,000 articles：

* warm query p95 ≤ 100 ms。
* filter update p95 ≤ 100 ms。
* index serialization／deserialization有明確 benchmark。
* search 不阻塞 renderer 超過 50 ms。
* 大型 index 建立需要 worker 或 background execution。

## 12.2 Article

在合理 CI runner baseline：

* 已建立 manifest 的文章開啟 p95 ≤ 200 ms。
* 長文章 UI 不得因同步 syntax highlighting 長時間 freeze。
* Mermaid lazy render。
* Images lazy load。

## 12.3 Observatory

* 常態 animation 接近 60 FPS。
* hidden／unfocused 時停止 loop。
* reduced-motion 時無持續 animation。
* 1,000 articles 不產生 1,000×1,000 的每 frame connection calculation。
* 使用 spatial partition、limited neighbors、precomputed graph 或 clustering。

## 12.4 Startup

建立 startup timing log：

* process start
* app ready
* window created
* renderer ready
* archive ready
* interactive

初始 performance target：

* warm local launch到可互動 ≤ 3 秒，作為 development benchmark。
* CI 不以單一硬性 wall-clock 造成 flaky failure，但必須輸出趨勢與 regression threshold。

## 12.5 Bundle

建立 bundle report。

初始 budget：

* packaged installed footprint 使用寬鬆的 2 GiB hard ceiling；小專案不以積極瘦身為目標，但不得夾帶 repository 私有內容或 secrets/private keys。
* Renderer initial JS 目標 ≤ 2 MB gzip，不含 lazy chunks。
* 不得將整個原始 repository、Python venv、MkDocs dependencies 或測試 fixtures 打入 production package。

若無法達標，必須提供 measurement、原因與 ADR，而不是靜默忽略。

---

# 13. Accessibility

目標為 WCAG 2.2 AA。

至少要求：

* 完整 keyboard 使用。
* 可見 focus ring。
* Skip navigation。
* Semantic headings。
* Reader landmarks。
* Search results 使用適合的 list／option semantics。
* Observatory 有非 Canvas fallback。
* 不使用顏色作為唯一狀態。
* Light／dark theme contrast。
* 200% zoom 可用。
* Text size preference。
* Reduced motion。
* Screen reader 可辨識 category、tags、日期、閱讀時間。
* Import wizard 的 error 與 warning 可被輔助技術讀取。
* 所有 icon 有 accessible name 或正確 `aria-hidden`。
* 對 focus trap、dialog close、Escape behavior 建立測試。

---

# 14. MkDocs 的處置

Electron app 的 runtime 不得依賴 MkDocs。

允許兩種結果：

## Option A：保留為獨立 Web Adapter

若成本合理，可保留 MkDocs／GitHub Pages，條件是：

* 它只是一個獨立 web publishing adapter。
* 與 Electron 共用 canonical Markdown。
* Electron 不載入 MkDocs output。
* Domain rules 不只存在 Python hook。
* Python 與 TypeScript 若暫時並存，必須有 parity tests。
* `main` 的 web deploy 不應被 app branch 無意破壞。

## Option B：在 app branch 淘汰 MkDocs

條件是：

* 所有需保留功能已有 replacement。
* parity matrix 完整。
* 舊 Python tools 的有效功能已由 TypeScript 取代。
* 文件記錄 migration。
* 不刪除 canonical Markdown corpus。
* 不影響 `main` 分支現有 GitHub Pages，除非明確獨立變更。

建立 ADR-0008，比較後做決定。

無論選 A 或 B：

> Electron Renderer 必須是獨立 application，不得渲染 MkDocs build artifact。

---

# 15. Electron Forge Packaging

使用 Electron Forge makers。

Mandatory artifacts：

## Windows x64

```text
research-observatory-<version>-windows-x64-setup.exe
research-observatory-<version>-windows-x64-portable.zip
```

建議：

* Squirrel.Windows installer。
* ZIP portable artifact。

初版不強制 MSIX／AppX／MSI，除非已具備有效 signing certificate 與清楚企業部署需求。

## Linux x64

```text
research-observatory-<version>-linux-x64.deb
research-observatory-<version>-linux-x64.rpm
research-observatory-<version>-linux-x64-portable.zip
```

Flatpak／Snap 可列入後續 ADR，但不應妨礙本次 mandatory deliverables。

## Artifact naming

Forge output 後建立 normalization script：

```text
scripts/ci/normalize-artifacts.mjs
```

輸出到：

```text
dist/release-assets/
```

不得讓正式 Release 出現難以辨識的：

```text
Setup.exe
app.zip
x64.zip
```

每個 artifact 名稱必須包含：

* product
* version
* OS
* architecture
* type

---

# 16. GitHub Actions：Desktop CI

建立：

```text
.github/workflows/desktop-ci.yml
```

Triggers：

```yaml
on:
  pull_request:
    branches:
      - app-main
  push:
    branches:
      - app-main
  workflow_dispatch:
```

## 16.1 Jobs

至少：

### `quality`

Runner：

```text
ubuntu-latest
```

執行：

1. Checkout。
2. Setup Node。
3. `npm ci`。
4. dependency policy validation。
5. formatting check。
6. ESLint。
7. TypeScript typecheck。
8. architecture boundary validation。
9. unit tests。
10. contract tests。
11. coverage。
12. traceability validation。
13. content compatibility tests。
14. production renderer build。
15. npm audit，至少阻擋 high／critical production dependency 問題。

### `e2e`

Matrix：

```text
ubuntu-latest
windows-latest
```

執行：

* build
* Electron E2E
* production security tests
* failure 時上傳 Playwright report、screenshots 與 logs

### `package-smoke`

Matrix：

```text
ubuntu-latest
windows-latest
```

執行：

* Forge make
* artifact normalization
* packaged executable smoke test
* artifact manifest
* SHA-256
* 上傳短期 CI artifacts

## 16.2 Workflow security

要求：

* Workflow-level `permissions: contents: read`。
* 只有真正需要的 job 提升權限。
* 不允許 PR code 取得 release write permission。
* Actions 必須 pin 到 full commit SHA。
* 同一行註解原本對應的 release tag，例如：

```yaml
uses: actions/checkout@<full-commit-sha> # v4.x.x
```

GitHub 將完整 commit SHA 視為 immutable pinning 的方式；release workflow 必須遵循此原則。

* Third-party action 預設禁止。
* 若必要，必須：

  * audit source
  * pin full SHA
  * 記錄 ADR
  * 限制 permissions
* 優先使用：

  * official `actions/*`
  * GitHub CLI
  * repository scripts

---

# 17. GitHub Actions：Manual Desktop Release

建立：

```text
.github/workflows/desktop-release.yml
```

必須只以：

```yaml
on:
  workflow_dispatch:
```

觸發。

GitHub 的手動 Run workflow UI 只有在 workflow file 已存在 default branch 時才會正常提供，因此：

1. 先在 `app-main` 完成此 workflow。
2. 在 `project-docs/release/release-process.md` 明確說明：

   * workflow file 最終需要 merge／cherry-pick 到 default branch `main`。
   * workflow 從 default branch 執行。
   * 透過 `target_ref` checkout `app-main` 或指定 commit。
3. 不得錯誤宣稱只要 workflow 位於 `app-main` 就一定能在 UI 任意執行。

## 17.1 Inputs

至少：

```yaml
inputs:
  target_ref:
    description: Branch, tag, or commit SHA to release
    required: true
    default: app-main

  version:
    description: SemVer version without v prefix
    required: true

  channel:
    description: Release channel
    required: true
    type: choice
    options:
      - stable
      - prerelease
    default: prerelease

  publish:
    description: Publish after all assets are verified
    required: true
    type: boolean
    default: false
```

`publish: false` 代表保留 draft。

## 17.2 Concurrency

```yaml
concurrency:
  group: desktop-release-${{ inputs.version }}
  cancel-in-progress: false
```

避免同版本 release 競爭。

## 17.3 Preflight job

在任何 build 前驗證：

* `target_ref` 存在。
* resolve 成明確 commit SHA。
* version 為合法 SemVer。
* root／desktop package version 與輸入一致。
* stable 版本不得含 prerelease suffix。
* prerelease channel 規則一致。
* tag `v<version>` 不存在，或只存在符合 idempotent retry 的 draft。
* 已發布 release 不得被靜默覆寫。
* working source 有 lockfile。
* changelog／release notes 存在。
* mandatory tests 通過。
* content manifest 可生成。
* 沒有 placeholder。
* license／notices 完整。

## 17.4 Build matrix

Native builds：

```yaml
strategy:
  matrix:
    include:
      - os: windows-latest
        platform: windows
        arch: x64
      - os: ubuntu-latest
        platform: linux
        arch: x64
```

每個 runner：

1. Checkout resolved target SHA。
2. Setup Node。
3. `npm ci`。
4. Run mandatory quality subset。
5. Run packaging。
6. Run packaged-app smoke test。
7. Normalize artifacts。
8. Generate per-platform manifest。
9. Upload GitHub Actions artifact。

不得在 matrix runner 中直接：

* 建立 release。
* publish release。
* 修改 tag。
* 上傳到同一 GitHub Release。

## 17.5 Aggregate job

在所有 build job 成功後，使用單一 Ubuntu job：

1. Download all workflow artifacts。
2. 驗證預期檔案完整。
3. 驗證檔名無衝突。
4. 計算 SHA-256。
5. 產生：

```text
SHA256SUMS.txt
release-manifest.json
sbom.cdx.json
```

6. 驗證 manifest 中的：

   * version
   * commit SHA
   * artifact names
   * sizes
   * SHA-256
   * signed／unsigned
7. 建立 artifact provenance／attestation，若 GitHub public repository 與權限支援。
8. 上傳 aggregate artifact。

## 17.6 Single release job

只有此 job 可以：

```yaml
permissions:
  contents: write
  attestations: write
  id-token: write
```

其他 jobs 保持 read-only。

Release job：

1. 再次確認 target SHA。
2. 建立 tag `v<version>` 指向該 SHA。
3. 建立 GitHub draft release。
4. 上傳所有 assets。
5. 上傳：

   * SHA256SUMS
   * release manifest
   * SBOM
6. 讀回 release assets list。
7. 驗證數量與 checksum manifest 一致。
8. `publish == true` 才發布。
9. prerelease channel 正確設定 prerelease flag。
10. 任一檔案缺失時不得發布。

GitHub immutable release 的建議流程是先建立 draft、附加完整 assets，再發布，因此不得一開始直接建立公開 release。

## 17.7 Idempotency

重新執行相同版本時：

* 若已存在 published release：停止並清楚失敗。
* 若存在 matching draft 且 target SHA 相同：

  * 可安全更新 draft。
  * 先比較現有 assets。
  * 不得保留 stale asset。
* 若 draft target SHA 不同：停止。
* 不得 force-move 已發布 tag。
* 不得靜默刪除 published release。

---

# 18. Signing Policy

## 18.1 Windows

設計 optional code-signing support。

要求：

* secrets 僅存 GitHub Actions Secrets。
* repository 不得包含 certificate。
* signing 未設定時仍可產生 unsigned internal／prerelease build。
* unsigned release 必須在：

  * release notes
  * release manifest
  * About page
    清楚標記。
* stable release 若未簽名，需在文件說明 SmartScreen 影響。
* signing secrets 不得提供給 PR workflow。

## 18.2 Auto-update

本次不要草率加入 auto-update。

Auto-update 必須等：

* stable release URL
* signing policy
* downgrade policy
* rollback policy
* update authenticity
* channel policy

都完成後，另立 ADR 與 spec。

初版可在 About page：

* 顯示版本。
* 顯示 commit。
* 提供經驗證的 GitHub Releases 外部連結。

不得實作未簽名、未驗證的 silent updater。

---

# 19. Documentation for Future Tauri／Other Platforms

`portability-contract.md` 必須回答：

1. 哪些 package 完全 platform-neutral？
2. 哪些 interface 是 platform port？
3. Electron adapter 實作哪些 port？
4. Renderer 是否可以在普通 browser test environment 執行？
5. 若建立 Tauri app，需要替換哪些目錄？
6. 哪些 feature 不得依賴 Electron？
7. Content manifest 如何被其他 shell 使用？
8. IPC DTO 是否與 domain entity 分離？
9. Platform-specific error 如何轉換成 application error？
10. 如何避免 Tauri 分支 fork domain logic？

必須提供如下 migration map：

| Capability         | Shared Package             | Electron Adapter          | Future Tauri Adapter   |
| ------------------ | -------------------------- | ------------------------- | ---------------------- |
| Read archive       | application/content-engine | Node filesystem           | Tauri fs command       |
| Open external link | platform-contracts         | Electron shell            | Tauri opener           |
| Choose workspace   | platform-contracts         | Electron dialog           | Tauri dialog           |
| Preferences        | application                | Electron userData adapter | Tauri app data adapter |
| Search             | search-engine              | shared                    | shared                 |
| Markdown rendering | renderer-ui                | shared                    | shared                 |
| Import transaction | application                | Node filesystem adapter   | Rust/Tauri adapter     |

核心驗收：

> 建立一個純 Node test harness 或 CLI smoke harness，在不啟動 Electron 的情況下，完成 archive scan、search、article read、import preview 與 manifest generation。

這是 platform portability 的實際證明，不是文件聲明。

---

# 20. AGENTS.md 與 LLM Maintenance Playbook

Root `AGENTS.md` 必須短而精確，包含：

1. 專案一句話定義。
2. Source-of-truth reading order。
3. Architecture invariants。
4. 常用 commands。
5. 哪些目錄可修改。
6. 哪些 generated files 不可手改。
7. 新 feature 的正確流程。
8. 新 IPC 的正確流程。
9. 新 dependency 的正確流程。
10. 新 platform adapter 的正確流程。
11. Release 禁忌。
12. 不得做的 anti-patterns。

`project-docs/llm/maintenance-playbook.md` 必須包含：

## 新功能

```text
Requirement → Spec → ADR if needed → Contract → Test → Implementation → Traceability check
```

## Bug fix

```text
Reproduce → Regression test → Root cause → Minimal fix → Full verification
```

## Architecture change

```text
New ADR → Supersede old ADR → Update contract → Update tests → Migrate implementation
```

## IPC change

```text
Schema → Main handler → Preload bridge → Renderer client → Contract tests → Security review
```

## Content parser change

```text
Add real corpus fixture → Verify compatibility → Update parser → Rebuild manifest → Compare parity
```

## Release change

```text
Threat model → Permissions review → Dry run → Draft release → Asset verification → Publish
```

同時列出常見 LLM 失敗模式：

* 誤把 docs corpus 當 architecture docs。
* 在 Renderer 使用 Node。
* 為了快速完成直接載入 MkDocs。
* 在多個 package 複製 Article type。
* 新增 IPC 但沒 schema。
* 修改 manifest format 但沒 bump schema。
* 修改文章統計口徑但沒 compatibility test。
* 寫入 packaged content。
* 讓 release matrix jobs 競爭同一 release。
* 用 tag 名稱而不是 resolved SHA 建立不可追蹤 release。
* 修改 code 卻沒更新 requirement mapping。
* 因測試失敗而 skip。

---

# 21. Required Commands

Root `package.json` 必須提供一致 commands，至少：

```json
{
  "scripts": {
    "dev": "...",
    "build": "...",
    "lint": "...",
    "lint:fix": "...",
    "format": "...",
    "format:check": "...",
    "typecheck": "...",
    "test": "...",
    "test:unit": "...",
    "test:contract": "...",
    "test:renderer": "...",
    "test:e2e": "...",
    "test:coverage": "...",
    "test:security": "...",
    "test:compatibility": "...",
    "validate:architecture": "...",
    "validate:traceability": "...",
    "content:scan": "...",
    "content:manifest": "...",
    "content:diagnose": "...",
    "package": "...",
    "make": "...",
    "make:windows": "...",
    "make:linux": "...",
    "release:assets": "...",
    "benchmark": "...",
    "verify": "..."
  }
}
```

`npm run verify` 必須是本機／CI 的主要完成閘門，至少執行：

* format check
* lint
* typecheck
* architecture validation
* traceability validation
* unit tests
* contract tests
* renderer tests
* security tests
* compatibility tests
* production build

README 必須提供 Windows、Linux、WSL 開發說明。

---

# 22. Implementation Phases

不得一次生成大量 code 再嘗試修到能跑。

依下列 phase 實作，每個 phase 都要有 tests 與可執行產物。

## Phase 0：Baseline

* 完成 archaeology。
* 執行現有 MkDocs build。
* 凍結 corpus baseline。
* 記錄現有 feature。
* 建立 Python word-count／publish behavior fixtures。

## Phase 1：Source of Truth

* Constitution。
* Product spec。
* Architecture。
* Contracts。
* ADR。
* Requirements IDs。
* Traceability framework。
* Detailed implementation plan。

完成自我審查：

* placeholder scan
* contradiction scan
* ambiguity scan
* scope scan
* requirement coverage scan

不要停在此 phase；繼續實作。

## Phase 2：Workspace Bootstrap

* npm workspace。
* TypeScript。
* lint／format。
* Vitest。
* dependency boundaries。
* Forge/Vite。
* minimal secure Electron shell。
* CI quality job。

## Phase 3：Domain and Content Engine

* Article model。
* front matter。
* stats。
* manifest。
* links。
* assets。
* compatibility fixtures。
* content diagnostics。

## Phase 4：Application and Ports

* repositories。
* search。
* preferences。
* workspace。
* import preview／commit。
* error model。
* in-memory adapters。
* Node CLI smoke harness。

## Phase 5：Electron Adapters

* main process。
* secure custom protocol。
* preload bridge。
* IPC validation。
* filesystem adapters。
* dialog。
* shell。
* logging。
* window state。

## Phase 6：Renderer Product

依 vertical slices 完成：

1. App shell。
2. Bundled archive。
3. Article navigation。
4. Reader。
5. Search。
6. Categories／tags／timeline。
7. Reading stats。
8. Observatory。
9. Workspace switch。
10. Import wizard。
11. Diagnostics。
12. Settings／About。

## Phase 7：Packaging

* Windows makers。
* Linux makers。
* artifact normalization。
* packaged smoke。
* resource inclusion。
* production CSP。
* fuse verification。

## Phase 8：CI and Release

* desktop-ci。
* desktop-release。
* permission audit。
* full SHA action pinning。
* native matrix。
* aggregate release。
* SBOM。
* checksums。
* draft/publish behavior。
* release documentation。

## Phase 9：Final Convergence

重新逐條比對：

* constitution
* product spec
* FR/NFR
* parity matrix
* security model
* performance budget
* release process
* portability contract

把任何缺口加入 tasks 並實際完成。

---

# 23. Mandatory Requirement IDs

至少建立並實作以下 requirement。

## Functional

* `FR-001` Bundled offline archive。
* `FR-002` Local workspace selection。
* `FR-003` Article parsing。
* `FR-004` Categories。
* `FR-005` Tags。
* `FR-006` Timeline。
* `FR-007` Full-text search。
* `FR-008` Article reader。
* `FR-009` Reading statistics。
* `FR-010` Internal link navigation。
* `FR-011` Safe external links。
* `FR-012` Image assets and lightbox。
* `FR-013` Code blocks and copy。
* `FR-014` Mermaid。
* `FR-015` Research Observatory。
* `FR-016` Import preview。
* `FR-017` Transactional import commit。
* `FR-018` Workspace diagnostics。
* `FR-019` Preferences。
* `FR-020` Window state。
* `FR-021` Native menus and shortcuts。
* `FR-022` About/build information。
* `FR-023` Windows packaging。
* `FR-024` Linux packaging。
* `FR-025` Manual GitHub Release。
* `FR-026` Release checksums。
* `FR-027` SBOM。
* `FR-028` Draft-before-publish release。
* `FR-029` Node-only platform-neutral smoke harness。
* `FR-030` MkDocs feature parity disposition。

## Non-functional

* `NFR-001` No network dependency for core reading。
* `NFR-002` Electron sandbox。
* `NFR-003` Context isolation。
* `NFR-004` No Node integration in Renderer。
* `NFR-005` Typed and validated IPC。
* `NFR-006` CSP。
* `NFR-007` Navigation protection。
* `NFR-008` Filesystem path protection。
* `NFR-009` Deterministic manifest。
* `NFR-010` Atomic content writes。
* `NFR-011` Accessibility。
* `NFR-012` Reduced motion。
* `NFR-013` Search performance。
* `NFR-014` Observatory scalability。
* `NFR-015` Cross-platform native build。
* `NFR-016` Least-privilege Actions permissions。
* `NFR-017` Full-SHA action pinning。
* `NFR-018` Release idempotency。
* `NFR-019` No secrets in repository。
* `NFR-020` Platform-neutral domain。
* `NFR-021` Traceable requirements。
* `NFR-022` No mandatory runtime Python。
* `NFR-023` No remote CDN。
* `NFR-024` No telemetry by default。
* `NFR-025` Graceful corrupted-content handling。

每個 ID 必須出現在：

* product spec
* requirements.yaml
* acceptance matrix
* 至少一個 test／verification reference

---

# 24. Definition of Done

只有同時符合以下條件才能宣告完成：

## Architecture

* Domain／content／application 不依賴 Electron。
* Renderer 不依賴 Node。
* Electron 只是 platform adapter。
* Node-only harness 能完成核心流程。
* Portability contract 已由實際 test 證明。

## Product

* Bundled archive 可離線瀏覽。
* Search 可用。
* Categories／Tags／Timeline 可用。
* Article Reader 可用。
* Existing content 正確呈現。
* Reading stats 與 baseline 一致。
* Observatory 由資料驅動。
* Local workspace 可用。
* Import preview／commit／rollback 可用。
* Diagnostics 可用。
* Native menus／shortcuts 可用。

## Security

* sandbox enabled。
* contextIsolation enabled。
* nodeIntegration disabled。
* restrictive CSP。
* no unsafe eval。
* navigation blocked。
* external URL allowlist。
* validated IPC。
* permission deny defaults。
* architecture/security tests pass。

## Quality

* `npm ci` 從 clean checkout 成功。
* `npm run verify` 成功。
* Windows E2E 成功。
* Linux E2E 成功。
* Windows Forge make 成功。
* Linux Forge make 成功。
* Packaged executable smoke 成功。
* coverage 達標。
* 無 skipped mandatory tests。
* 無 `TODO`／`TBD`／placeholder。
* 無 unresolved parity entry。

## Release

* CI workflow 完成。
* Manual release workflow 完成。
* Release workflow 的 default-branch limitation 已文件化。
* Windows artifacts 完整。
* Linux artifacts 完整。
* SHA256SUMS 完整。
* SBOM 完整。
* Release manifest 完整。
* Draft-before-publish。
* 單一 aggregate release job。
* Least privilege permissions。
* Actions full SHA pinning。
* Retry/idempotency policy 已測試。

## Documentation

* AGENTS.md。
* Constitution。
* Product spec。
* Architecture。
* Portability contract。
* Content model。
* IPC contract。
* Error model。
* ADRs。
* Parity matrix。
* Testing strategy。
* Security model。
* Performance budgets。
* Release process。
* Traceability。
* LLM maintenance playbook。
* README 更新。

---

# 25. Final Review Protocol

在最終回報前，執行兩次獨立 review。

## Review A：Spec Compliance

使用 fresh-context perspective，逐條回答：

* 每個 FR 是否 implemented？
* 每個 NFR 是否 verified？
* 每個 parity item 是否 addressed？
* 是否有任何 requirement 只有文件、沒有實作？
* 是否有任何測試只測 mock、沒有測 real adapter？
* packaged app 是否實際讀取 packaged resources？
* release workflow 是否真的不會產生競爭？
* workflow_dispatch default-branch 限制是否誠實記錄？
* 是否仍暗中依賴 MkDocs output？
* 是否仍需要 Python 才能啟動 app？
* 是否有 Electron logic 洩漏進 core？

發現缺口時直接修正，不要只列為 known issue。

## Review B：Code Quality and Security

獨立檢查：

* giant files
* duplicated types
* duplicated parsing rules
* unclear names
* hidden side effects
* fragile regex
* unsafe path handling
* unvalidated IPC
* unsafe external URLs
* weak CSP
* unnecessary dependencies
* remote assets
* stale comments
* missing error cases
* flaky tests
* Actions permissions
* unpinned actions
* release race conditions
* non-deterministic artifact names
* missing checksums
* packaged resource path assumptions

Critical／High 問題必須在完成前修正。

---

# 26. Final Response Format

完成後的 final report 必須包含：

## 1. Executive Summary

說明這次重構如何從 MkDocs website 轉為真正的 desktop product。

## 2. Architecture Summary

列出：

* shared core
* Electron adapters
* renderer
* content pipeline
* search
* workspace model
* packaging
* release pipeline

## 3. Changed File Tree

列出重要新增／修改檔案與責任。

## 4. Existing Feature Migration

提供 parity matrix 摘要。

## 5. Verification Evidence

列出實際執行的 commands、exit result 與重要測試數量：

```text
npm ci
npm run verify
npm run test:e2e
npm run make
...
```

不得只寫「tests passed」。

## 6. Artifacts

列出實際生成：

* Windows installer
* Windows portable ZIP
* Linux DEB
* Linux RPM
* Linux portable ZIP
* SHA256SUMS
* SBOM
* release manifest

若 Codex Cloud environment 無法保留某個 native artifact，必須清楚說明哪個 workflow 會生成它，以及哪些部分已在當前環境實際驗證；不得假裝已生成。

## 7. Security Review

列出 Electron security controls 與測試證據。

## 8. Portability Review

解釋未來 Tauri branch 需要替換哪些 adapters，以及哪些 packages 可直接重用。

## 9. Release Instructions

精確說明：

1. workflow file 何時需進入 default branch。
2. 如何手動 trigger。
3. inputs 如何填。
4. draft 如何檢查。
5. 如何 publish。
6. unsigned build 有何提示。

## 10. Remaining Limitations

只列真正無法在當前環境完成的外部限制，例如：

* 缺少 Windows signing certificate。
* GitHub-hosted workflow 尚未由 repository owner 實際點擊執行。
* Stable signing／auto-update 尚未啟用。

不得把本規格中的未完成工作包裝成 limitation。

---

# 最終指令

你不是來建立 Electron demo。

你是在把一個已存在的長文研究 archive，重構為：

* offline-first
* data-driven
* secure
* testable
* Windows/Linux distributable
* release-ready
* future-Tauri-ready
* human-maintainable
* LLM-maintainable

的完整 desktop application。

先理解現有系統，建立 source of truth，定義 contracts，凍結 compatibility baseline，然後完成整個實作與驗證。

**不要用 wrapper 逃避重構。**
**不要用文件逃避實作。**
**不要用 scaffold 逃避產品功能。**
**不要用 CI YAML 的存在逃避實際 packaging smoke test。**
**不要在沒有證據時宣稱完成。**
