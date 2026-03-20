---
date: 2026-03-20
tags:
  - Computer Science Ontology
  - Tech Stack Mapping
---

# 電腦科學超級樹：全域 CS 分層分類法與互動視覺化實作報告

## 執行摘要

本報告提出一個可落地的「CS 超級樹（super tree）」：以電腦科學為根節點，向下分解為子領域 → 子主題 → 任務/能力 → 技術/框架/套件/模型/工具/技能關鍵字節點，並提供可直接渲染為互動式視覺化的資料格式與完整範例程式。由於真實世界的知識分類往往是「多重父節點」的多層級本體（poly-hierarchy），本報告採用「以樹呈現、以別名/重複節點處理跨域歸屬」的工程折衷方案，能同時支援「學術分類」與「產業技術棧」兩種視角。

分類設計上，參考了：  
- entity["organization","ACM（Association for Computing Machinery）","computing professional org"] 的 2012 CCS（Computing Classification System）作為「CS 子領域骨架」，其本身是可用於語意網應用的多層次/多重父節點分類。  
- entity["organization","IEEE Computer Society","professional society us"] 的 SWEBOK（Software Engineering Body of Knowledge）作為「軟體工程知識面」的結構參照。  
- entity["organization","CNCF（Cloud Native Computing Foundation）","cloud native foundation"] 的 Cloud Native Landscape 作為「雲原生/DevOps/可觀測性」生態的分類參照（其目標即是把雲原生專案/產品以類別組織成地圖）。  

在視覺化方面，報告比較並排序 D3.js、Cytoscape.js、Sigma.js、ECharts、Three.js、Graphviz、Mermaid、vis-network、Observable 等工具，並給出大型圖（large graph）下的渲染與效能取捨：SVG（易客製、但 DOM 成本高）、Canvas（較省 DOM、互動需自行管理）、WebGL（可用 GPU 提升大型網路圖吞吐，但自訂渲染較難）。

> 未指定項（依你的要求明確標註）：目標節點總量上限、節點命名規則是否需雙語/同義詞詞庫、是否需要版本/授權/成熟度標籤、更新頻率與治理流程、是否要把「研究主題」與「工程技術」分兩棵樹或同樹混合、是否需要跨節點關聯（DAG/知識圖譜）而非純樹。以下提供的設計能擴充支援，但具體策略依此處皆視為未指定。

## 範圍與假設

本超級樹輸出以「繁體中文敘述 + 英文技術關鍵字節點」為主，因為多數框架/套件/協定在產業交流中以英文名作為可搜尋關鍵字（keyword node）。輸出包含：概念/能力（如 concurrency、CAP theorem）、工程工具（如 Terraform）、框架/套件（如 Django）、模型族（如 Transformer）、以及可觀測性/資安框架（如 NIST CSF、MITRE ATT&CK）等。

本設計將「樹（tree）」視為主要導覽介面；但承認在嚴格分類學上，像 ACM CCS 本身就是 poly-hierarchy（同一節點可以有多個父概念）。因此工程實作上建議：  
- **以樹作為主導航（primary navigation）**：使用者能快速展開/收合、縮放、搜尋。  
- **以「別名節點」或「重複掛載」處理跨域**：例如 “gRPC” 同時掛在「Networking→RPC」與「Backend→API」；透過 `canonicalId` 或 `sameAs` 欄位在資料層去重。這能在不做 DAG 的前提下保留可用性。

安全與合規面向的分類參考：  
- entity["organization","NIST","us standards institute"] Cybersecurity Framework (CSF) 2.0 提供高層級資安成果（outcomes）的分類語言。  
- entity["organization","MITRE","nonprofit research org"] ATT&CK 是基於真實世界觀測的攻擊技術知識庫，可用於威脅行為分類與防禦對應。  
- entity["organization","OWASP","web security nonprofit"] Top 10 是面向開發者與 Web App Security 的風險共識清單（報告撰寫時網站顯示最新版本為 2025）。  
- entity["organization","Linux Foundation","open source foundation"] 旗下 SPDX 是 SBOM（Software Bill of Materials）等供應鏈風險管理的重要開放標準。  

無障礙（accessibility）原則：互動樹在 UI 意義上接近「Tree View widget」，可參考 entity["organization","W3C（World Wide Web Consortium）","web standards consortium"] 的 ARIA Authoring Practices Treeview Pattern 與 WCAG 2.2。

## 超級樹分類法

以下提供「四層以上」的樹狀分類表。閱讀方式：Level 1（子領域）→ Level 2（子主題）→ Level 3（任務/能力/概念）→ Level 4（可作為節點的關鍵字：技術/框架/套件/模型/工具/協定/技能）。  
此表刻意偏向「可用於技能盤點（skill inventory）與技術地圖渲染」的粒度：同時涵蓋學理（理論/演算法）與工程（雲/DevOps/可觀測性）。分類骨架與命名風格借鑑 ACM CCS、SWEBOK 與 CNCF Landscape 的做法（分層、可延展）。

> 註：表格為「種子分類（seed taxonomy）」；你可用後續提供的 generator 把 Level 4 的逗號分隔關鍵字展開為真正的單一節點，並加上 `id/parentId/type/tags` 等中繼資料，生成數千～數萬節點規模的可渲染資料。

