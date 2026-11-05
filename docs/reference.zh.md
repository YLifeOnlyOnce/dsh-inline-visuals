
> 面向用户的介绍请看 [README（中文）](../README.zh.md) · [English README](../README.md)。本页是完整技术参考。

# 技术参考 · Inline Visuals（中文）

![Inline Visuals banner](banner.png)

让模型在对话里画出可重放的图 —— 14 种图型、可调样式、点选追问、Agent 可改图。
本页是完整技术参考（安装、参数、限制、开发与发布）。

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![dsh](https://img.shields.io/badge/DeepSeek%20Harness-0.2.1--rc.3-1f6feb.svg)](https://deepseek-harness.github.io/deepseek-harness/)
[![kinds](https://img.shields.io/badge/kinds-14%20visuals%20%C2%B7%20styles-0a6b3d.svg)](#它能画什么)
[![npm](https://img.shields.io/npm/v/dsh-inline-visuals?label=npm&color=cb3837)](https://www.npmjs.com/package/dsh-inline-visuals)
[![ci](https://github.com/YLifeOnlyOnce/dsh-inline-visuals/actions/workflows/ci.yml/badge.svg)](https://github.com/YLifeOnlyOnce/dsh-inline-visuals/actions/workflows/ci.yml)

模型不再只回你五段数字——它调用 `show_visual` 工具，提交一份**声明式规格**（不是 HTML、不是 SVG 代码），
DSH 把它存进会话日志，前端渲染成一张跟随主题的卡片。刷新、重开、fork 都能重放，不用再调模型。

![before/after](before-after.png)

## 为什么值得装

- **可重放**：规格通过 `output.presentationMeta` 持久化在 `tool/result.meta` 里，属于会话日志的一部分；
- **安全**：规格是数据不是代码，不执行模型输出、不加载外链，超限自动裁剪；
- **原生感**：颜色全部来自 `--dsw-alias-*` 主题 token，中英文案走宿主 locale，深浅色都不破；
- **零依赖安装**：Host 半是纯 ESM；Client 半把 Chart.js 内联进单文件，React 由宿主模块表提供；
- **文本回退**：不能渲染卡片的客户端（TUI、导出、日志）会收到紧凑的文字摘要（列表或 Markdown 表）；
- **可改可定制**：`style` 控制横向/堆叠/阶梯/数值标签/图例/网格/配色/趋势线，`edit_visual` 让 Agent 基于上一张图做局部修改（只传要改的字段）；
- **可追问**：点击图上的数据点 → 出现选中值和「追问这点」按钮，点击后自动把结构化追问插入输入框；
- **可导出**：复制 JSON / CSV，Chart.js 图型导出 PNG，自绘 SVG 卡片导出 SVG。

## 30 秒安装

### 方式 A · 在 DSH 里一行装（推荐，无需终端）

```text
plugin_manager({ action: "install_bundle", target: "dsh-inline-visuals" })
```

看到 `application: "applied"` 即成功；如果提示 `already-installed`，先
`remove_bundle` 再装。之后：

- Agent 的工具列表里出现 `show_visual`；
- 侧边栏 Plugins 页出现「内联可视化 / Inline Visuals」条目（原创图标 + 中英文描述）。

### 方式 B · 还没发布到 npm？直接从 GitHub 装

```text
plugin_manager({ action: "install_bundle", target: "github:YLifeOnlyOnce/dsh-inline-visuals" })
```

pnpm 会解析仓库里的 `package.json` 安装（首次约 30–60 秒），不需要 npm 包先发布。

### 方式 C · 本地源码 / 贡献者

```bash
git clone https://github.com/YLifeOnlyOnce/dsh-inline-visuals.git
```

```text
plugin_manager({ action: "install_bundle", target: "/abs/path/to/dsh-inline-visuals" })
```

### 装完就能用

对模型说一句就行，例如：

> 「把三种缓存方案的命中率画成柱状图，再加一句结论。」
>
> 然后接着说：「把这张图改成横向、堆叠，再打开数值标签。」——Agent 会调用 `edit_visual` 做局部修改。

或者验证安装：

```text
cordis_inspect_query({ platform: "host", provider: "Tool", method: "listTools" })
```

应能在工具列表里看到 `show_visual`。

> 要求 DSH ≥ `v0.2.1-rc.3`（依赖 `presentationMeta` 输出契约与 `tool.call.toolview` 槽位）。
> 更换插件代码后需要重启 dsh 进程才会加载新的 Host 模块代际；只改 Client 刷新页面即可。

## 它能画什么

![14 种图型](demo.png)

| 类别 | kinds | 渲染方式 |
|---|---|---|
| **图表** | `bar` `line` `area` `pie` `doughnut` `scatter` `radar` `waterfall` | Chart.js（canvas）：主题色、tooltip、图例、动画、可导出 PNG |
| **结构化** | `compare` `timeline` `gantt` `heatmap` `flow` `metrics` | 自绘 SVG / HTML：零依赖、原生表格语义、可复制数据 |

| kind | 用于 | `data` 形状 |
|---|---|---|
| `bar` / `line` / `area` / `radar` | 分类对比 / 趋势 / 面积 / 多维对比 | `{ labels: string[], series: [{ name, values: number[] }], unit?: string }` |
| `waterfall` | 增减分解 / 利润桥 | `{ labels: string[], values: number[], unit?, totalLabel? }` |
| `pie` / `doughnut` | 占比 | `{ slices: [{ label, value }], unit?: string }` |
| `scatter` | 相关性 / 趋势线 | `{ points: [{ x, y, label? }], xLabel?, yLabel? }` |
| `compare` | 对比表 | `{ columns: string[], rows: string[][] }` |
| `timeline` | 步骤 / 时间线 | `{ items: [{ at?, label, detail? }] }` |
| `gantt` | 排期 / 长任务 | `{ tasks: [{ label, start, end, group? }], unit?: string }` |
| `heatmap` | 矩阵 / 密度 | `{ rows: string[], columns: string[], values: number[][], unit? }` |
| `metrics` | KPI 巡检 | `{ items: [{ label, value, delta?, trend?: "up"|"down"|"flat" }], unit?: string }` |
| `flow` | 流程 / DAG | `{ nodes: [{ id, label, detail? }], edges: [{ from, to, label? }] }`（必须是 DAG） |

### 样式（`style`）

数据不变、只改呈现，模型可以按需选择，或在 `edit_visual` 里随时调整：

| 字段 | 取值 | 作用 |
|---|---|---|
| `orientation` | `vertical` / `horizontal` | bar 的方向（横向条形图） |
| `stacked` | boolean | bar/line/area 堆叠 |
| `curve` | `linear` / `smooth` / `step` | 折线形态（阶梯线） |
| `points` | boolean | 是否画数据点 |
| `values` | boolean | 是否在图上标注数值 |
| `legend` | `auto` / `bottom` / `top` / `none` | 图例 |
| `grid` | boolean | 网格线 |
| `palette` | `default` / `mono` / `cool` / `warm` / `success` | 配色（全部来自主题 token） |
| `height` | 160–420 | 图表高度 |
| `density` | `compact` / `normal` | 卡片密度 |
| `trendLine` | boolean | 散点线性拟合 |

上限：`labels` ≤ 40、`series` ≤ 6、`rows` ≤ 30、`columns` ≤ 8、`items` ≤ 30、`tasks` ≤ 20、
`metrics` ≤ 12、`slices` ≤ 12、`points` ≤ 240、heatmap 12×12（超出自动裁剪）。

## 怎么用

### 让模型自己画

不需要记参数，直接说需求即可，例如：

> 「把三种缓存方案的命中率、内存占用和实现复杂度做个对比，画出来。」

模型会自己决定用 `compare` 还是 `bar`，把结论写进 `note`。适合的场景：

- 方案 / 模型 / 配置的对比（`compare`、`bar`）
- 趋势、跑分、命中率（`line`、`bar`）
- 排查过程、发布步骤、事故时间线（`timeline`）

### 更多图型示例

```jsonc
{ "kind": "pie", "title": "时间分布", "data": { "slices": [{ "label": "编码", "value": 62 }, { "label": "评审", "value": 18 }, { "label": "其他", "value": 20 }], "unit": "%" } }
{ "kind": "gantt", "title": "发布排期", "data": { "tasks": [{ "label": "实现", "start": 1, "end": 4 }, { "label": "测试", "start": 4, "end": 6 }], "unit": "d" } }
{ "kind": "metrics", "title": "巡检快照", "data": { "items": [{ "label": "p95", "value": "120", "delta": "12ms", "trend": "up" }], "unit": "ms" } }
{ "kind": "waterfall", "title": "利润桥", "data": { "labels": ["收入", "成本", "税费"], "values": [120, -45, -15], "unit": "k", "totalLabel": "净利" } }
{ "kind": "heatmap", "title": "请求热力", "data": { "rows": ["周一", "周二"], "columns": ["00", "08", "16"], "values": [[2, 7, 11], [4, 9, 6]] } }
```

带样式与局部修改：

```jsonc
// 横向堆叠 + 数值标签
{ "kind": "bar", "title": "季度收入", "style": { "orientation": "horizontal", "stacked": true, "values": true },
  "data": { "labels": ["Q1", "Q2"], "series": [{ "name": "新客户", "values": [12, 18] }, { "name": "老客户", "values": [30, 28] }] } }

// 改上一张图：只传要改的字段（Agent 调用 edit_visual）
{ "patch": { "style": { "curve": "step", "points": false }, "title": "季度收入（阶梯）" } }
```

### 手动给一份规格

想精确控制时，直接给 JSON（模型也可以照着调用）：

```jsonc
{
  "kind": "bar",
  "title": "三种缓存方案的命中率",
  "subtitle": "benchmark，2026-11",
  "data": {
    "labels": ["LRU", "LFU", "TTL"],
    "series": [{ "name": "命中率", "values": [82, 91, 76] }],
    "unit": "%"
  },
  "note": "LFU 命中率最高，但内存占用约为 LRU 的 2.3 倍。"
}
```

### 工具参数参考

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `kind` | `bar \| line \| compare \| timeline` | 是 | 图型 |
| `title` | string | 是 | 卡片标题（≤ 120 字） |
| `subtitle` | string | 否 | 副标题（≤ 160 字），常放数据来源 |
| `note` | string | 否 | 一句话结论，渲染在图下方 |
| `style` | object | 否 | 上表样式字段，只影响呈现 |
| `data` | object | 是 | 按 `kind` 取上表形状 |

### `edit_visual`（基于图修改）

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `patch` | object | 是 | 局部 spec：`title` / `subtitle` / `note` / `kind` / `style` / `data`；对象合并、数组替换、`null` 删除 |
| `target` | string | 否 | 指定要改的图（工具 call id）；省略则改本会话最近一张 |

它从会话日志里找到上一张图，把 patch 合并后重新渲染——不用把整份数据再发一遍，
也不会重新调用模型。

卡片底部有三个本机操作：**复制数据**（规格 JSON）、**查看数据**（展开原始规格）、
**导出 PNG**（仅 Chart.js 图型）。它们不影响会话，也不回填模型。

## 设计：为什么能重放

```
模型调用 show_visual(规格)
        │
        ▼
Host 校验 / 裁剪 / 规范化
        │  output.presentationMeta → 持久化到 tool/result.meta
        ▼
会话日志（唯一事实来源）
        │
        ▼
Client 在 tool.call.toolview(key=show_visual) 渲染
```

- 卡片数据来自**日志**而不是内存，所以 fork / resume / 刷新行为一致；
- 不新增 session 事件类型，不破坏日志兼容；
- 规格里没有可执行内容，最坏情况只是"画得不好看"，不会执行任意代码。

## 主题、本地化、无障碍

- 颜色：`--dsw-alias-bg-layer-1`、`--dsw-alias-border-l1`、`--dsw-alias-label-primary`、
  `--dsw-alias-label-secondary`、`--dsw-alias-brand-primary` 等，深色主题自动切换；
- 文案：`locale/en.json`、`locale/zh.json`，卡片控件跟随界面语言；
- 图表带 `role="img"` 与 `aria-label`，表格保留原生 `<table>` 语义；键盘可聚焦复制/查看按钮。

## 故障排查

| 现象 | 原因 / 处理 |
|---|---|
| 只有一行工具调用，看不到卡片 | 卡片在工具调用行里，点开那一行；或按 `Cmd/Ctrl + R` 刷新页面（安装后首次需要） |
| 报 `tool "show_visual" returned invalid output: value is not lossless JSON` | 旧版本对可选字段处理有 bug；升级到本仓库最新代码并**重启 dsh 进程** |
| 改了 `index.js` 没生效 | Host 模块按代际加载，重启进程；只改 `client.js` 刷新页面即可 |
| 颜色发灰 / 与主题不符 | 宿主版本较旧、缺少 `--dsw-alias-*` token；升级 DSH 或临时用默认色 |
| 模型不调用工具 | 在提示里明确说「画个图 / 用 show_visual」；或检查该 Agent 预设是否限制了工具集 |
| TUI / 日志里只有文字 | 预期行为：非 Web 客户端走文本回退（列表或 Markdown 表） |
| 「导出 PNG」按钮缺失 | 仅 Chart.js 图型（bar/line/area/pie/doughnut/scatter/radar）支持；自绘 SVG 类在路线图里 |

卸载：

```text
plugin_manager({ action: "remove_bundle", target: "dsh-inline-visuals" })
```

历史会话里已渲染的卡片会回退为通用工具行（`meta` 仍留在日志里，数据不丢）。

## 工程化

```
src/host/              Host 源码：limits / normalize / text / index
src/client/            Client 源码：theme、use-theme、chart-config、cards/*
scripts/build.mjs      esbuild 构建：index.js（ESM）+ client.js（单文件，Chart.js 内联、react external）
scripts/demo.mjs       生成 docs/demo.png（本地 Chrome，维护者脚本）
src/host/style.js      样式校验与默认值
src/host/patch.js      edit_visual 的合并语义
src/host/history.js    从会话日志找上一张图
publish/              发布素材：release notes、公告、社区讨论稿、上线清单
tests/                 node:test：normalize / text / chart-config
.github/workflows/ci.yml  npm ci → test → build → 校验产物无漂移
```

- `index.js` / `client.js` 是**构建产物但刻意提交**：Plugin Manager 以目录 `link` 安装，
  必须做到零构建即可运行；CI 会检查产物是否与 `src/` 同步（`git diff --exit-code`）；
- Chart.js 只作为 devDependency 参与构建，运行时完全内联进 `client.js`；
  React 由宿主的模块表提供（`require('react')`），绝不打包第二份实例；
- 测试规模：32 个 `node:test` 用例（归一化 14 种 kind、样式校验、文本回退、Chart.js 配置变体、patch/history、CSV、追问文案、客户端 bundle 冒烟）；
- **发布流水线**：推送 `v*` tag 触发 [`.github/workflows/publish.yml`](../.github/workflows/publish.yml)：
  `npm ci → test → build → 产物校验 → npm publish --provenance → GitHub Release`，
  配置见 [`RELEASING.md`](../RELEASING.md)；
- 本地命令：

```bash
npm ci
npm test        # node --test
npm run build   # 重新生成 index.js / client.js
npm run check   # build + test
```

### 加一种新图型

1. `src/host/limits.js` 加 kind；`normalize.js` 加 normalizer；`text.js` 加文本回退；
2. `src/client/chart-config.js`（Chart.js 类）或 `src/client/cards/*.js`（自绘类）实现渲染，
   并在 `src/client/cards/InlineVisual.js` 接线；
3. 补测试、更新 README 表格、跑 `npm run build && npm test`。

## 路线图

- [x] v0.1：四种图型、主题适配、中英文案、确定性测试、安装验证
- [x] v0.2：11 种图型、文本回退、PNG 导出、Chart.js 内联、`src/` 构建、测试与 CI
- [x] v0.3：13 种图型（+ waterfall / heatmap）、`style` 变体、`edit_visual` 局部修改
- [x] **v1.0**：14 种图型（+ flow）、点选追问、CSV/SVG 导出、reduce-motion、32 个测试、规格冻结
- [ ] v1.1：sankey / bullet、样式预设、规格体积告警
- [ ] v1.2：挂起式输入组件（把用户选择作为工具结果回传模型）

## 稳定性

- **公开契约**：spec `version: 3`；`show_visual` / `edit_visual` 与 `style` 词表由测试覆盖；
- 旧 spec（v1/v2）继续可渲染，历史会话不会因升级打不开；
- 破坏性改动只在大版本发生，并保持旧 spec 可读。

## 贡献

欢迎 issue / PR。请保持：不执行模型输出、不新增 session 事件类型、样式只用主题 token。
新增图型请附测试与截图。

## License

[MIT](../LICENSE) © 2026 YLifeOnlyOnce
