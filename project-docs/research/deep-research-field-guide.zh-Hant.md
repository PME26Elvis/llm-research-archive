---
status: canonical
owner: repository-maintainer
language: zh-Hant
research-cutoff: 2026-07-17
source-register: project-docs/research/deep-research-source-register.json
---

# Deep Research 是什麼？名稱、歷史、技術概念與供應商比較

> 本文件是 Research Observatory 未來「說明」功能的中立內容母稿。它不是供應商排名、採購建議或品質保證。所有產品日期、名稱與技術敘述優先取自供應商官方公告；宣傳性敘述會標示為「供應商宣稱」。

## 1. 一句話定義

**Deep Research 類功能，是讓語言模型不只回答一次，而是先規劃研究工作、反覆搜尋或讀取多個來源、根據中途發現修正方向，最後產出具來源連結或引用的長篇整理。**

「Deep Research」不是正式標準，也不是跨公司的共同協定。它更像 2024 年末至 2025 年快速成形的一個產品類別。各家名稱不同：

| 供應商 | 官方功能名稱 | 是否使用完全相同的 Deep Research 品牌 |
| --- | --- | --- |
| Google Gemini | **Deep Research** | 是 |
| OpenAI ChatGPT | **deep research** | 是，官方英文通常使用小寫產品寫法 |
| xAI Grok | **DeepSearch** | 否，屬相近研究代理產品 |
| Anthropic Claude | **Research** | 否，官方名稱較短 |
| DeepSeek | **聯網搜尋 / Web Search**、**深度思考 / DeepThink** | 未找到官方將兩者合併命名為獨立 Deep Research 產品的證據 |

因此，本 repo 使用「Deep Research 類報告」作為方便理解的上位詞，不代表所有文章都由同名產品生成，也不代表不同供應商的功能完全等價。

## 2. 它與一般搜尋、普通聊天、推理模式有何不同？

### 2.1 一般網頁搜尋

一般搜尋的核心任務是根據查詢快速找出相關頁面、摘要或答案。使用者通常仍需自己開啟多個結果、比較衝突資訊、補查缺口並組織報告。

### 2.2 有搜尋工具的普通 LLM 回答

普通聊天模式也可能呼叫搜尋工具，但常見流程仍是「搜尋一次或少量幾次，接著直接回答」。它不一定建立可檢視的研究計畫，也不一定持續回頭修改查詢或完整整理來源。

### 2.3 推理模式、Thinking 或 DeepThink

推理模式通常代表模型在回答前投入更多推理步驟或測試時計算。它可能完全不連網，也可能與搜尋工具搭配。**思考得更久不等於已完成外部資料研究。**

Google 的 Deep Think 與 Gemini Deep Research 是不同產品概念；DeepSeek 的 DeepThink 也不能直接當成 Deep Research 的同義詞。

### 2.4 Deep Research 類研究代理

典型研究代理會把任務展開成較長的工作軌跡：

1. **界定問題**：確認範圍、時間、地區、格式與使用者提供的檔案。
2. **建立計畫**：拆成子問題、候選來源與驗證項目。
3. **多來源檢索**：搜尋網頁、文件、PDF、圖片或已連接的內部資料。
4. **反覆修正**：根據新資訊增加關鍵字、回溯、改查其他方向或處理衝突。
5. **分析與整合**：比較來源、找出共同點、差異、缺口與不確定性。
6. **產出報告**：形成較長篇、具結構的結果，通常附引用、來源連結或 works cited。
7. **後續加工**：部分產品支援匯出、視覺化、Audio Overview、檔案混合研究或連接企業資料。

這是一個產品層抽象。各公司沒有公開所有內部規劃器、搜尋器、排序器、提示詞與模型路由細節，因此不能把這張流程圖當成每家完全相同的實作。

## 3. 近代產品時間線

### 2024 年 12 月 10 日 — DeepSeek 將「聯網搜尋」帶到網頁端

DeepSeek 在 DeepSeek-V2.5-1210 公告中宣布網頁端「聯網搜尋」。官方說明指出，面對複雜問題時，系統會自動抽取多個關鍵字並行搜尋，並深入閱讀大量網頁；當時 API 尚不支援搜尋。

這是本文件五家範圍內很早出現的「多關鍵字、多網頁整合」官方描述，但官方並未把它命名為 Deep Research。[DEEPSEEK-2024-12-10-WEB-SEARCH]