| Level 1（子領域） | Level 2（子主題） | Level 3（任務/能力） | Level 4（關鍵字節點：框架/套件/模型/工具/技能） |
|---|---|---|---|
| Foundations & Theory | Discrete Math | 基礎語言 | set theory、logic、proof、induction、combinatorics、graph theory |
| Foundations & Theory | Complexity | 分析能力 | Big-O、NP-complete、NP-hard、reductions、P vs NP、amortized analysis |
| Foundations & Theory | Information Theory | 測量與界線 | entropy、mutual information、KL divergence、channel capacity |
| Foundations & Theory | Cryptography Theory | 原語 | symmetric crypto、public key crypto、hash function、MAC、AEAD |
| Algorithms | Data Structures | 核心結構 | array、linked list、stack、queue、hash table、heap、tree、trie、B-tree |
| Algorithms | Graph Algorithms | 圖論能力 | BFS、DFS、Dijkstra、Bellman-Ford、A*、MST、topological sort、SCC |
| Algorithms | String Algorithms | 文字/序列 | KMP、suffix array、suffix automaton、rolling hash |
| Algorithms | Optimization | 方法論 | dynamic programming、greedy、backtracking、branch and bound |
| Programming Languages | Language Paradigms | 思維模型 | OOP、FP、imperative、declarative、logic programming |
| Programming Languages | Type Systems | 靜態/動態 | static typing、type inference、generics、dependent types |
| Programming Languages | Compilers | 前端 | lexer、parser、AST、type checker、IR |
| Programming Languages | Compilers | 後端 | LLVM、codegen、register allocation、optimization passes |
| Programming Languages | Runtime Systems | 執行期 | garbage collection、JIT、AOT、bytecode、VM |
| Software Engineering | Requirements | 需求工程 | user stories、use cases、specification、acceptance criteria |
| Software Engineering | Architecture | 架構風格 | monolith、microservices、event-driven architecture、SOA |
| Software Engineering | Architecture | 設計能力 | SOLID、DDD、CQRS、event sourcing、hexagonal architecture |
| Software Engineering | Design Patterns | 模式 | factory、observer、adapter、strategy、dependency injection |
| Software Engineering | Version Control | 基礎操作 | Git、branching、merge、rebase、cherry-pick、GitFlow、trunk-based |
| Software Engineering | Build Systems | 建置 | Make、CMake、Bazel、Gradle、Maven、npm、pnpm、yarn |
| Software Engineering | Code Quality | 靜態分析 | lint、formatter、pre-commit hooks、SonarQube、code review |
| Software Engineering | Documentation | 工程化文檔 | API docs、OpenAPI、Swagger、ADR、RFC、runbook |
| Systems | Operating Systems | 核心概念 | process、thread、context switch、syscall、POSIX、scheduling |
| Systems | Operating Systems | Linux 生態 | Linux kernel、cgroups、namespaces、systemd、eBPF |
| Systems | Memory | 記憶體模型 | virtual memory、paging、TLB、NUMA、memory hierarchy、cache coherence |
| Systems | Concurrency | 同步原語 | mutex、semaphore、RWLock、atomic、lock-free、wait-free |
| Systems | Storage | 檔案系統 | ext4、XFS、ZFS、Btrfs、journaling、copy-on-write |
| Systems | Virtualization | 形態 | hypervisor、KVM、Xen、VMware、containers、unikernel |
| Systems | Performance | 能力 | profiling、benchmarking、flame graph、perf、valgrind、ASan、TSan |
| Networking | Network Fundamentals | 模型 | OSI model、TCP/IP、routing、switching、NAT、VLAN |
| Networking | Protocols | L4/L7 | TCP、UDP、QUIC、HTTP/1.1、HTTP/2、HTTP/3、WebSocket |
| Networking | Security | 加密通道 | TLS、mTLS、PKI、certificate、OCSP |
| Networking | Name & Discovery | 命名 | DNS、service discovery、Consul、etcd |
| Networking | Observability | 網路監測 | tcpdump、Wireshark、pcap、NetFlow、sFlow |
| Distributed Systems | Core Concepts | 理論 | CAP theorem、consensus、availability、partition tolerance |
| Distributed Systems | Consensus | 協定 | Paxos、Raft、Zab |
| Distributed Systems | Data Patterns | 複寫 | replication、sharding、leader election、vector clock |
| Distributed Systems | Messaging | 中介 | Kafka、RabbitMQ、NATS、ZeroMQ、Pub/Sub |
| Distributed Systems | RPC | 介面 | gRPC、Thrift、REST、GraphQL |
| Databases | Relational DB | SQL 能力 | SQL、ACID、transactions、isolation levels、query planner、index |
| Databases | Relational DB | 系統 | PostgreSQL、MySQL、MariaDB、SQLite |
| Databases | NoSQL | Key-Value | Redis、RocksDB、LevelDB |
| Databases | NoSQL | Document | MongoDB、CouchDB |
| Databases | NoSQL | Wide Column | Cassandra、HBase |
| Databases | NoSQL | Graph DB | Neo4j、JanusGraph、TigerGraph |
| Databases | OLAP | Columnar | ClickHouse、DuckDB、Snowflake、BigQuery |
| Databases | Search | Full-text | Elasticsearch、OpenSearch |
| Databases | Time Series | TSDB | InfluxDB、TimescaleDB、VictoriaMetrics |
| Data Engineering | Ingestion | 收集 | CDC、Debezium、Kafka Connect、Fluent Bit |
| Data Engineering | Batch Processing | 批次 | Hadoop、Spark、MapReduce |
| Data Engineering | Stream Processing | 串流 | Flink、Spark Streaming、Kafka Streams |
| Data Engineering | Orchestration | 工作流 | Airflow、Dagster、Prefect、Argo Workflows |
| Data Engineering | Storage Lake | 湖倉 | data lake、Delta Lake、Apache Iceberg、Apache Hudi |
| Data Engineering | Formats | 檔案格式 | Parquet、ORC、Avro、Protobuf |
| Data Engineering | Analytics | 工具 | dbt、Looker、Superset、Metabase |
| AI/ML | ML Fundamentals | 基礎 | supervised learning、unsupervised learning、feature engineering |
| AI/ML | Classical ML | 模型 | linear regression、logistic regression、SVM、XGBoost、LightGBM |
| AI/ML | Deep Learning | 基礎 | backpropagation、optimizer、SGD、Adam、batch norm、dropout |
| AI/ML | Deep Learning | Frameworks | JAX、Keras、ONNX |
| AI/ML | MLOps | 實務 | MLflow、Kubeflow、feature store、model registry |
| AI/ML | Serving | 部署 | TensorRT、TorchServe、Triton Inference Server、FastAPI serving |
| Computer Vision | Vision Basics | 任務 | classification、detection、segmentation、tracking |
| Computer Vision | Vision Libraries | 工具箱 | OpenCV、scikit-image、albumentations |
| Computer Vision | CNN Models | 架構 | VGG、Inception、U-Net、Mask R-CNN |
| Computer Vision | Foundation Models | 趨勢 | ViT、CLIP、SAM（Segment Anything） |
| NLP | NLP Basics | 任務 | tokenization、stemming、NER、POS tagging、parsing |
| NLP | LLM & Transformers | 架構 | Transformer、attention、BERT、T5 |
| NLP | Tooling | 生態 | Hugging Face Transformers、SentencePiece、spaCy、NLTK |
| NLP | Retrieval & RAG | 應用 | vector database、embedding、RAG、BM25 |
| Security | AppSec | Web | authentication、authorization、JWT、OAuth 2.0、OpenID Connect |
| Security | AppSec | 常見風險 | injection、XSS、CSRF、SSRF、security misconfiguration |
| Security | Cloud & Container Security | 能力 | IAM、secret management、KMS、policy as code |
| Security | Threat Modeling | 方法 | STRIDE、attack surface、abuse cases |
| Security | Detection & Response | 框架 | SIEM、SOAR、EDR、MITRE ATT&CK mapping |
| Security | Supply Chain | 標準 | SBOM、SPDX、SLSA、Sigstore、cosign |
| Web | Frontend | UI 架構 | componentization、state management、routing、SSR、CSR |
| Web | Frontend | Build Tooling | Vite、Webpack、Rollup、Babel、TypeScript |
| Web | Frontend | Styling | CSS、Sass、Tailwind CSS、CSS Modules、design system |
| Web | Backend | Frameworks | Django、Flask、FastAPI、Spring Boot、Express、NestJS |
| Web | Backend | API | REST、GraphQL、OpenAPI、gRPC |
| Web | Web Server | Proxy | Apache HTTP Server、Caddy、Traefik |
| Web | Auth & Security | 實作 | session、cookie、CORS、CSRF protection、rate limiting |
| Mobile | Android | Stack | Kotlin、Android SDK、Jetpack Compose、Gradle |
| Mobile | iOS | Stack | Swift、SwiftUI、Xcode、CocoaPods、Swift Package Manager |
| Mobile | Cross-platform | 框架 | Flutter、React Native、Kotlin Multiplatform |
| Cloud & DevOps | Containers | 基礎 | container image、OCI、Docker、containerd、CRI-O |
| Cloud & DevOps | Orchestration | 平台 | Kubernetes、Helm、Kustomize |
| Cloud & DevOps | Service Mesh | 流量治理 | Istio、Linkerd、Envoy |
| Cloud & DevOps | CI/CD | 平台 | Jenkins、GitLab CI、GitHub Actions、Argo CD、Flux |
| Cloud & DevOps | Infrastructure as Code | IaC | Terraform、Pulumi、CloudFormation、Ansible |
| Cloud & DevOps | Release Engineering | 策略 | blue-green deployment、canary、feature flags、rollback |
| Testing | Unit Testing | 基礎 | test doubles、mock、stub、TDD |
| Testing | Frameworks | 常用 | pytest、JUnit、TestNG、Go test、RSpec |
| Testing | E2E Testing | 瀏覽器 | Playwright、Cypress、Selenium |
| Testing | Performance Testing | 壓測 | k6、JMeter、Locust |
| Monitoring & Observability | Metrics | 指標 | PromQL、alerting rules、SLO、SLI、error budget |
| Monitoring & Observability | Logging | 日誌 | structured logging、Logstash、Fluentd、Fluent Bit |
| Monitoring & Observability | Tracing | 追蹤 | distributed tracing、span、trace context |
| Monitoring & Observability | Open Standards | 觀測標準 | OpenTelemetry、OTLP |
| Monitoring & Observability | Dashboards | 視覺化 | Grafana、Kibana、OpenSearch Dashboards |
| Robotics | Robotics Frameworks | 中介層 | ROS 2、DDS |
| Robotics | Perception | 感知 | sensor fusion、point cloud、Open3D、PCL |
| Robotics | SLAM | 定位建圖 | EKF SLAM、ORB-SLAM、RTAB-Map |
| Robotics | Control | 控制 | PID、MPC、Kalman filter、trajectory planning |
| Embedded & IoT | Microcontrollers | 平台 | ARM Cortex-M、ESP32、Arduino |
| Embedded & IoT | RTOS | 系統 | FreeRTOS、Zephyr、RTEMS |
| Embedded & IoT | Protocols | 物聯網 | MQTT、CoAP、BLE、Zigbee、CAN bus |
| HCI | UX Research | 方法 | usability testing、A/B testing、heuristic evaluation |
| HCI | Accessibility | 規範 | WCAG、ARIA、keyboard navigation、screen reader |
| Graphics | Rendering | API | OpenGL、Vulkan、WebGPU、DirectX |
| Graphics | Real-time 3D | Web | WebGL、Three.js |
| Graphics | Game Dev | Engines | Unity、Unreal Engine、Godot |
| Data Visualization | Charting | Libraries | D3.js、ECharts、Vega、Observable Plot |
| Knowledge Representation | Ontologies | 結構 | taxonomy、ontology、knowledge graph、RDF、OWL |
| Knowledge Representation | Graph Formats | 交換格式 | JSON、GraphML、GEXF、DOT |

