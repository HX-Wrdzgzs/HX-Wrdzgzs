# Profile Specification - HX-Wrdzgzs

## 中文版 / Chinese Version

### 01. 个人概况
*   **角色**: 开源爱好者与学习者
*   **关联组织**: MizukiBot-Develop (成员)
*   **核心方向**: QQ 机器人插件与音游辅助工具开发

### 02. 技术工具栈

| 分层 | 核心技术 |
| :--- | :--- |
| **开发语言** | Python, Golang, Kotlin, JavaScript, SQL |
| **前端与 UI** | Vue.js, Android SDK (Kotlin) |
| **核心框架** | NoneBot2, Gin (OneBot 规范实现) |
| **数据与驱动** | MySQL, Selenium (WebDriver) |

### 03. 核心仓库矩阵

#### 音游相关与网页可视化
*   **Mizuki-Sync-Android**
    *   **背景**: 舞萌 DX 移动端成绩查询与曲库辅助工具。
    *   **架构**: Kotlin / Android 原生开发。
    *   **实现**: 对接落雪 (LXNS) API，支持全量曲库动态过滤、定数筛选及个人成绩实时同步。
*   **hx-pjsk-gateway**
    *   **背景**: Project Sekai 网页查分终端与可视化网关。
    *   **架构**: Vue.js / 单页面应用 (SPA)。
    *   **实现**: 网页端无缝鉴权，作为 OneBot11 / Napcat 机器人前端数据呈现的直观延伸。

#### 机器人与消息网关
*   **Mizuki-Economy**
    *   **背景**: 高并发群聊社交与经济插件系统。
    *   **架构**: Python / NoneBot2 / MySQL。
    *   **实现**: 深度适配官方机器人 Markdown 与内联按钮，支持事务级资金流转与异步高并发抢红包。
*   **Gensokyo-NewQQ**
    *   **背景**: 轻量级 OneBot 协议 Golang 实现网关。
    *   **架构**: Golang / QQ 官方 API。
    *   **实现**: 原生跨平台，提供符合 OneBot 规范的底层通信转换。
*   **Mizuki-plugin-qbind**
    *   **背景**: MizukiBot 内部账户绑定与鉴权管理模块。
    *   **架构**: Python / NoneBot2。

#### 自动化与工具
*   **Edge-Web-Form-Auto-Filler**
    *   **背景**: 基于 Selenium 的 Edge 浏览器表单自动填充脚本。
    *   **架构**: Python / Selenium。

### 04. 组织项目矩阵
参与 [MizukiBot-Develop](https://github.com/MizukiBot-Develop) 模块化聊天机器人插件生态建设：
*   **MizukiBot**: 核心机器人母体。
*   **音游查分插件**: `lxns_b50` (舞萌 DX B50 成绩查询) | `Mizuki-plugin-maidead` (舞萌娱乐交互) | `Mizuki-Sekai-Api-Haruki` (PJSK 数据 API 桥接)
*   **核心系统插件**: `Mizuki-plugin-Auto-Markdown` | `Mizuki-plugin-group` | `Mizuki-plugin-help` | `Mizuki-plugin-welcome` | `Mizuki-plugin-send`
*   **娱乐功能模块**: `Mizuki-plugin-meme` | `Mizuki-plugin-homo-qso`

---

## 英文版 / English Version

### 01. Developer Profile
*   **Role**: Open-Source Enthusiast & Learner
*   **Affiliation**: MizukiBot-Develop (Member)
*   **Focus Areas**: QQ Bot plugins & Rhythm Game helper tools

### 02. Technical Tools

| Layer | Technologies |
| :--- | :--- |
| **Languages** | Python, Golang, Kotlin, JavaScript, SQL |
| **Frontend & UI** | Vue.js, Android SDK (Kotlin) |
| **Frameworks** | NoneBot2, Gin (OneBot Implementation) |
| **Data & Drivers** | MySQL, Selenium (WebDriver) |

### 03. Core Repository Matrix

#### Rhythm Games & Web Visualizations
*   **Mizuki-Sync-Android**
    *   **Context**: maimai DX mobile query & scoring tool.
    *   **Architecture**: Kotlin / Android Native.
    *   **Implementation**: Integration with LXNS API, full-song library dynamic filtering, real-time sync.
*   **hx-pjsk-gateway**
    *   **Context**: Project Sekai web scoring & visualization gateway.
    *   **Architecture**: Vue.js / SPA.
    *   **Implementation**: Stateless web authorization serving as a graphical extension for OneBot11 / Napcat.

#### Bot Ecosystem & Messaging Gateways
*   **Mizuki-Economy**
    *   **Context**: High-concurrency chat economics system.
    *   **Architecture**: Python / NoneBot2 / MySQL.
    *   **Implementation**: Adaptive rendering engine for official Markdown, transactional ledger routing, and asynchronous lottery/red-packet routines.
*   **Gensokyo-NewQQ**
    *   **Context**: Lightweight OneBot protocol gateway.
    *   **Architecture**: Golang / QQ Official API.
    *   **Implementation**: Cross-platform network hub translating official API events to standard OneBot payloads.
*   **Mizuki-plugin-qbind**
    *   **Context**: Identity binding utility.
    *   **Architecture**: Python / NoneBot2.

#### Automation & Tooling
*   **Edge-Web-Form-Auto-Filler**
    *   **Context**: Batch form filler automation.
    *   **Architecture**: Python / Selenium.

### 04. Organization Matrix
Contributing to the modular QQ chat assistant ecosystem at [MizukiBot-Develop](https://github.com/MizukiBot-Develop):
*   **MizukiBot**: Core bot runtime.
*   **Rhythm Game Integration**: `lxns_b50` | `Mizuki-plugin-maidead` | `Mizuki-Sekai-Api-Haruki`
*   **Core Systems**: `Mizuki-plugin-Auto-Markdown` | `Mizuki-plugin-group` | `Mizuki-plugin-help` | `Mizuki-plugin-welcome` | `Mizuki-plugin-send`
*   **Recreational Modules**: `Mizuki-plugin-meme` | `Mizuki-plugin-homo-qso`

---

## 数据分析 / Telemetry

### 01. 贡献图动画 / Contribution Snake
<p align="center">
  <img src="https://raw.githubusercontent.com/HX-Wrdzgzs/HX-Wrdzgzs/output/github-contribution-grid-snake.svg" alt="GitHub Contribution Snake" />
</p>

### 02. 指标监控 / GitHub Stats
<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=HX-Wrdzgzs&show_icons=true&theme=vue-dark&hide_border=true&bg_color=121212" alt="GitHub Stats" />
</p>
<p align="center">
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=HX-Wrdzgzs&layout=compact&theme=vue-dark&hide_border=true&bg_color=121212" alt="Top Languages" />
</p>