### 2024 年 12 月 11 日 — Google Gemini 推出 Deep Research

Google 向 Gemini Advanced 訂閱者推出 **Deep Research**。官方介面在推出時使用「Gemini 1.5 Pro with Deep Research」。使用者先看到多步驟研究計畫，可以修改或批准；系統接著反覆搜尋與精煉資訊，產出含原始來源連結的完整報告，也可匯出至 Google Docs。

Google 將其描述為結合 agentic system、網頁資訊探索能力、Gemini 推理與一百萬 token context window 的功能。[GOOGLE-2024-12-11-DEEP-RESEARCH]

就本文件限定的五家供應商與可核對官方日期而言，Google 是最早直接使用 **Deep Research** 產品名稱者。

### 2025 年 1 月 15 日 — DeepSeek App 同時列出 Web Search 與 Deep-Think

DeepSeek App 的官方功能清單將 **Web search** 與 **Deep-Think mode** 分開列出，當時 App 由 DeepSeek-V3 驅動。這再次顯示 DeepSeek 的產品語意是「搜尋能力」與「推理模式」並列，而不是一個同名研究代理。[DEEPSEEK-2025-01-15-APP]

### 2025 年 1 月 20 日 — DeepSeek-R1 與 DeepThink

DeepSeek 發布 R1，API 名稱為 `deepseek-reasoner`，網站與 App 可使用 DeepThink。官方技術重點是後訓練階段的大規模強化學習、推理能力與開放權重；這是一項推理模型里程碑，不應被倒寫成獨立 Deep Research 產品發布。[DEEPSEEK-2025-01-20-R1]

### 2025 年 2 月 2 日 — ChatGPT 推出 deep research

OpenAI 在 ChatGPT 推出 **deep research**，描述為可在網路上執行多步驟複雜研究的 agentic capability。推出時由即將發布的 OpenAI o3 早期版本驅動，該版本針對網頁瀏覽與資料分析最佳化。

官方說明包括：

- 搜尋、分析並整合數百個線上來源；
- 處理文字、圖片與 PDF；
- 根據途中資訊調整研究方向；
- 使用瀏覽器與 Python 工具；
- 接受使用者上傳的檔案或試算表；
- 在側欄顯示步驟與來源摘要；
- 通常花費約 5 至 30 分鐘；
- 最終輸出為具引用的報告。

OpenAI 也在推出公告中明確列出早期限制：可能產生幻覺、混淆權威資訊與謠言、信心校準不足，以及引用或格式錯誤。[OPENAI-2025-02-02-DEEP-RESEARCH]

### 2025 年 2 月 19 日 — xAI 在 Grok 3 時期推出 DeepSearch

xAI 的 Grok 3 官方公告推出 **DeepSearch**，並稱其為 xAI 的第一個 agent。Grok 3 模型具網路存取與 code interpreter；官方描述它會查詢缺失背景、動態調整方法、處理互相衝突的事實與意見，最後提供精簡而完整的報告與 summary trace。[XAI-2025-02-19-GROK-3-DEEPSEARCH]

名稱中的 Search 不代表只是單次搜尋；xAI 對它的定位明確是能整合資訊與推理的研究代理。

### 2025 年 3 月 13 日 — Gemini Deep Research 升級至 2.0 Flash Thinking Experimental

Google 宣布 Deep Research 由 Gemini 2.0 Flash Thinking Experimental 強化，涵蓋規劃、搜尋、推理、分析與報告等階段，並擴大至全球使用者免費試用與 45 種以上語言。[GOOGLE-2025-03-13-DEEP-RESEARCH-2-FLASH]

官方說法是介面會在瀏覽時顯示其思路或進度。此類畫面應理解為產品提供的研究進度／推理摘要，不應自動等同於模型完整、原始且未過濾的隱藏 chain-of-thought。

### 2025 年 3 月 19 日 — Gemini 報告加入 Audio Overviews

Google 公布 Deep Research 報告可轉換成 podcast 風格的 Audio Overview，亦可匯出至 Google Docs，引用會進入 works cited 區段。[GOOGLE-2025-03-19-AUDIO-OVERVIEWS]

### 2025 年 4 月 15 日 — Claude 推出 Research

Anthropic 推出官方名稱為 **Research** 的功能，同時介紹 Google Workspace 整合。Research 會在網頁與內部工作情境中進行多次、彼此承接的搜尋，自動探索問題的不同角度，系統化處理未解問題，並在數分鐘內產出附易於檢查引用的完整回答。

