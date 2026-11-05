# Inline Visuals

![Inline Visuals banner](docs/banner.png)

**让模型在对话里画出可重放的图。** · A DeepSeek Harness plugin that renders small, replayable
charts (bar / line / compare / timeline) inline in the conversation.

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![dsh](https://img.shields.io/badge/DeepSeek%20Harness-0.2.1--rc.3-1f6feb.svg)](https://deepseek-harness.github.io/deepseek-harness/)
[![kinds](https://img.shields.io/badge/kinds-bar%20%7C%20line%20%7C%20compare%20%7C%20timeline-0a6b3d.svg)](#它能画什么)

模型不再只回你五段数字——它调用 `show_visual` 工具，提交一份**声明式规格**（不是 HTML、不是 SVG 代码），
DSH 把它存进会话日志，前端渲染成一张跟随主题的卡片。刷新、重开、fork 都能重放，不用再调模型。

![before/after](docs/before-after.png)

## 为什么值得装

- **可重放**：规格通过 `output.presentationMeta` 持久化在 `tool/result.meta` 里，属于会话日志的一部分；
- **安全**：规格是数据不是代码，不执行模型输出、不加载外链，超限自动裁剪；
- **原生感**：颜色全部来自 `--dsw-alias-*` 主题 token，中英文案走宿主 locale，深浅色都不破；
- **零依赖**：Host 半是纯 ESM，Client 半只依赖宿主提供的 `react`，没有构建步骤。

## 十秒安装

```bash
git clone https://github.com/YLifeOnlyOnce/dsh-inline-visuals.git
```

在 DSH 会话里把**绝对路径**交给 Plugin Manager：

```text
plugin_manager({ action: "install_bundle", target: "/abs/path/to/dsh-inline-visuals" })
```

看到 `application: "applied"` 即成功。之后：

- Agent 的工具列表里出现 `show_visual`；
- 侧边栏 Plugins 页出现「内联可视化 / Inline Visuals」条目（原创图标 + 中英文描述）。

> 要求 DSH ≥ `v0.2.1-rc.3`（依赖 `presentationMeta` 输出契约与 `tool.call.toolview` 槽位）。
> 更换插件代码后需要重启 dsh 进程才会加载新的 Host 模块代际；只改 Client 刷新页面即可。

## 它能画什么

![四种图示](docs/demo.png)

| kind | 用于 | `data` 形状 |
|---|---|---|
| `bar` | 分组柱状图（支持负值） | `{ labels: string[], series: [{ name, values: number[] }], unit?: string }` |
| `line` | 多系列折线图 | 同上 |
| `compare` | 对比表 | `{ columns: string[], rows: string[][] }` |
| `timeline` | 时间线 / 步骤条 | `{ items: [{ at?, label, detail? }] }` |

上限：`labels` ≤ 40、`series` ≤ 6、`rows` ≤ 30、`columns` ≤ 8、`items` ≤ 30（超出自动裁剪）。
单条规格建议控制在 32KB 内。

## 怎么用

### 让模型自己画

不需要记参数，直接说需求即可，例如：

> 「把三种缓存方案的命中率、内存占用和实现复杂度做个对比，画出来。」

模型会自己决定用 `compare` 还是 `bar`，把结论写进 `note`。适合的场景：

- 方案 / 模型 / 配置的对比（`compare`、`bar`）
- 趋势、跑分、命中率（`line`、`bar`）
- 排查过程、发布步骤、事故时间线（`timeline`）

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
| `data` | object | 是 | 按 `kind` 取上表形状 |

卡片右下角有两个本机操作：**复制数据**（规格 JSON）和**查看数据**（展开原始规格）。
它们不影响会话，也不回填模型。

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

卸载：

```text
plugin_manager({ action: "remove_bundle", target: "@community/dsh-inline-visuals" })
```

历史会话里已渲染的卡片会回退为通用工具行（`meta` 仍留在日志里，数据不丢）。

## 开发

```
index.js              # Host：注册 show_visual、校验/裁剪、presentationMeta
client.js             # Client：tool.call.toolview 渲染器（SVG / table / 时间线）
cordis.patch.yml      # 一行 insert
locale/{en,zh}.json   # 插件名/描述与卡片文案
icon.svg              # 原创图标
tests/normalize.test.mjs
docs/                 # 截图与宣传图
VERIFICATION.md       # 安装、注册、重放数据的验证记录
```

测试（无依赖）：

```bash
node tests/normalize.test.mjs
```

### 加一种新图型

1. `index.js` 的 `KINDS` 加名字，补一个 `normalizeXxx(data)`；
2. `client.js` 的 `ChartBody` 加分支，写一个 `Xxx({ spec, t })` 组件；
3. 补一条测试，跑 `node tests/normalize.test.mjs`。

总共不到 100 行。

## 路线图

- [x] v0.1：四种图型、主题适配、中英文案、确定性测试、安装验证
- [ ] v0.2：导出 PNG、键盘导航完善、规格体积告警
- [ ] v0.3：更多图型（pie / flow / gantt）、图表模板（配色预设）
- [ ] v1.0：输入型交互（用户在卡片里选择并把结果传回模型）

## 贡献

欢迎 issue / PR。请保持：不执行模型输出、不新增 session 事件类型、样式只用主题 token。
新增图型请附测试与截图。

## License

[MIT](LICENSE) © 2026 YLifeOnlyOnce