為了讓這棵樹能「更像知識地圖，而不只是清單」，建議你在節點中補上以下中繼資料（本次需求未指定，但強烈建議）：  
- `type`: concept / skill / tool / library / framework / model / protocol / standard  
- `tags`: 語言（Python/JS/Go）、層級（L2/L3/L4）、用途（training/serving）、成熟度（experimental/stable）、部署形態（cloud/on-prem/edge）  
- `sameAs`: 指向 canonicalId，避免多處掛載造成搜尋與統計重複  
- `source`: 官方文件/標準/landscape 的引用（可追溯性）

上述結構能直接映射到 ACM CCS（學術分類的「主幹」）與 CNCF Landscape（雲原生工具的「枝葉」），因而有利於之後自動擴充（例如把 Landscape 上的每個專案作為節點）。

## 視覺化與渲染策略

互動式「超級樹」常見的視覺化形態可分成三類：  
- **樹（Tree）**：最適合層級導覽（expand/collapse），使用 tidy tree 或 radial tree。D3 的 `d3-hierarchy/tree` 實作 tidy tree（Reingold–Tilford tidy algorithm，並引用 Buchheim 等人的線性時間改良），非常適合你的「多層級階層樹」需求。  
- **網路（Graph/Network）**：更適合表達「跨域連結」與「多重父節點」（如知識圖譜）。Cytoscape.js 與 Sigma.js 在互動手勢（縮放/拖拽/選取）與大量節點上較有優勢，且已有朝 WebGL 加速的路徑。  
- **混合（Hybrid）**：以樹作主導覽，並在選中節點時疊加「相關邊（cross-links）」或切換到 network 視圖，兼顧可讀性與真實關係。

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["D3 collapsible tree visualization example","radial tree diagram D3 hierarchy","force-directed graph WebGL sigma.js example","Three.js 3D force directed graph visualization"],"num_per_query":1}

### 版面與美術建議

若你的目標是「視覺衝擊力 + 可長期維護」，建議採以下設計語言（多數可在 D3/Cytoscape/Three.js 落地）：

**佈局（layout）**  
- **頂層用 radial tree**：Level 1 子領域呈放射狀，能在初始視圖同時呈現多領域輪廓（適合 “CS 全景圖”）。  
- **子樹用 tidy tree（左右或上下）**：點選某個領域後，切到水平/垂直 tidy tree，更利於閱讀長標籤與多層深度。D3 tree layout 是典型選擇。  
- 對巨大節點數：提供「摘要層（roll-up）」與「按需展開（lazy expand）」；先顯示 Level 1–2，搜尋或點擊才載入更深層。

**色彩（color scheme）**  
- 以 Level 1 子領域做主色（10–16 色以內），其餘用亮度/透明度區分深度（depth）。  
- 為無障礙：避免只用顏色傳達狀態（例如「命中搜尋」也要加外框/光暈/粗體）。WCAG 2.2 鼓勵涵蓋多種障礙族群需求。  

**圖示（icons）**  
- 為 `type` 配圖示：  
  - protocol：鏈結/訊號圖標  
  - framework/library：積木圖標  
  - model：腦/網路圖標  
  - tool：扳手圖標  
- 圖示請加 `aria-label` 或可讀文字替代（避免純裝飾造成理解斷裂）。ARIA 與 APG 提供模式設計參考。  

### 渲染技術路線與小段範例

以下提供四種代表性渲染路線（每段僅示意核心 API）：

**可收合樹（Collapsible Tree, SVG）— D3**  
- 優點：最能做「漂亮又可控」的超級樹導覽；`d3-zoom` 可提供滑鼠、觸控板、觸控縮放/平移，且對 DOM 類型（HTML/SVG/Canvas）相對不綁死。  

**力導圖（Force-Directed, Canvas/WebGL）— Sigma / Cytoscape / ForceGraph**  
- 優點：適合跨連結很多的知識圖譜視角；Sigma.js 明確以 WebGL 渲染節點/邊並說明其適合較大圖（代價是自訂渲染更難）。  
- Cytoscape.js 具備 pinch-to-zoom、panning、box selection 等常用手勢；且已有推出 WebGL renderer preview 以提升大型網路效能的方向。  

**Radial Tree（放射樹）— D3 或 ECharts**  
- ECharts 官方示例頁面提供 tree 的多方向與 radial tree 範例集合，且其引擎可在 Canvas/SVG 間切換並支援 progressive rendering/stream loading。  

**3D WebGL（展示型）— Three.js / 3d-force-graph**  
- Three.js 是通用 JavaScript 3D library，主要以 WebGL/WebGPU renderer 為核心。  
- 3d-force-graph 是基於 ThreeJS/WebGL 的 3D 力導向元件（可快速做 3D 知識宇宙視覺）。  

## 工具與套件優先順序

此處給出「實作互動超級樹」的優先順序（偏向你要求的：縮放、平移、展開/收合、搜尋、tooltip、可做視覺衝擊），並補上大量節點時的效能與落地成本。

### 優先清單與比較

| 優先 | 工具 | 最適用視圖 | 渲染核心 | 優點 | 代價/風險 | 大圖效能備註 |
|---:|---|---|---|---|---|---|
| 1 | D3.js | Collapsible / Tidy / Radial Tree | SVG/Canvas（自選）+ d3-hierarchy + d3-zoom | 極度客製、精細互動、能做「高端資訊設計」；tree layout 與 zoom 行為成熟 | 工程量高（你要自己做很多 UI/狀態管理） | SVG 節點太多會吃 DOM；可改 Canvas 或分層載入 |
| 2 | Cytoscape.js | Network / 混合圖 | Canvas（主）+ WebGL（預覽/選配） | 互動手勢開箱即用（pinch-to-zoom, panning, box selection）；支援分析與事件鉤子 | 樣式與佈局客製需要熟悉其 model | 3.31 起 WebGL renderer preview 對大網路效能有幫助 |
| 3 | Sigma.js | 大型 Force Graph | WebGL | 明確以 WebGL 渲染節點與邊；官方指出較大圖更快，但自訂渲染更難 | 不如 D3 適合樹狀語意（需自己做 tree layout 或轉 network） | 擅長數千～更多節點的網路視角（依硬體而定） |
| 4 | Apache ECharts | 快速 Tree/Graph 圖表 | Canvas 或 SVG | 內建多種圖表；可切渲染器；官方提到 progressive rendering/stream loading，可到「千萬級資料」視覺化場景 | 高度客製（例如複雜收合策略/自定義交互）可能受限於框架設計 | 適合「快做」與報表型互動；tree 例子齊全 |
| 5 | Three.js | 3D 宇宙視覺（展示/探索） | WebGL/WebGPU | 3D 效果最好、可做沉浸式；生態成熟 | 需要自行處理文字、拾取、UI；可用 3d-force-graph 加速 | WebGL 擅長大量 sprites/點，但標籤/可讀性是挑戰 |
| 6 | Graphviz | 靜態排版（產圖/初始 layout） | DOT → 多種輸出格式 | 強大的 layout engine；dot 可輸出 SVG/PNG/PDF 等 | 互動弱；大型圖互動需轉其他工具 | 適合「生成靜態總覽圖」或提供初始座標 |
| 7 | Mermaid | 文件型樹/流程圖 | SVG（多平台整合） | Markdown-like 定義；適合規格文件與版本控；Live editor 支援匯出 PNG/SVG/Markdown | 樹狀超大資料會吃力；互動受限 | 適合「小～中型」示意圖、docs-first |
| 8 | vis-network | 較快上手的 Network | Canvas | API 相對直覺、互動功能完整；doc 強調支援自訂樣式 | 生態與可擴展性不如 Cytoscape/D3 | 中型圖適用；極大圖仍需技巧 |
| 9 | Observable Notebooks/Framework | 原型/分享/教學 | 依用到的庫 | 可把文字、程式、視覺化整合在 notebook；適合展示與迭代 | 不是圖形引擎本體 | 適合研發與 demo；production 仍建議前端專案 |

結論（優先策略）：  
- **若你的主產品形態是「可導覽的階層樹」**：首選 D3.js（你要的 zoom/pan/collapse/search/tooltip 最可控）。  
- **若你希望「樹 + 跨連結」形成知識圖譜探索**：以 D3（樹）+ Cytoscape/Sigma（網路視角）做雙視圖或分頁。  
- **若你想很快做出可交付的互動圖表**：ECharts tree/graph + 既有 UI 套件最快。  

