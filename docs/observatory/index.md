# Research Observatory

<div class="observatory-shell" data-observatory markdown>
<canvas class="observatory-starmap" aria-label="互動研究星圖"></canvas>
<div class="observatory-node-layer" aria-label="可點選研究節點"></div>
<div class="observatory-noise" aria-hidden="true"></div>
<div class="observatory-scanline" aria-hidden="true"></div>
<div class="observatory-aurora" aria-hidden="true"></div>

<section class="observatory-command" markdown>
<div class="command-copy" markdown>
<span class="eyebrow">Research Observatory / Heavy Visual Mode</span>
# LLM Research Archive 星艦級研究觀測站

這是一個故意不走 small PR 的入口：手刻 Canvas 星圖、可點選研究節點、即時主題濾鏡、任務航線、雷達儀表與資料矩陣。目標是把研究筆記變成一個能探索、能巡航、能展示脈絡的高密度視覺介面。
</div>
<div class="command-deck" aria-label="觀測站狀態">
<div><strong data-observatory-count>12</strong><span>active nodes</span></div>
<div><strong data-observatory-focus>LLM</strong><span>current focus</span></div>
<div><strong>03</strong><span>quest routes</span></div>
</div>
</section>

<section class="observatory-controls" aria-label="研究主題控制台">
<button class="obs-filter is-active" type="button" data-filter="all">All Signals</button>
<button class="obs-filter" type="button" data-filter="llm">LLM</button>
<button class="obs-filter" type="button" data-filter="agents">Agents</button>
<button class="obs-filter" type="button" data-filter="compute">Compute</button>
<button class="obs-filter" type="button" data-filter="carbon">Carbon</button>
<button class="obs-filter" type="button" data-filter="cs">CS</button>
</section>

<section class="display-modes" aria-label="視覺顯示模式">
<button class="display-mode is-active" type="button" data-mode="cinematic">Cinematic</button>
<button class="display-mode" type="button" data-mode="tactical">Tactical</button>
<button class="display-mode" type="button" data-mode="focus">Focus</button>
</section>

<section class="observatory-grid" markdown>
<article class="obs-panel obs-panel--starmap" markdown>
<div class="panel-header" markdown>
<span>01</span>
## Interactive Signal Map
</div>
<p>點選星圖節點會切換右側情報卡；拖曳滑鼠可產生視差航行感。這不是截圖式裝飾，而是實際由資料陣列驅動的 canvas 互動層。</p>
<div class="starmap-hint">Click any glowing node</div>
</article>

<article class="obs-panel obs-panel--intel" markdown>
<div class="panel-header" markdown>
<span>02</span>
## Signal Intelligence
</div>
<div class="intel-card" data-intel-card>
<strong data-intel-title>Agentic AI in constrained environments</strong>
<p data-intel-copy>在受限環境中分析 agentic AI 的能力邊界、系統約束與落地條件。</p>
<ul>
<li><b>Theme</b><span data-intel-theme>Agents</span></li>
<li><b>Energy</b><span data-intel-energy>92</span></li>
<li><b>Route</b><span data-intel-route>LLM → Agents → Evaluation</span></li>
</ul>
<a data-intel-link href="../llm/agentic-ai-constrained-environments-analysis-2024-2026/">Open signal</a>
</div>
</article>

<article class="obs-panel obs-panel--radar" markdown>
<div class="panel-header" markdown>
<span>03</span>
## Research Radar
</div>
<div class="radar-scope" aria-hidden="true">
<div class="radar-sweep"></div>
<i style="--x: 22%; --y: 38%"></i>
<i style="--x: 68%; --y: 26%"></i>
<i style="--x: 78%; --y: 72%"></i>
<i style="--x: 42%; --y: 66%"></i>
</div>
<p>用雷達視覺呈現熱點訊號：LLM、算力、能源與 CS 分類像不同方位的研究回波。</p>
</article>

<article class="obs-panel obs-panel--matrix" markdown>
<div class="panel-header" markdown>
<span>04</span>
## Signal Matrix
</div>
<div class="signal-matrix" aria-hidden="true">
<span></span><span></span><span></span><span></span><span></span><span></span>
<span></span><span></span><span></span><span></span><span></span><span></span>
<span></span><span></span><span></span><span></span><span></span><span></span>
<span></span><span></span><span></span><span></span><span></span><span></span>
</div>
</article>
</section>

