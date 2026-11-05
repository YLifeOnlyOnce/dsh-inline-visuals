# Inline Visuals · 内联可视化

[English](README.md) · **简体中文**

![Inline Visuals banner](docs/banner.png)

### 让模型在对话里画出可重放的图。

一个 [DeepSeek Harness](https://deepseek-harness.github.io/deepseek-harness/) 插件：把数字变成**对话里的图**——
柱状图、折线图、对比表、时间线、甘特图、热力图、流程图、KPI 卡片，共 **14 种**，
还支持样式调整、导出，以及点一下就能追问。

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![dsh](https://img.shields.io/badge/DeepSeek%20Harness-0.2.1--rc.3-1f6feb.svg)](https://deepseek-harness.github.io/deepseek-harness/)
[![kinds](https://img.shields.io/badge/kinds-14-0a6b3d.svg)](#它能画什么)
[![ci](https://github.com/YLifeOnlyOnce/dsh-inline-visuals/actions/workflows/ci.yml/badge.svg)](https://github.com/YLifeOnlyOnce/dsh-inline-visuals/actions/workflows/ci.yml)

![14 种图型](docs/demo.png)

## 为什么你会喜欢它

- **一眼看懂，而不是读五段文字。** 「三种缓存策略怎么选」直接变成一张能扫读的卡片。
- **图会一直在。** 卡片存在会话日志里——刷新、重开、fork 之后还在。
- **想问就问。** 点一下图上的数据点，输入框自动出现一条针对性的追问。
- **说一句就能改。** 「改成横向、堆叠、加数值」——Agent 用 `edit_visual` 打补丁，而不是重画整张图。
- **原生、安全。** 跟随宿主主题（深浅色、中英文）；模型提交的是**数据**，不是 HTML/JS。
- **方便分享。** 复制 JSON/CSV，导出 PNG/SVG。

## 30 秒安装

在 DSH 会话里贴一行：

```text
plugin_manager({ action: "install_bundle", target: "dsh-inline-visuals" })
```

不用 clone、不用配置。看到 `show_visual`（和 `edit_visual`）出现在工具列表里就成功了。

> 需要 DeepSeek Harness `v0.2.1-rc.3` 或更高版本。想从源码装？用
> `github:YLifeOnlyOnce/dsh-inline-visuals`，或把本地 clone 的绝对路径交给 Plugin Manager
> （见[技术参考](docs/reference.zh.md)）。

## 试试看

直接对模型说：

> **「把三种缓存策略的命中率、内存和复杂度画成图。」**

> **「改成横向堆叠，再打开数值标签。」**

> **「把我们的发布流程画成流程图。」**

> **「上周的流量用热力图看一下。」**

## 它能画什么

| | |
|---|---|
| **图表** | bar · line · area · pie · doughnut · scatter · radar · waterfall |
| **其他** | 对比表 · 时间线 · 甘特图 · 热力图 · 流程图 · KPI 卡片 |

每张图都支持**样式**：横向/堆叠、阶梯线、数值标签、图例、网格、5 套配色、高度/密度、散点趋势线。

![接入前后](docs/before-after.png)

## 它是怎么工作的（一句话）

模型提交一份很小的声明式规格 → 插件校验并写进工具结果 → 你的客户端用宿主主题把它渲染出来。
因为数据在会话日志里，重放不需要再调一次模型。

## 常见问题

**要配置什么吗？** 不用，装完直接问。

**图存在哪？** 会话日志（`tool/result.meta`），不是单独的文件。

**会把我的数据发到别处吗？** 不会。插件不发网络请求；模型本来就看到了你输入的内容。

**能导出数字吗？** 可以复制 JSON/CSV；图表导出 PNG，自绘卡片导出 SVG。

**哪些图能点选？** 目前 Chart.js 图型支持点选追问，其他类型在路线图里。

**纯文本客户端呢？** 会收到紧凑的文字摘要，内容不丢。

## 工程与可信度

- 33 个测试（`node:test`），每次 push 跑 CI，tag 触发 npm 发布（带 provenance）
- Host 半约 26 KB；浏览器半是单文件（约 214 KB，Chart.js 内联，React 与宿主共享）
- 规格 `version: 3` 已冻结，v1/v2 旧规格仍可渲染

完整参数、限制与开发说明：**[docs/reference.zh.md](docs/reference.zh.md)**（[English reference](docs/reference.md)）。
更新日志 [CHANGELOG.md](CHANGELOG.md) · 贡献指南 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

[MIT](LICENSE) © 2026 YLifeOnlyOnce