## 資料格式與產生器設計

你要求的輸出需要同時支援：階層樹（tree）、節點屬性（type/tags）、以及未來可能的跨連結（graph edges）。因此建議同時維護兩種視角的資料：

1) **Hierarchy JSON（渲染樹）**：用於 D3 `d3.hierarchy` 或 ECharts tree。  
2) **Node/Edge list（渲染網路/跨連結）**：用於 Cytoscape/Sigma/3D force graph。  
3) **交換格式（GraphML / GEXF / DOT）**：方便與 Gephi、NetworkX、Graphviz 等互通。

### JSON 範例

（示意：一個節點含 `name/type/tags/children`；可加 `id` 與 `canonicalId`）

```json
{
  "id": "cs",
  "name": "Computer Science",
  "type": "root",
  "children": [
    {
      "id": "cs.ml",
      "name": "AI/ML",
      "type": "domain",
      "children": [
        {
          "id": "cs.ml.dl",
          "name": "Deep Learning",
          "type": "subcategory",
          "children": [
            { "id": "kw.pytorch", "name": "PyTorch", "type": "framework", "tags": ["python","dl"] },
            { "id": "kw.tensorflow", "name": "TensorFlow", "type": "framework", "tags": ["python","dl"] }
          ]
        }
      ]
    }
  ]
}
```

### GraphML

GraphML 是圖形資料的 XML 格式，官方描述其為「comprehensive and easy-to-use file format for graphs」，並提供可擴充機制；GraphML primer 也提到它支援 nested graphs（可表達階層）。  

最小骨架示意（node/edge + 可加 data key）：

```xml
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="d0" for="node" attr.name="type" attr.type="string"/>
  <graph id="G" edgedefault="directed">
    <node id="cs"><data key="d0">root</data></node>
    <node id="cs.ml"><data key="d0">domain</data></node>
    <edge id="e1" source="cs" target="cs.ml"/>
  </graph>
</graphml>
```

### GEXF

GEXF（Graph Exchange XML Format）用於描述複雜網路結構與其資料/動態；Gephi 文件指出它也支援階層結構與視覺化模組（viz）等中繼資料。  

### 產生器腳本設計

建議你用「可讀的原始來源格式」維護 taxonomy（例如 YAML/Markdown 表格/CSV），再自動生成 JSON/GraphML/GEXF：

**資料治理建議（未指定，但關鍵）**  
- 每個關鍵字節點必須有穩定 `id`（不要用顯示名稱當 id，避免改名破壞連結）。  
- 每個節點可有 `aliases`（同義詞、縮寫）與 `canonicalId`（正規化）。  
- 若同一技術跨域出現，用 `sameAs` 指向 canonicalId，並在渲染層決定「顯示為別名節點」或「顯示為參照連結」。

**Python 產生器（大綱）**  
- 讀入 taxonomy（例如 YAML：`domain/subdomain/area/keywords[]`）  
- 生成：
  - `tree.json`（children 結構）  
  - `graph.json`（nodes/edges，含 cross-links）  
  - `taxonomy.graphml`、`taxonomy.gexf`（透過 NetworkX 或自行模板）  

NetworkX 文件同時提供 GraphML/GEXF 讀寫介面參考，適合做交換格式輸出。  

## 可直接複製貼上的互動範例

以下是一個「單一 HTML 檔」的 D3 collapsible tree 實作，包含：  
- **Zoom / Pan**（滑鼠滾輪縮放、拖曳平移）  
- **Collapse / Expand**（點節點收合/展開）  
- **Search**（搜尋命中會自動展開路徑並高亮）  
- **Tooltips**（滑過顯示節點資訊與完整路徑）  

此範例以 D3 的 tree layout（tidy tree）與 d3-zoom 為核心；tree layout 與 zoom 的官方文件可作為你擴充功能（例如限制縮放範圍、程式化導覽）的依據。  

> 未指定項提示：此範例用 CDN 載入 D3（未指定離線需求）。若要離線，請把 d3.min.js 下載到本地並改 script src。