推出公告沒有把 Research 明確綁定為一個專用模型名稱。當時 Anthropic 最新公開主力模型是 2025 年 2 月推出的 Claude 3.7 Sonnet，但中立記錄應寫成「推出時期的產品線背景」，不能推論 Research 一定只由該模型執行。

初期 beta 面向美國、日本、巴西的 Max、Team 與 Enterprise；Google Workspace 可串接 Gmail、Calendar 與 Docs，企業文件 cataloging 則使用安全的 retrieval-augmented generation。[ANTHROPIC-2025-04-15-RESEARCH]

### 2025 年 4 月 24 日 — OpenAI 推出輕量版 deep research

OpenAI 公告增加使用配額，並提供由 o4-mini 某個版本驅動的輕量版；當完整版額度用完後可切換至成本較低的版本。這顯示「deep research」是產品模式，背後模型可以隨成本、配額與能力更新，而不是永遠等同於單一模型。[OPENAI-2025-02-02-DEEP-RESEARCH]

### 2025 年 5 月 20 日 — Gemini 可混合公開網路與私人 PDF／圖片

Google 讓 Deep Research 同時使用公開資料與使用者自己的 PDF、圖片，並預告未來可研究 Google Drive 與 Gmail。[GOOGLE-2025-05-20-PRIVATE-SOURCES]

### 2025 年 5 月 28 日 — DeepSeek-R1-0528 強化 DeepThink

DeepSeek 更新 R1，官方稱增加後訓練算力、提升思考深度與推理能力。這是 DeepThink／推理路線的發展，仍應與聯網搜尋分開記錄。[DEEPSEEK-2025-05-28-R1-0528]

### 2025 年 7 月 17 日 — ChatGPT agent 整合視覺化瀏覽器

OpenAI 更新說明指出，deep research 可透過 ChatGPT agent 的視覺化瀏覽器進行更廣、更深的研究；原有 deep research 仍保留在工具選單中。[OPENAI-2025-02-02-DEEP-RESEARCH]

### 2025 年 8 月 21 日 — DeepSeek-V3.1 強化代理與複雜搜尋

DeepSeek-V3.1 將 Think 與 Non-Think 合併為一個 hybrid inference model，官方強調工具使用、agent task 與多步驟複雜搜尋測試的提升。這使 DeepSeek 的搜尋與推理能力更接近同一代理工作流，但官方名稱仍是模型／模式組合，而非獨立 Deep Research 產品。[DEEPSEEK-2025-08-21-V3-1]

### 2026 年 2 月 10 日 — OpenAI deep research 加入 MCP、可信網站限制與可中斷流程

OpenAI 更新允許 deep research 連接 MCP 或 app、把網頁搜尋限制在可信網站、即時追蹤進度，並在執行途中用新提示或來源中斷與修正研究。[OPENAI-2025-02-02-DEEP-RESEARCH]

## 4. 五家產品的中立比較

| 面向 | Gemini Deep Research | ChatGPT deep research | Grok DeepSearch | Claude Research | DeepSeek 相近能力 |
| --- | --- | --- | --- | --- | --- |
| 官方名稱 | Deep Research | deep research | DeepSearch | Research | 聯網搜尋、Web Search、DeepThink／深度思考 |
| 可核對首發日期 | 2024-12-11 | 2025-02-02 | 2025-02-19 | 2025-04-15 | 聯網搜尋 2024-12-10；DeepThink App 2025-01-15；R1 2025-01-20 |
| 首發模型背景 | Gemini 1.5 Pro with Deep Research | early/upcoming OpenAI o3 version | Grok 3 | Research 公告未指定專用模型 | DeepSeek-V2.5-1210 搜尋；DeepSeek-V3 App；DeepSeek-R1 推理 |
| 計畫階段 | 官方明確顯示可修改／批准的多步驟計畫 | 官方描述會規劃多步驟 trajectory | 官方描述動態查缺口與調整方法 | 多次搜尋彼此承接並決定下一步 | 搜尋會抽取多個關鍵字；推理模式另行控制 |
| 來源範圍 | 公開網路；後續私人 PDF／圖片；預告 Drive/Gmail | 公開網路、上傳檔案；後續 app/MCP 與可信網站限制 | 網路與 code interpreter | 網路、Gmail、Calendar、Docs、企業文件 catalog | 網頁搜尋、上傳檔案；工具／搜尋 agent 能力隨模型演進 |
| 典型輸出 | 多頁報告、原始來源、Docs 匯出、Audio Overview | 具引用報告、步驟／來源進度、後續視覺瀏覽器 | concise and comprehensive report、summary trace | 綜合回答、inline／可檢查引用 | 綜合搜尋回答或推理回答；未見統一的獨立研究報告產品定義 |
| 官方公開技術線索 | agentic system、長 context、Thinking model | end-to-end RL、browser、Python、多模態文件 | reasoning + internet + code interpreters | iterative search、Workspace integration、secure RAG | parallel keyword search、reasoner、RL、Think/Non-Think、agent/tool use |