<section class="observatory-routes" markdown>
<div class="route-card route-card--primary" markdown>
<span>Quest Alpha</span>
## LLM Deep Space
模型效能 → 算力需求 → agentic AI → 評估框架。適合想從工程與策略面理解 LLM 演化的人。
</div>
<div class="route-card" markdown>
<span>Quest Beta</span>
## Carbon Signal Hunt
容量資料 → 電網條件 → 政策訊號 → 長期能源轉型。把碳排研究變成可追蹤雷達訊號。
</div>
<div class="route-card" markdown>
<span>Quest Gamma</span>
## CS Super Tree Dive
理論 → 系統 → 資料工程 → 安全 → 技術棧。適合把 CS 知識整理成技能地圖。
</div>
</section>


<section class="hologram-lab" markdown>
<div class="holo-stage" aria-hidden="true">
<div class="holo-ring holo-ring--one"></div>
<div class="holo-ring holo-ring--two"></div>
<div class="holo-core">
<span>LLM</span>
<i></i><i></i><i></i><i></i>
</div>
</div>
<div class="holo-copy" markdown>
<span class="eyebrow">Hologram Lab</span>
## 把研究主題投影成一個可巡航的導航核心
這一區刻意做成展示肌肉的視覺模組：旋轉軌道、能量核心、玻璃資訊列與研究任務節奏。它不依賴外部套件，避免 CDN 掛掉時整頁爆炸。
</div>
<div class="telemetry-stack" aria-label="研究遙測資料">
<div><span>Reasoning</span><strong>94%</strong></div>
<div><span>Agentic Ops</span><strong>88%</strong></div>
<div><span>Compute Pressure</span><strong>91%</strong></div>
<div><span>Energy Signals</span><strong>76%</strong></div>
</div>
</section>

<section class="ops-timeline" markdown>
<div class="ops-step" markdown>
<span>Phase 01</span>
### Scan
掃描 LLM、Carbon、CS 三個主題星系，先找出高能量節點。
</div>
<div class="ops-step" markdown>
<span>Phase 02</span>
### Lock
點選星圖或主題濾鏡，鎖定單一研究訊號並更新情報卡。
</div>
<div class="ops-step" markdown>
<span>Phase 03</span>
### Route
沿著 quest route 進入文章，從單篇閱讀變成研究航線。
</div>
<div class="ops-step" markdown>
<span>Phase 04</span>
### Synthesize
用標籤、時間軸與字數儀表板回收脈絡，形成下一輪探索。
</div>
</section>

<script type="application/json" id="observatory-data">
[
  {"id":"agents","title":"Agentic AI in constrained environments","theme":"agents","energy":92,"x":0.22,"y":0.34,"copy":"受限環境中 agentic AI 的能力邊界、系統約束與落地條件。","route":"LLM → Agents → Evaluation","link":"../llm/agentic-ai-constrained-environments-analysis-2024-2026/"},
  {"id":"compute","title":"Why tech giants need more compute","theme":"compute","energy":88,"x":0.66,"y":0.24,"copy":"從大型模型擴張、資料中心與算力供需解釋科技巨頭的 compute appetite。","route":"Scaling → Compute → Infrastructure","link":"../llm/why-tech-giants-need-more-compute-report/"},
  {"id":"local-llm","title":"Local LLM dev performance","theme":"llm","energy":76,"x":0.42,"y":0.58,"copy":"在地 LLM 開發效能、硬體限制與推論體驗的實務觀察。","route":"Local → Performance → Tooling","link":"../llm/local-llm-dev-performance-report/"},
  {"id":"carbon-tw","title":"Taiwan renewable energy capacity","theme":"carbon","energy":81,"x":0.78,"y":0.68,"copy":"台灣再生能源容量、政策與基礎建設訊號整理。","route":"Energy → Capacity → Policy","link":"../carbon/taiwan-renewable-energy-capacity-report/"},
  {"id":"cs-tree","title":"Computer Science Super Tree","theme":"cs","energy":95,"x":0.34,"y":0.78,"copy":"以 CS 超級樹把理論、系統、資料、資安與工程工具組織成知識地圖。","route":"Theory → Systems → Security","link":"../cs/cs-super-tree-report/"},
  {"id":"timeline","title":"Archive timeline","theme":"llm","energy":69,"x":0.54,"y":0.42,"copy":"用時間軸看文章更新與研究訊號如何累積。","route":"Timeline → Posts → Signals","link":"../timeline/"},
  {"id":"tags","title":"Tag cross-index","theme":"cs","energy":64,"x":0.18,"y":0.66,"copy":"以標籤建立跨主題連結，讓不同研究線能互相折返。","route":"Tags → Crosslinks → Discovery","link":"../tags/"},
  {"id":"word-counts","title":"Reading fuel dashboard","theme":"compute","energy":58,"x":0.84,"y":0.38,"copy":"用字數與預估閱讀時間規劃研究 session 的燃料消耗。","route":"Words → Time → Planning","link":"../word-counts/"}
]
</script>
</div>