```html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>CS 超級樹（D3 Collapsible Tree）</title>
  <style>
    :root{
      --bg: #0b1020;
      --panel: rgba(255,255,255,0.06);
      --text: rgba(255,255,255,0.92);
      --muted: rgba(255,255,255,0.65);
      --line: rgba(255,255,255,0.20);
      --hit: #ffd166;
      --node: rgba(255,255,255,0.85);
      --node2: rgba(255,255,255,0.55);
      --focus: #7bdff2;
    }
    html, body { height: 100%; margin: 0; background: radial-gradient(1200px 800px at 20% 10%, #172554 0%, var(--bg) 55%, #050816 100%); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;}
    .shell { height: 100%; display: grid; grid-template-rows: auto 1fr; }
    .topbar {
      display: flex; gap: 12px; align-items: center;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
      backdrop-filter: blur(10px);
    }
    .brand { font-weight: 700; letter-spacing: 0.2px; }
    .hint { color: var(--muted); font-size: 12px; }
    .controls { margin-left: auto; display: flex; gap: 8px; align-items: center; }
    input[type="search"] {
      width: min(420px, 45vw);
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.14);
      color: var(--text);
      padding: 10px 12px;
      border-radius: 12px;
      outline: none;
    }
    input[type="search"]::placeholder { color: rgba(255,255,255,0.45); }
    button {
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.16);
      color: var(--text);
      padding: 10px 12px;
      border-radius: 12px;
      cursor: pointer;
    }
    button:hover { background: rgba(255,255,255,0.14); }
    .canvasWrap { position: relative; overflow: hidden; }
    svg { width: 100%; height: 100%; display: block; }
    .tooltip {
      position: absolute;
      pointer-events: none;
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 120ms ease, transform 120ms ease;
      background: rgba(0,0,0,0.75);
      border: 1px solid rgba(255,255,255,0.18);
      color: var(--text);
      padding: 10px 12px;
      border-radius: 12px;
      max-width: min(520px, 70vw);
      font-size: 12px;
      line-height: 1.35;
      box-shadow: 0 12px 30px rgba(0,0,0,0.35);
      backdrop-filter: blur(6px);
    }
    .tooltip .k { color: rgba(255,255,255,0.62); display: inline-block; width: 88px; }
    .legend {
      position: absolute;
      left: 14px; bottom: 14px;
      background: var(--panel);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      padding: 10px 12px;
      font-size: 12px;
      color: var(--muted);
      backdrop-filter: blur(10px);
    }
    .legend b { color: var(--text); }
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.80);
      margin-right: 6px;
    }

    /* D3 styles */
    .link { fill: none; stroke: var(--line); stroke-width: 1.2; }
    .node circle { stroke: rgba(0,0,0,0.35); stroke-width: 1.2; }
    .node text { font-size: 12px; fill: rgba(255,255,255,0.88); paint-order: stroke; stroke: rgba(0,0,0,0.35); stroke-width: 3px; stroke-linejoin: round;}
    .node.depth0 text { font-size: 15px; font-weight: 700; }
    .node.depth1 text { font-size: 13px; font-weight: 650; }
    .node.hit circle { fill: var(--hit) !important; }
    .node.hit text { fill: rgba(255,255,255,0.98); }
    .node.path circle { fill: var(--focus) !important; }
    .node.path text { fill: rgba(255,255,255,0.98); }
  </style>
</head>
<body>
  <div class="shell">
    <div class="topbar">
      <div>
        <div class="brand">CS 超級樹（可收合、可搜尋、可縮放）</div>
        <div class="hint">操作：滑鼠滾輪縮放、拖曳平移、點節點展開/收合；搜尋會自動展開命中路徑。</div>
      </div>
      <div class="controls">
        <input id="q" type="search" placeholder="搜尋節點：例如 kubernetes、database、security、resnet…" />
        <button id="btnClear" title="清除搜尋">清除</button>
        <button id="btnReset" title="重置視圖與摺疊狀態">重置</button>
      </div>
    </div>

    <div class="canvasWrap" id="wrap">
      <svg id="svg" role="img" aria-label="Computer Science taxonomy tree"></svg>
      <div class="tooltip" id="tip"></div>
      <div class="legend">
        <div><b>圖例</b></div>
        <div style="margin-top:6px">
          <span class="badge">●</span>一般節點
          <span class="badge" style="border-color: rgba(255,209,102,0.5);">●</span>搜尋命中
          <span class="badge" style="border-color: rgba(123,223,242,0.45);">●</span>命中路徑
        </div>
      </div>
    </div>
  </div>

  <!-- D3 v7 -->
  <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
  <script>
    // ===== 1) Sample taxonomy (you can replace this with your generated full taxonomy) =====
    const data = {
      name: "Computer Science",
      type: "root",
      children: [
        { name: "Systems", type: "domain", children: [
          { name: "Operating Systems", type: "subcategory", children: [
            { name: "process / thread / scheduling", type: "skill", children: [
              { name: "Linux kernel", type: "keyword" },
              { name: "systemd", type: "keyword" },
              { name: "cgroups", type: "keyword" }
            ]},
            { name: "memory / concurrency", type: "skill", children: [
              { name: "virtual memory", type: "keyword" },
              { name: "mutex", type: "keyword" },
              { name: "lock-free", type: "keyword" }
            ]}
          ]},
          { name: "Virtualization", type: "subcategory", children: [
            { name: "containers", type: "skill", children: [
              { name: "Docker", type: "keyword" },
              { name: "containerd", type: "keyword" }
            ]},
            { name: "hypervisors", type: "skill", children: [
              { name: "KVM", type: "keyword" },
              { name: "Xen", type: "keyword" }
            ]}
          ]}
        ]},

        { name: "Networking & Distributed", type: "domain", children: [
          { name: "Protocols", type: "subcategory", children: [
            { name: "L4/L7", type: "skill", children: [
              { name: "TCP", type: "keyword" },
              { name: "QUIC", type: "keyword" },
              { name: "HTTP/2", type: "keyword" },
              { name: "TLS", type: "keyword" }
            ]},
            { name: "Name & Discovery", type: "skill", children: [
              { name: "DNS", type: "keyword" },
              { name: "service discovery", type: "keyword" }
            ]}
          ]},
          { name: "Messaging", type: "subcategory", children: [
            { name: "event streaming", type: "skill", children: [
              { name: "Kafka", type: "keyword" },
              { name: "RabbitMQ", type: "keyword" }
            ]}
          ]}
        ]},

        { name: "Databases", type: "domain", children: [
          { name: "Relational", type: "subcategory", children: [
            { name: "SQL / transactions", type: "skill", children: [
              { name: "PostgreSQL", type: "keyword" },
              { name: "MySQL", type: "keyword" }
            ]}
          ]},
          { name: "NoSQL & Search", type: "subcategory", children: [
            { name: "key-value / document", type: "skill", children: [
              { name: "Redis", type: "keyword" },
              { name: "MongoDB", type: "keyword" }
            ]},
            { name: "full-text search", type: "skill", children: [
              { name: "Elasticsearch", type: "keyword" },
              { name: "OpenSearch", type: "keyword" }
            ]}
          ]}
        ]},

        { name: "Cloud / DevOps / Observability", type: "domain", children: [
          { name: "Orchestration", type: "subcategory", children: [
            { name: "cluster management", type: "skill", children: [
              { name: "Helm", type: "keyword" },
              { name: "Kustomize", type: "keyword" }
            ]}
          ]},
          { name: "Infrastructure as Code", type: "subcategory", children: [
            { name: "provisioning", type: "skill", children: [
              { name: "Terraform", type: "keyword" },
              { name: "Ansible", type: "keyword" }
            ]}
          ]},
          { name: "Observability", type: "subcategory", children: [
            { name: "metrics / tracing / logs", type: "skill", children: [
              { name: "OpenTelemetry", type: "keyword" },
              { name: "Grafana", type: "keyword" },
              { name: "Jaeger", type: "keyword" }
            ]}
          ]}
        ]},

        { name: "AI/ML", type: "domain", children: [
          { name: "Deep Learning", type: "subcategory", children: [
            { name: "frameworks", type: "skill", children: [
              { name: "JAX", type: "keyword" },
              { name: "Keras", type: "keyword" },
              { name: "ONNX", type: "keyword" }
            ]}
          ]},
          { name: "Computer Vision", type: "subcategory", children: [
            { name: "models", type: "skill", children: [
              { name: "U-Net", type: "keyword" },
              { name: "Mask R-CNN", type: "keyword" }
            ]},
            { name: "tooling", type: "skill", children: [
              { name: "OpenCV", type: "keyword" }
            ]}
          ]}
        ]},

        { name: "Security", type: "domain", children: [
          { name: "AppSec", type: "subcategory", children: [
            { name: "auth / threats", type: "skill", children: [
              { name: "OAuth 2.0", type: "keyword" },
              { name: "JWT", type: "keyword" },
              { name: "XSS", type: "keyword" },
              { name: "SSRF", type: "keyword" }
            ]}
          ]},
          { name: "Supply Chain", type: "subcategory", children: [
            { name: "SBOM", type: "skill", children: [
              { name: "SPDX", type: "keyword" },
              { name: "Sigstore", type: "keyword" }
            ]}
          ]}
        ]}
      ]
    };

    // ===== 2) D3 Collapsible Tree with zoom/pan, search and tooltips =====
    const wrap = document.getElementById('wrap');
    const svg = d3.select('#svg');
    const tip = document.getElementById('tip');

    const margin = { top: 24, right: 60, bottom: 24, left: 60 };
    let width = wrap.clientWidth;
    let height = wrap.clientHeight;

    // Root group (for zoom transform)
    const gZoom = svg.append("g").attr("class", "zoomRoot");
    const gLinks = gZoom.append("g").attr("class", "links");
    const gNodes = gZoom.append("g").attr("class", "nodes");

    const zoom = d3.zoom()
      .scaleExtent([0.15, 2.5])
      .on("zoom", (event) => gZoom.attr("transform", event.transform));

    svg.call(zoom);

    function resize() {
      width = wrap.clientWidth;
      height = wrap.clientHeight;
      svg.attr("viewBox", [0, 0, width, height]);
      update(root); // recompute layout on resize
    }
    window.addEventListener('resize', resize);

    const treeLayout = d3.tree().nodeSize([26, 190]); // [x,y] spacing
    const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

    const root = d3.hierarchy(data);
    root.x0 = height / 2;
    root.y0 = 0;

    // Collapse deeper levels initially
    root.children?.forEach(collapseDeep);
    function collapseDeep(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapseDeep);
        d.children = null;
      }
    }

    // Center initial view
    svg.attr("viewBox", [0, 0, width, height]);
    svg.call(zoom.transform, d3.zoomIdentity.translate(margin.left, height/2 - root.x0).scale(1));

    let lastQuery = "";
    let hitSet = new Set();
    let pathSet = new Set();

    function nodeLabel(d) {
      return d.data?.name ?? "";
    }

    function nodePath(d) {
      return d.ancestors().reverse().map(x => x.data.name).join("  ›  ");
    }

    function showTip(evt, d) {
      const rect = wrap.getBoundingClientRect();
      const x = evt.clientX - rect.left + 14;
      const y = evt.clientY - rect.top + 14;
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
      tip.innerHTML = `
        <div style="font-size:13px;font-weight:650;margin-bottom:6px;">${escapeHtml(nodeLabel(d))}</div>
        <div><span class="k">type</span> ${escapeHtml(d.data.type || "unspecified")}</div>
        <div style="margin-top:6px;"><span class="k">path</span> ${escapeHtml(nodePath(d))}</div>
        <div style="margin-top:6px;color:rgba(255,255,255,0.60);">點擊可展開/收合；拖曳平移；滾輪縮放。</div>
      `;
      tip.style.opacity = 1;
      tip.style.transform = "translateY(0px)";
    }
    function hideTip() {
      tip.style.opacity = 0;
      tip.style.transform = "translateY(6px)";
    }

    function escapeHtml(s) {
      return String(s)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
    }

    function toggle(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
    }

    function expandAncestors(d) {
      let p = d.parent;
      while (p) {
        if (!p.children && p._children) {
          p.children = p._children;
          p._children = null;
        }
        p = p.parent;
      }
    }

    function computeHits(query) {
      hitSet.clear();
      pathSet.clear();
      if (!query) return;

      const q = query.toLowerCase().trim();
      if (!q) return;

      // Look through all nodes including collapsed ones
      function allNodes(d, acc) {
        acc.push(d);
        const kids = (d.children || []).concat(d._children || []);
        kids.forEach(k => allNodes(k, acc));
      }
      const all = [];
      allNodes(root, all);

      const hits = all.filter(n => nodeLabel(n).toLowerCase().includes(q));
      hits.forEach(n => {
        hitSet.add(n);
        // expand path
        expandAncestors(n);
        // record path nodes
        n.ancestors().forEach(a => pathSet.add(a));
      });
    }

    function zoomToNode(d) {
      // d.x, d.y are in layout coordinates; we need translate into view coordinates
      const k = 1.25;
      const tx = margin.left + 40;
      const ty = height / 2 - d.x * k;
      svg.transition().duration(550).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
    }

    function update(source) {
      // Recompute layout (after expanding/collapsing)
      const layoutRoot = treeLayout(root);
      const nodes = layoutRoot.descendants();
      const links = layoutRoot.links();

      // Shift all nodes to the right (margin)
      nodes.forEach(d => d.y += margin.left + 10);

      // --- Links ---
      const link = gLinks.selectAll("path.link")
        .data(links, d => d.target.data.name + "_" + d.target.depth + "_" + d.target.y);

      link.enter().append("path")
          .attr("class", "link")
          .attr("d", d => {
            const o = { x: source.x0, y: source.y0 + margin.left + 10 };
            return diagonal({ source: o, target: o });
          })
        .merge(link)
          .transition().duration(240)
          .attr("d", diagonal);

      link.exit().transition().duration(200)
        .attr("d", d => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o });
        })
        .remove();

      // --- Nodes ---
      const node = gNodes.selectAll("g.node")
        .data(nodes, d => d.data.name + "_" + d.depth + "_" + d.y);

      const nodeEnter = node.enter().append("g")
        .attr("class", d => `node depth${d.depth}`)
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .on("click", (event, d) => {
          toggle(d);
          update(d);
        })
        .on("mousemove", (event, d) => showTip(event, d))
        .on("mouseleave", hideTip);

      nodeEnter.append("circle")
        .attr("r", 1e-6)
        .attr("fill", d => d._children ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.45)");

      nodeEnter.append("text")
        .attr("dy", "0.32em")
        .attr("x", d => d.children || d._children ? -12 : 12)
        .attr("text-anchor", d => d.children || d._children ? "end" : "start")
        .text(d => d.data.name);

      const nodeMerge = nodeEnter.merge(node);

      nodeMerge
        .classed("hit", d => hitSet.has(d))
        .classed("path", d => pathSet.has(d) && !hitSet.has(d));

      nodeMerge.transition().duration(240)
        .attr("transform", d => `translate(${d.y},${d.x})`);

      nodeMerge.select("circle").transition().duration(240)
        .attr("r", d => d.depth === 0 ? 8 : (d.depth === 1 ? 6.5 : 5))
        .attr("fill", d => (d.children || d._children) ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.45)");

      node.exit().transition().duration(200)
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .remove();

      // Stash old positions for transitions
      nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
    }

    update(root);

    // ===== 3) Search controls =====
    const q = document.getElementById('q');
    const btnClear = document.getElementById('btnClear');
    const btnReset = document.getElementById('btnReset');

    function runSearch() {
      const query = q.value || "";
      lastQuery = query;
      computeHits(query);
      update(root);

      // zoom to first hit (if any)
      if (hitSet.size > 0) {
        const firstHit = [...hitSet][0];
        zoomToNode(firstHit);
      }
    }

    q.addEventListener('input', () => runSearch());

    btnClear.addEventListener('click', () => {
      q.value = "";
      lastQuery = "";
      hitSet.clear();
      pathSet.clear();
      update(root);
    });

    btnReset.addEventListener('click', () => {
      // collapse top-level children again
      root.children?.forEach(collapseDeep);
      q.value = "";
      lastQuery = "";
      hitSet.clear();
      pathSet.clear();
      update(root);
      svg.transition().duration(350).call(zoom.transform, d3.zoomIdentity.translate(margin.left, height/2 - root.x0).scale(1));
    });

    // Initial sizing
    resize();
  </script>
</body>
</html>
```