這張表不能用來判定哪一家「最好」。每家公司揭露深度不同，功能、模型、配額、區域與介面也會持續變動。

## 5. 供應商逐項解讀

### 5.1 Google Gemini：最早直接命名的 Deep Research

Gemini 的重要產品特徵是「先提出研究計畫，讓使用者修改或批准」。這將人類介入點放在研究開始前，有助於先校正範圍。之後的演進集中在：

- 更換或升級背後模型；
- 擴大語言與免費試用；
- 顯示研究進度；
- 加入 Audio Overview；
- 混合公開網路與使用者私人來源；
- 支援視覺化報告等更多輸出形式。

應注意 Google Search 後來也使用過 Deep Search 一詞；那是 Google Search／AI Mode 的另一項產品能力，不應和 Gemini Deep Research 混寫。

### 5.2 OpenAI ChatGPT：以代理、工具與長時間任務為核心

OpenAI 的首發說明提供較多訓練與工具線索：使用 end-to-end reinforcement learning 處理困難的瀏覽與推理任務，學習規劃多步驟軌跡、必要時回溯，並使用瀏覽器與 Python。

產品演進顯示兩個方向：

1. **模型路由與成本分層**：從 o3 早期版本到 o4-mini 輕量版，功能名稱不必等同單一模型。
2. **更可控的代理流程**：視覺化瀏覽、MCP/app 來源、可信網站限制、即時進度與中途修正。

官方自己承認的限制應保留在說明中，避免把具有引用的報告誤當成已驗證真相。

### 5.3 xAI Grok：以 DeepSearch 命名的第一個 xAI agent

xAI 把 DeepSearch 放在 Grok 3 的 reasoning-agent 敘事中，重點是：

- 找出缺失背景；
- 動態調整查詢策略；
- 面對衝突事實與意見時進行整合；
- 把結果濃縮為完整但精簡的報告。

官方用語「seek the truth」屬供應商品牌宣稱。中立文件可記錄這項定位，但不能把它改寫成獨立證明的正確率保證。

### 5.4 Anthropic Claude：名稱是 Research，強調內部工作情境

Claude Research 的差異化敘事是把公開網路與工作資料連接在一起。官方案例涵蓋行銷、業務、工程、學生與個人行程；企業 cataloging 使用安全 RAG 建立文件索引。

Research 是 beta 產品功能，不是模型名稱。現行官方說明要求開啟 web search，並提供給付費方案的 web、desktop 與 mobile 使用者。[ANTHROPIC-CURRENT-RESEARCH-HELP]

### 5.5 DeepSeek：不可硬湊成不存在的產品名稱

DeepSeek 的官方歷史提供了三條相鄰但不同的線：

- **聯網搜尋／Web Search**：檢索與多網頁閱讀；
- **DeepThink／深度思考**：較長推理或 thinking mode；
- **R1、V3.1 等模型／agent 能力**：強化推理、工具與複雜搜尋任務。

這些能力可以被組合成類似深度研究的使用體驗，但截至本文件查核日，來源登錄中沒有官方證據顯示 DeepSeek 已把它們正式合併成名為 Deep Research 的獨立產品。

正確寫法是「DeepSeek 的相近能力組合」，而不是「DeepSeek Deep Research」。

## 6. 為什麼這個 repo 需要保存這些報告？

研究代理生成的結果具有時間性：

- 搜尋到的網頁會修改、下架或改 URL；
- 背後模型與工具會更換；
- 同一功能名稱可能改由不同模型驅動；
- 配額、地區、資料來源與介面會變化；
- 引用格式或推理流程會隨產品更新；
- 使用者當時提供的問題、限制與附件會影響結果。

