# 开发者个人规范 - HX-Wrdzgzs / Developer Profile

## 01. 个人概况 / Developer Profile
*   **角色 / Role**: 开源爱好者与学习者 / Open-Source Enthusiast & Learner
*   **关联组织 / Affiliation**: MizukiBot-Develop (成员 / Member)
*   **核心方向 / Focus Areas**: QQ 机器人插件与音游辅助工具开发 / QQ Bot plugins & Rhythm Game helper tools

---

## 02. 技术工具栈 / Technical Tools

| 分层 / Layer | 核心技术 / Technologies |
| :--- | :--- |
| **开发语言 / Languages** | Python, Golang, Kotlin, JavaScript, SQL |
| **前端与用户界面 / Frontend & UI** | Vue.js, Android SDK (Kotlin) |
| **核心框架 / Frameworks** | NoneBot2, Gin (OneBot Implementation) |
| **数据与驱动 / Data & Drivers** | MySQL, Selenium (WebDriver) |

---

## 03. 核心仓库矩阵 / Core Repository Matrix

### 音游相关与网页可视化 / Rhythm Games & Web Visualizations
*   **Mizuki-Sync-Android**
    *   **背景 / Context**: 舞萌 DX 移动端成绩查询与曲库辅助工具。 / maimai DX mobile query & scoring tool.
    *   **架构 / Architecture**: Kotlin / Android Native.
    *   **实现 / Implementation**: 对接落雪 API，支持全量曲库动态过滤、定数筛选及个人成绩实时同步。 / Integration with 落雪 (LXNS) API, full-song library dynamic filtering, real-time sync.
*   **hx-pjsk-gateway**
    *   **背景 / Context**: Project Sekai 网页查分终端与可视化网关。 / Project Sekai web scoring & visualization gateway.
    *   **架构 / Architecture**: Vue.js / SPA.
    *   **实现 / Implementation**: 网页端无缝鉴权，作为 OneBot11 / Napcat 机器人前端数据呈现的延伸。 / Stateless web authorization serving as a graphical extension for OneBot11 / Napcat.

### 机器人与消息网关 / Bot Ecosystem & Messaging Gateways
*   **Mizuki-Economy**
    *   **背景 / Context**: 高并发群聊社交与经济插件系统。 / High-concurrency chat economics system.
    *   **架构 / Architecture**: Python / NoneBot2 / MySQL.
    *   **实现 / Implementation**: 深度适配官方 Markdown 与内联按钮，具备动态图像渲染、事务级资金流动、异步高并发抢红包等功能。 / Adaptive rendering engine for official Markdown, transactional ledger routing, and asynchronous lottery/red-packet routines.
*   **Gensokyo-NewQQ**
    *   **背景 / Context**: 轻量级 OneBot 协议 Golang 实现网关。 / Lightweight OneBot protocol gateway.
    *   **架构 / Architecture**: Golang / QQ Official API.
    *   **实现 / Implementation**: 原生跨平台，提供基于 QQ 官方 API 且符合 OneBot 规范 the 底层通信网关。 / Cross-platform network hub translating official API events to standard OneBot payloads.
*   **Mizuki-plugin-qbind**
    *   **背景 / Context**: MizukiBot 内部账户绑定与鉴权管理模块。 / Identity binding utility.
    *   **架构 / Architecture**: Python / NoneBot2.
    *   **实现 / Implementation**: 绑定用户身份凭证至机器人实体。 / Binds user credentials to bot entities.

### 自动化与工具 / Automation & Tooling
*   **Edge-Web-Form-Auto-Filler**
    *   **背景 / Context**: 基于 Selenium 的 Edge 浏览器表单自动填充脚本。 / Batch form filler automation.
    *   **架构 / Architecture**: Python / Selenium.

---

## 04. 组织项目矩阵 / MizukiBot-Develop Organization Matrix

参与 [MizukiBot-Develop](https://github.com/MizukiBot-Develop) 模块化聊天机器人插件生态建设： / Contributing to the modular QQ chat assistant ecosystem at [MizukiBot-Develop](https://github.com/MizukiBot-Develop):

*   **MizukiBot**: 核心机器人母体。 / Core bot runtime.
*   **音游查分插件 / Rhythm Game Integration**:
    *   **lxns_b50**: 舞萌 DX B50 成绩查询插件。 / maimai DX B50 calculation plugin.
    *   **Mizuki-plugin-maidead**: 舞萌娱乐交互。 / Game scoring utility.
    *   **Mizuki-Sekai-Api-Haruki**: PJSK 核心 API 桥接层。 / PJSK data API interface gateway.
*   **核心系统插件 / Core Systems**:
    *   `Mizuki-plugin-Auto-Markdown` | `Mizuki-plugin-group` | `Mizuki-plugin-help` | `Mizuki-plugin-welcome` | `Mizuki-plugin-send`
*   **娱乐功能模块 / Recreational Modules**:
    *   `Mizuki-plugin-meme` | `Mizuki-plugin-homo-qso`

---

## 05. 贪吃蛇贡献图动画 / Contribution Snake

<p align="center">
  <img src="https://raw.githubusercontent.com/HX-Wrdzgzs/HX-Wrdzgzs/output/github-contribution-grid-snake.svg" alt="GitHub Contribution Snake" />
</p>

---

## 06. 统计数据 / System Metrics

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=HX-Wrdzgzs&show_icons=true&theme=vue-dark&hide_border=true&bg_color=121212" alt="GitHub Stats" />
</p>
<p align="center">
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=HX-Wrdzgzs&layout=compact&theme=vue-dark&hide_border=true&bg_color=121212" alt="Top Languages" />
</p>