## 匯出與無障礙考量

### 匯出選項

你提到要支援 SVG/PNG/互動 HTML 匯出；建議分三層：

**互動 HTML（首選）**  
- 直接輸出一個 self-contained HTML（像上面那樣），可保存互動能力、搜尋、展開狀態（可序列化至 URL hash 或 localStorage）。  
- CNCF 在其 Landscape 互動版也強調可分享/可互動的導覽價值；資料可在 GitHub repo 取得。  

**SVG 匯出（適合矢量、列印與簡報）**  
- 若用 SVG 渲染（D3 常見），可用瀏覽器原生 `XMLSerializer.serializeToString()` 把 SVG DOM 序列化成字串，再包成 Blob 下載。MDN 文件描述 `serializeToString()` 可把 DOM tree 轉成 XML 字串。  

**PNG 匯出（適合貼到文件或社群）**  
- Canvas 或把 SVG 轉繪到 Canvas 後，可用 `HTMLCanvasElement.toDataURL()` 取得 data URL（或更建議用 `toBlob()` 以避免大圖 base64 成本）。MDN 描述 `toDataURL()` 會回傳指定格式的 data URL。  

### 無障礙與可用性

互動樹屬於複雜元件，建議至少做到：

- **鍵盤可操作性**：Treeview Pattern 定義了「可展開/收合」的樹狀清單概念；APG 提供相關互動模式與鍵盤介面設計指引。  
- **ARIA semantics**：若你做的是「真正的 tree widget」，可參考 ARIA roles（例如 `treeitem`）與其對鍵盤互動/焦點管理的提醒。  
- **WCAG 2.2 對可及性要求**：涵蓋視覺、肢體、認知等多類障礙；在互動圖上尤其要注意焦點可見、避免鍵盤陷阱、提供等價資訊。  

> 實務建議：若你的樹主要是「資料探索視覺化」而非「網站導航元件」，可以採用「視覺化畫布 + 旁邊同步的可存取清單（Treeview/List）」的雙層 UI：畫布追求美觀與效率，清單追求無障礙與精準鍵盤操作，兩者以 selection state 同步。

---

以上已涵蓋你要求的：  
1) 四層以上的詳細階層樹表格（可擴充）。  
2) 視覺化方法與渲染策略（含 force / radial / collapsible / 3D）。  
3) 工具優先清單與 pros/cons、效能要點。  
4) JSON/GraphML/GEXF 格式與 generator 的設計方向。  
5) 可直接複製貼上的完整互動範例（含 zoom/pan/collapse/search/tooltip）。  
6) 匯出與無障礙建議（含標準參照）。

<details>
<summary>Reseach activity, 512 searches</summary>

Addressing taxonomy, performance, and citations
For performance, I'll cite documentation statements related to rendering engines and large graph handling, like Cytoscape.js and Sigma.js using WebGL. Regarding the user’s taxonomy request, I'll create a mapping of categories and technologies, like pandas, React, and TensorFlow, citing the main frameworks and subfields, but not every individual node.

Searching
www.acm.orgwww.acm.org
cs.fit.educs.fit.edu
landscape.cncf.iolandscape.cncf.io
www.w3.orgwww.w3.org
26 more
Searching for more sources on visualization tools
I already have some sources, but I need more detailed documentation and performance notes on the visualization libraries. I’ll do a web search to gather more official documentation and performance data for each tool. This will help ensure the information is as accurate and up-to-date as possible.

Determining table structure and depth
The user asked for a hierarchical tree table with at least 4 levels, but they mentioned "many layers." I’ll provide a table with 4 columns: Level 1 through Level 4. If more depth is needed, I’ll include Level 5 optionally. Additionally, the table will have path strings for clarity, like “Systems > OS > process/thread > scheduling.”

Searching
d3js.orgd3js.org
blog.js.cytoscape.orgblog.js.cytoscape.org
www.sigmajs.orgwww.sigmajs.org
echarts.apache.orgecharts.apache.org
26 more
Searching for missing sources
I already have sources for D3.js (zoom and hierarchy), Cytoscape (WebGL), Sigma, and ECharts. Now I need to find sources for Three.js, Mermaid, Graphviz, vis-network, and Observable. I'll search for official documentation and performance notes for these libraries to ensure I have complete and up-to-date references.

Searching
threejs.orgthreejs.org
mermaid.js.orgmermaid.js.org
graphviz.orggraphviz.org
visjs.github.iovisjs.github.io
18 more
Searching for additional sources and specifications
I have sources for Three.js, Mermaid, Graphviz, and vis-network. Now I need sources for Observable notebooks, ECharts' "tree" series, and information on progressive rendering or streaming for large datasets. I'll also look for GraphML, GEXF specs, and JSON-LD resources to round out the citations.

Searching
en.wikipedia.orgen.wikipedia.org
gexf.netgexf.net
graphml.graphdrawing.orggraphml.graphdrawing.org
docs.gephi.orgdocs.gephi.org
20 more
Fetching citations for major frameworks and algorithms
We now have sources for GraphML and GEXF specs. Next, I need to gather information on algorithm categories and possibly cite models like ResNet. I’m also planning to include citations for major frameworks like pandas, React, Kubernetes, TensorFlow, and others, based on user mention, ensuring proper references.