Research Observatory 的價值是把報告、Markdown、圖片、來源線索與時間背景整理成可閱讀、可搜尋、可長期保存的本地資料，而不是保證模型輸出永遠正確。

### Repo 保存的內容

- 使用者決定收錄的研究報告；
- 報告原有結構與可用的來源連結；
- 本地圖片、圖表、程式碼與 Mermaid；
- 日期、標籤、路徑、字數與可搜尋索引；
- 在匯入與發布流程中可保留的 provenance 資訊。

### Repo 不保證的事項

- 引用一定支持相鄰句子；
- 所有來源都具權威性；
- 報告沒有遺漏、偏誤或幻覺；
- 供應商顯示的進度等於完整原始 chain-of-thought；
- 相同 prompt 在未來能得到相同結果；
- 不同供應商的「Deep Research」可直接公平比較；
- 保存報告等同獲得原來源的永久授權或備份權。

## 7. 閱讀一份 Deep Research 報告時的檢查清單

1. **先看日期**：模型、網頁與政策可能已更新。
2. **確認問題範圍**：報告是否真的回答指定地區、年份與條件？
3. **抽查關鍵引用**：來源是否存在？是否支持該句？
4. **區分一手與二手資料**：官方文件、論文、新聞、論壇的證據強度不同。
5. **尋找反例與缺席觀點**：研究代理可能集中在容易搜尋到的來源。
6. **檢查數字口徑**：幣別、名目／實質、期間、樣本、單位是否一致？
7. **辨認供應商宣稱**：模型公司自己的 benchmark 或品質敘述不是獨立驗證。
8. **不要把流暢度當正確性**：完整排版與大量引用仍可能包含推論錯誤。
9. **對高風險用途重新查證**：醫療、法律、金融、安全與學術引用需回到原始權威來源。
10. **保留版本背景**：知道當時使用的產品模式與模型，有助於理解結果差異。

## 8. 編輯與更新規則

- 研究截止日固定顯示在頁首。
- 每個可變動產品事實必須對應 source register ID。
- 官方沒有公布的技術細節不得以確定語氣補完。
- 「第一個」「最強」「領先」等字詞，除非是明確引述且標示為供應商宣稱，否則不使用。
- 沒有獨立 benchmark 設計時，不製作總分或排名。
- 供應商改名、功能合併或停用時，保留歷史名稱與日期，不覆寫歷史。
- Source register 每次更新都應記錄 accessed date。
- UI 可以依 Astro 或 Classic 的設計語言不同，但段落、時間線事件、比較欄位與來源 ID 必須來自同一份 canonical content。

## 9. 主要官方來源

完整 claim scope 與查核日期見 `deep-research-source-register.json`。主要入口：

- Google Gemini Deep Research launch: https://blog.google/products-and-platforms/products/gemini/google-gemini-deep-research/
- OpenAI deep research launch and dated updates: https://openai.com/index/introducing-deep-research/
- xAI Grok 3 and DeepSearch: https://x.ai/news/grok-3
- Anthropic Claude Research: https://claude.com/blog/research
- Anthropic current Research help: https://support.anthropic.com/en/articles/11088861-using-research-on-claude-ai
- DeepSeek web search launch: https://api-docs.deepseek.com/zh-cn/news/news1210
- DeepSeek R1 launch: https://api-docs.deepseek.com/zh-cn/news/news250120/
- DeepSeek V3.1 agent/search evolution: https://api-docs.deepseek.com/zh-cn/news/news250821

## 10. 最後結論

Deep Research 類功能的關鍵，不是單純「回答更長」，而是把語言模型、搜尋／檢索工具、迭代規劃、資料分析與引用報告組成一段較長的代理工作流程。

Google、OpenAI、xAI、Anthropic 在 2024 年末至 2025 年先後把這個概念產品化，分別使用 Deep Research、deep research、DeepSearch 與 Research。DeepSeek 則以聯網搜尋、DeepThink、reasoning model 與 agent/tool 能力逐步靠近相同問題空間，但沒有必要為了表格整齊而替它創造不存在的官方名稱。

這個 repo 保存的是這類研究工作留下的可閱讀成果與歷史脈絡。它的責任是保存、組織、呈現與協助查核，而不是替任何供應商背書，也不是把模型輸出宣告為真相。
