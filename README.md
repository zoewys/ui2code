# UI2Code

> Codex 原生插件 — 选中 DOM 元素，用自然语言精修 UI。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

UI2Code 让你在 [Codex](https://openai.com/codex) 中打开任意 dev server 页面，**点击选择一个 DOM 元素**，用自然语言描述想要的修改（或上传参考截图），AI 自动修改源代码并通过截图对比验证效果——直到你满意为止。

## ✨ 功能

| 功能 | 说明 |
|------|------|
| 📸 **截图预览** | Widget 内加载 dev server 页面截图，所见即所得 |
| 🎯 **点选元素** | 点击截图上的任意位置，Playwright 自动识别对应 DOM 元素 |
| ✏️ **自然语言修改** | "把这个按钮改成圆角蓝色渐变" —— AI 直接修改源代码 |
| 🖼️ **截图参考** | 拖拽上传设计稿截图，AI 参照修改 |
| 🔄 **视觉对比** | 自动截图对比修改前后效果，差异高亮，迭代优化至达标 |
| ⏪ **一键撤销** | 基于 Git 的修改历史，随时回退任意一次修改 |

## 🏗️ 架构

```
┌─────────────────────────────────────────────────┐
│                    Codex                         │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │           Widget (index.html)                │ │
│  │  ┌──────────────────┬──────────────────────┐ │ │
│  │  │   截图预览        │ 选中元素 / 指令输入   │ │ │
│  │  │   点击选择元素     │ 参考图上传            │ │ │
│  │  │                  │ 修改历史 / 撤销        │ │ │
│  │  └──────────────────┴──────────────────────┘ │ │
│  └──────────────┬──────────────────────────────┘ │
│                 │ MCP Apps Bridge (postMessage)   │
│  ┌──────────────▼──────────────────────────────┐ │
│  │     MCP Server (Node.js, JSON-RPC stdio)     │ │
│  │  8 tools: render_widget, capture_screenshot, │ │
│  │  identify_element, compare, history, undo    │ │
│  └──────────────┬──────────────────────────────┘ │
│                 │                                 │
│  ┌──────────────▼──────────────────────────────┐ │
│  │  Skills: open / refine / undo                │ │
│  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**核心流程**：截图 → 点选元素 → 描述修改 → AI 改代码 → 截图对比 → 迭代修复

## 📦 安装

### 方法 1：自动安装（推荐）

在 Codex 中直接说：

> 请从 https://github.com/zoewys/ui2code.git 安装 UI2Code 插件。请 clone 到 ~/plugins/ui2code

### 方法 2：手动安装

```bash
# 1. Clone 仓库
mkdir -p ~/plugins
git clone https://github.com/zoewys/ui2code.git ~/plugins/ui2code
cd ~/plugins/ui2code
npm install

# 2. 注册到 Codex
codex plugin marketplace add ~
codex plugin add ui2code@personal
```

> 安装后建议开一个新的 Codex 对话，确保 MCP 工具和 Skills 正确加载。

## 🚀 使用

### 1. 启动你的 dev server

```bash
npm run dev   # 确保你的项目 dev server 在运行
```

### 2. 在 Codex 中打开 UI2Code

> "Open UI2Code for this project"

### 3. 在 Widget 中操作

1. **输入 URL** — 填入 dev server 地址（如 `http://localhost:3000`）
2. **📸 截图** — 点击 Capture 按钮加载页面截图
3. **🎯 选元素** — 点击截图上你想修改的元素
4. **✏️ 写指令** — 描述你想要的变化
5. **▶ 执行** — AI 自动修改源码，截图对比验证
6. **⟲ 撤销** — 不满意随时回退

### 示例指令

| 你说的 | AI 做的 |
|--------|---------|
| "把按钮改成圆角，蓝色渐变背景" | 修改 CSS `border-radius` + `background: linear-gradient(...)` |
| "增大字体，加粗" | 修改 `font-size` 和 `font-weight` |
| "改成横向排列" | 修改 `flex-direction: row` |
| "加内边距和阴影" | 添加 `padding` 和 `box-shadow` |
| "替换成卡片组件" | 重构 HTML 结构（保留内容） |

## 🔧 MCP 工具

| 工具 | 说明 |
|------|------|
| `render_ui2code_widget` | 打开 Widget |
| `capture_screenshot` | Playwright 截取页面截图 |
| `identify_element_at_point` | 根据坐标识别 DOM 元素 |
| `save_ui2code_selection` | 保存选区状态 |
| `get_ui2code_selection` | 读取选区状态 |
| `compare_screenshots` | 像素级截图对比 |
| `get_refine_history` | 获取修改历史 |
| `undo_last_refine` | 撤销上次修改 |

## 🛠️ 技术栈

| 层面 | 技术 |
|------|------|
| MCP Server | Node.js ESM, JSON-RPC 2.0 over stdio |
| Widget | 自包含 HTML, MCP Apps Bridge (postMessage) |
| 截图引擎 | [Playwright](https://playwright.dev/) |
| 图片对比 | [pixelmatch](https://github.com/mapbox/pixelmatch) + [pngjs](https://github.com/lukeapage/pngjs) |
| 版本控制 | Git（修改历史 + 选择性撤销） |

## 📂 项目结构

```
ui2code/
├── .codex-plugin/plugin.json    # Codex 插件清单
├── .mcp.json                    # MCP 服务器配置
├── package.json
├── mcp/
│   ├── server.mjs               # MCP stdio 服务器（8 个工具）
│   └── lib/
│       ├── screenshot.mjs       # Playwright 截图 + 元素识别
│       ├── compare.mjs          # 像素对比 + diff 热力图
│       ├── history.mjs          # Git-based 修改历史
│       ├── project.mjs          # 选区状态管理
│       └── widget-resource.mjs  # Widget 资源注册
├── widget/index.html            # Widget 页面（自包含）
├── scripts/start-mcp.mjs        # 入口（自动安装依赖）
└── skills/
    ├── ui2code-open/SKILL.md
    ├── ui2code-refine/SKILL.md
    └── ui2code-undo/SKILL.md
```

## 🙏 致谢

灵感来源：
- [Cowart](https://github.com/zhongerxin/cowart) — Codex 原生画布 Widget 插件
- [Screenshot to Code](https://github.com/abi/screenshot-to-code) — 截图转代码 + 视觉对比
- [VisBug](https://github.com/GoogleChromeLabs/ProjectVisBug) — 浏览器元素可视化编辑

## 📄 License

MIT