Searching for official documentation and papers
I need to find the official documentation for frameworks like pandas, React, Prometheus, Nginx, Kubernetes, PyTorch, TensorFlow, and ROS 2. Additionally, I'll look up the original paper on ResNet. That should give me reliable sources to cite for these technologies and algorithms.

Searching
prometheus.ioprometheus.io
pandas.pydata.orgpandas.pydata.org
react.devreact.dev
docs.nginx.comdocs.nginx.com
14 more
Searching
www.itpro.comwww.itpro.com
kubernetes.iokubernetes.io
docs.pytorch.orgdocs.pytorch.org
www.tensorflow.orgwww.tensorflow.org
8 more
Looking for sources for key frameworks and models
I need to find reliable sources for Kubernetes, PyTorch, TensorFlow, ROS2, and ResNet. I will prioritize official documentation and original papers for these technologies to ensure I can cite trusted references when discussing them in detail.

Searching
arxiv.orgarxiv.org
docs.pytorch.orgdocs.pytorch.org
www.cv-foundation.orgwww.cv-foundation.org
github.comgithub.com
17 more
Finding sources for ResNet
I already have the documentation for Kubernetes, PyTorch, TensorFlow, and ROS2. Now, I just need the ResNet source. I'll use the original paper, “Deep Residual Learning for Image Recognition” by He et al., as it’s the foundational work. I'll search for that paper and cite it.

Searching
owasp.orgowasp.org
nvlpubs.nist.govnvlpubs.nist.gov
attack.mitre.orgattack.mitre.org
spdx.devspdx.dev
20 more
Gathering sources for security categories
Now that I have the ResNet sources, I need to integrate them into the taxonomy. I also want to include categories like "Observability," "IaC," and "Testing." For security, I'll gather sources like OWASP Top 10, NIST CSF, and MITRE ATT&CK to support the relevant subfields.

Searching
opentelemetry.ioopentelemetry.io
grafana.comgrafana.com
www.jaegertracing.iowww.jaegertracing.io
www.elastic.cowww.elastic.co
19 more
Gathering sources for observability frameworks
I need sources for observability definitions, perhaps from CNCF. We already have the CNCF landscape and blog, but also need sources for OpenTelemetry and similar tools. I'll mention frameworks like OpenTelemetry and Jaeger, citing the CNCF blog or documentation for OpenTelemetry. Let's gather these resources.

Organizing sources and framework details
We have reliable sources, but I need to find sources for Infrastructure as Code (e.g., Terraform), CI/CD, and testing frameworks. Even though the user didn’t request citations for every framework, it’s important to cite official sources, like Terraform and GitHub Actions. For devops, CNCF and Kubernetes docs will work. The user also wants each framework treated as a keyword node. I'll implement this in an interactive D3 example with features like zoom/pan, collapse/expand, and search with a moderate dataset.

Choosing D3 for interactive tree and providing guidance
I’ll use D3 for the hierarchical collapsible tree because it’s straightforward. The user may need to run a local file, potentially with a server, but D3 can work with a UMD version from jsdelivr or unpkg. I’ll suggest bundling for offline use, with color and icon suggestions based on level categories and application types. Small code snippets for each tree style (force-directed, collapsible, 3D) will be included, while focusing on accessibility. Export options for SVG/PNG/HTML will also be provided.

Integrating accessibility guidelines
I realize it’s important to mention accessibility too, citing WCAG 2.2 guidelines. Including ARIA Authoring Practices seems like a good idea, and I should look up documentation on the ARIA treeview pattern. I’ll search for the relevant ARIA resources and make sure to cite W3C practices for accuracy.

Searching
www.w3.orgwww.w3.org
developer.mozilla.orgdeveloper.mozilla.org
stackoverflow.comstackoverflow.com
www.telerik.comwww.telerik.com
14 more
Gathering sources for tree and graph visualization
We’ve already got sources for the WAI APG treeview pattern, MDN export methods, and the appropriate XMLSerializer. Let's look into D3, Graphviz, and other tools like Mermaid, ECharts, Cytoscape, and Sigma for large graph performance. I’ll check for relevant docs like d3-hierarchy, WebGL support, and detailed performance notes for embedding features. Need to cite ACM CCS for ontologies and explain tree vs DAG with cross-links. Also, remember to note unspecified dimensions.

Clarifying dimensions and details for taxonomy and report
We’ll define key dimensions: scope (e.g., hardware, math), update strategy (versions/deprecations), and target audience (beginner vs advanced). The user also requested Chinese Traditional (zh-TW) but mentioned en-US as the preference. I'll prioritize unspecified details like synonyms, metadata, and weighting. The output will be presented as an analytical report with a tree table and include sample data formats, such as JSON and GraphML.

Proposing visualization methods and tools
I’ll propose visualization methods like D3 collapsible trees, radial trees, force-directed graphs, and 3D WebGL in Three.js for smaller graphs. For large graphs, tools like Sigma and Cytoscape will work. I’ll also include a pros/cons comparison matrix to help the user choose the right tool and provide a self-contained, interactive D3 example.

Implementing search functionality in D3 tree
For search functionality, I’ll precompute an index mapping lowercased labels to nodes. The search will match partial strings, highlight nodes, auto-expand paths to matches, and zoom/transition to the first match. Nodes will have unique IDs, and I’ll use D3 settings for responsive layout, zoom, and node rendering with tooltips.

Search and interactivity enhancements in D3 tree
I’ll implement search across all nodes by checking each for query matches. For each match, I’ll expand its ancestors and update the view, focusing on highlighting the nodes and paths. Tooltips will show node type and tags. The dataset will be compact for performance in examples but includes all the required categories. I’ll provide a generator script and an interactive example as requested. Additionally, I’ll offer a snippet for exporting the tree as SVG with XMLSerializer.

Building taxonomy based on ACM CCS categories
I’ll align the taxonomy with ACM CCS root categories, like "Software engineering," "Computer systems," and "Security," but adapt it for a user-friendly structure. I'll include a wide range of topics, such as programming languages, DevOps, and AI. The final structure will be at least four levels: Category > Subcategory > Tech Area > Frameworks/Packages/Skills, with many nodes for each.

Organizing the taxonomy and sections for the report
To organize the content, I'll break it into top-level categories, like "AI/ML," "Security,” "Mobile," etc. Some areas may overlap (e.g., merging DevOps with Monitoring). However, the report needs between 4-8 main sections, with the taxonomy section being one of them. Each section can have further subheadings for clarity.

Clarifying section and heading structure
It seems that the report should have between four to eight major sections (h1 headings), with any subheadings (h2) under these. While I could add h3 headings, it's ambiguous whether they'd count as sub-sections. To stay on the safe side, I'll keep it at two levels for simplicity, aiming for eight h2 sections overall.

Searching
landscape.cncf.iolandscape.cncf.io
www.computer.orgwww.computer.org
www.acm.orgwww.acm.org
js.cytoscape.orgjs.cytoscape.org
29 more
Gathering sources and preparing for citations
I need to make sure I find sources for the Mermaid live editor, Graphviz formats, and ECharts' rendering features. I'll cite from their official pages. For tools like Graphviz, I'll reference the dot guide PDF. Additionally, I must ensure each entity is cited with proper disambiguation in the zh-TW report.

Choosing accurate entity disambiguation and locale
For the ACM, we need to keep disambiguation within 32 characters. "Computing professional org" works at 26 characters. In Traditional Chinese, we can use "ACM（Association for Computing Machinery）" for clarity, although the full translation would be longer. Proper balance between accuracy and length is key.

Handling entity disambiguation for clarity
Entity name wrapping works with parentheses for entities like ACM, W3C, IEEE, etc., but disambiguation must be concise. For example, ACM can be wrapped as "ACM（Association for Computing Machinery）", and IEEE as "IEEE 電腦學會" in Chinese. For MITRE and NIST, "organization" is appropriate, while Gephi is software, not an entity type.

Clarity on entity wrapping and classification
"Gephi" is a product, not an entity type, so it can't be wrapped. For websites like arXiv or MDN Web Docs, their classification as an organization is ambiguous. While "Mozilla" may be treated as an organization, MDN is a documentation site and probably shouldn't be wrapped as an entity. We should avoid classifying frameworks and libraries as entities.

Clarifying entity-wrapping process
"MDN Web Docs" is a documentation project, not an organization, but I could potentially wrap it as "Mozilla documentation site" for disambiguation. "arXiv" is a repository, and while I could treat it as an organization, I'll likely skip it to avoid misclassification. I'll focus on wrapping key organizations like ACM, IEEE, and others in relevant sections in the report, delivered in Traditional Chinese.

Planning exec summary and taxonomy checklist
I'll write an executive summary in paragraph form, maybe with a few bullets for clarity. Although I need to minimize bullets, a short list will keep it readable. For sources, I'll prioritize official docs and well-known community references. For taxonomy, I'll use a hierarchical tree table and note that citations can appear in table cells, but not in bold or italics. Given the complexity, I should avoid citing every row in the taxonomy table.

Taxonomy organization and citation strategy
I will cite the sources for our taxonomy at the top, emphasizing that it's based on practical syntheses from ACM CCS, SWEBOK, CNCF, and others. In the taxonomy, I'll categorize items as tools, libraries, models, protocols, and skills. I'll include relevant examples like scikit-learn for ML, systemd for systems, and PostgreSQL for databases. Additionally, frameworks for web and backend technologies will also be included.

Searching
developer.hashicorp.comdeveloper.hashicorp.com
www.redhat.comwww.redhat.com
docs.github.comdocs.github.com
docs.ansible.comdocs.ansible.com
17 more
Gathering sources for visualization tools
I have the sources for IaC and CI/CD, but I'm still looking for sources on testing frameworks, although they may not be critically needed. For tools like Graphviz, ECharts, Mermaid, and D3, I’ll gather the relevant feature references, examples, and algorithms. I need to build a detailed taxonomy table for the final report, ensuring no raw URLs are included.

Creating the report and taxonomy
I need to generate a report now, ignoring the earlier conflicting plan. I’ll mention unspecified dimensions, like the inclusion of academic vs. industry research. I'll create a section for unspecified items. For the taxonomy, I'll build a multi-layered hierarchical tree — levels from computer science root through to keyword nodes for frameworks, tools, and models. I’ll organize it in a table with columns for each level, ensuring clarity while keeping the structure user-friendly.

Designing taxonomy table structure
I’m thinking of organizing the taxonomy in a readable table with 5 columns: Level1 through Level5, but keeping it concise and manageable. We could present this as a path table with columns showing the path and examples of keyword nodes. The challenge is balancing depth and readability—I'll figure the best way to design and structure it.

Structuring taxonomy with expandable layers
I’m thinking about how to build the table with 4 levels but also leaving room for 5 if necessary. I’ll keep things organized with columns like "Level1" for the main categories (AI/ML, for example) and dive deeper with frameworks like PyTorch. I'll include testing, monitoring, and more, aiming for a robust, detailed table, but keeping it expandable and user-friendly.

Building top-level categories and skill keywords
I’m structuring the top-level categories for CS, like algorithms, software engineering, databases, and ML. I'll also blend in Testing, Monitoring, and Infra-as-Code under Cloud & DevOps. Skill keywords like "lock-free" and "CAP theorem" will be integrated. The root is "CS," and I will mention this but not list it in the table itself. I'll maintain clarity while ensuring depth.

Outlining visualization and tool recommendations
I’ll provide recommended visualization methods, libraries, and tools, including a prioritized list with performance considerations. This will be followed by examples of sample data formats like JSON, GraphML, and GEXF. I’ll also outline a generator script, perhaps in Python, that converts YAML taxonomy to JSON. Additionally, I’ll include export options and ensure accessibility.

Organizing final report structure
For the report, I'll use image-group queries like those for D3 collapsible tree visualizations, WebGL Three.js force-directed graphs, radial tree diagrams, and sunburst charts. These will be included in the visualization section, not at the beginning or end. I'll keep the report focused, without lead-ins or horizontal lines.

Final report adjustments
I will mention that the tree view pattern represents a hierarchical list with expand/collapse functionality. Images will be included in the visualization section, with queries like radial trees, force-directed, and 3D graphs, but without citations. I'll avoid horizontal lines and parenthetical statements in headers, ensuring the report is straightforward.

Planning output in Traditional Chinese
I'll craft the response in Traditional Chinese, making sure it's thorough, aiming for around 4000-8000 words. I'll be careful with the token limit, but "juice 512" should give us flexibility for a long response. The taxonomy table might be large, but it's manageable with 180 rows, where each node is represented adequately within the size limit.

Building the taxonomy content
I need to build a "multi-layered hierarchical tree" that includes frameworks, libraries, tools, models, and skill keywords, covering both software and concepts. We’ll have at least 4 levels where applicable, and each keyword will be treated as an individual node, aggregating related items. For example, in "Systems," we’ll organize areas like Operating Systems, Process Management, and Memory Management, each with specific keywords such as "Linux kernel" or "virtual memory."

Expanding the taxonomy for infrastructure and software engineering
The taxonomy will cover various tools and frameworks. For instance, under Orchestration, we’ll include Kubernetes, and under Service Mesh, tools like Istio and Linkerd. For Infrastructure as Code, we’ll include examples such as Terraform, Pulumi, and CloudFormation. We'll also list web frameworks like React, Vue, Django, and FastAPI.

Expanding technology stack across categories
I'm mapping out key tools across several domains. For web servers, we have Nginx and Apache. For mobile, there’s Android (Kotlin, Jetpack Compose) and iOS (Swift, SwiftUI), with cross-platform options like Flutter and React Native. ML frameworks include PyTorch, TensorFlow, and JAX, while NLP introduces model families like GPT and BERT.

Creating structured taxonomy and report format
I’ll focus on creating a taxonomy that aligns with user preferences while following their instructions. I need to include a section on "Super-tree taxonomy" with potentially a table and a compact JSON snippet. Key is also acknowledging that ACM CCS is poly-hierarchical, though here, we’ll flatten it into a tree structure.

Considering 3D options for user request
The user asked for 3D WebGL options, so I’m thinking of mentioning "3d-force-graph" or "force-graph" as possibilities. While they didn’t mention them specifically, it’s a good fit. I might look up the documentation for "3d-force-graph" with Three.js to check for any necessary citations.

Searching
github.comgithub.com
observablehq.comobservablehq.com
vasturiano.github.iovasturiano.github.io
d3js.orgd3js.org
14 more
Balancing detailed table and taxonomy delivery
The user asked for a detailed hierarchical tree, but also for an extensive taxonomy. This could be too large for one message, so I might suggest splitting the content into a "core tree" and "extension packs". I’ll point out that the generator can expand to thousands, though I’ll ensure it’s extensive but manageable. Citations will be included!

Structuring the report
I’ll begin crafting the report with the executive summary, ensuring deliverables like taxonomy tables, visualization methods, tool comparisons, and example formats are mentioned. I’ll clarify that the taxonomy is a "pragmatic super tree", built with authoritative sources. The scope section will list what's unspecified. For taxonomy, we'll include cross-links and alias strategies in paragraphs. Then, I'll cover visualization, including rendering paradigms and layout types, with relevant examples and citations.

Tooling landscape
I’ll create a prioritized list or table with minimal bullets, providing a ranking of tools/packages to implement, including pros/cons and performance notes. To cover their request, I’ll use short paragraphs for each, citing sources like D3 site, cytoscape, sigma, and others like ECharts, Observable, and mermaid. I'll include image_group here.

Searching
observablehq.comobservablehq.com
d3js.orgd3js.org
mermaid.livemermaid.live
observablehq.observablehq.cloudobservablehq.observablehq.cloud
16 more
Balancing export function with interactivity
If I include an export button (e.g., "Export SVG"), I’ll ensure it functions well, but it could add complexity, like needing a method to serialize SVG to a file. Since the user asked for export options but not in the main example, I’ll keep it separate for clarity. They also want code snippets for various visualization methods. I'll prioritize providing interactive, visually appealing rendering examples like force-directed, collapsible, and 3D WebGL.

Creating the taxonomy and tool selection structure
I’ll use best practices in icon selection for categories like language, framework, and model, possibly sourcing from Material Icons. I'll mention performance: SVG could lag with tens of thousands of nodes, while Canvas/WebGL is better for larger data sets. I’ll handle the descriptions in paragraphs for aesthetics, and for tables in the taxonomy and tool sections. For bilingual output, I'll note the user prefers Traditional Chinese but hasn't specified bilingual nodes, so I'll include English keywords as nodes by convention.

Searching
threejs.orgthreejs.org
wikipedia.orgwikipedia.org
prometheus.ioprometheus.io
kubernetes.iokubernetes.io
198 more
Generated report on 電腦科學超級樹：全域 CS 分層分類法與互動視覺化實作報告

</details>