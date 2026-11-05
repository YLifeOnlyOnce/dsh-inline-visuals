# 验证记录 · Inline Visuals v0.1

环境：DSH `v0.2.1-rc.3`，profile `web`，工作区 `/Users/xiangbo/AAAAAgent/zero`。
时间：2026-11-06。

## 1. 安装

```text
plugin_manager({ action: "install_bundle", target: "/Users/xiangbo/AAAAAgent/zero/dsh-inline-visuals" })
→ application: "applied" · warnings: [] · pnpm exit 0
→ profile 依赖：{"dsh-inline-visuals": "link:.../dsh-inline-visuals"}
```

## 2. 工具注册

- 安装后下一请求的工具表出现 `show_visual`（参数 schema 与实现一致）。
- 调用 1（bar）返回：`Rendered a bar visual (30 个 DSH 插件创意按方向分布)`。
- 调用 2（timeline）返回：`Rendered a timeline visual (Inline Visuals 里程碑)`。
- 调用 3（不带可选字段的 timeline）在**旧模块代际**下报 `value is not lossless JSON`；
  已定位为 `undefined` 键问题并修复（`index.js`），`tests/normalize.test.mjs` 覆盖该回归；
  运行中进程需重启后加载新模块代际。

## 3. Client 卡片

```text
Slots.listSubTree(root="tool.call.toolview")
→ occupants 包含 { registrant: "Gb", key: "show_visual", active: true }
```

## 4. 重放数据

会话日志 `~/.dsh/sessions/--Users-xiangbo-AAAAAgent-zero--/session-37253961…/session.v4.jsonl.zstd`
解压后，`tool/result` 事件带完整规格：

| seq | kind | title |
|---|---|---|
| 789 | bar | 30 个 DSH 插件创意按方向分布 |
| 809 | timeline | Inline Visuals 里程碑 |

说明：卡片数据来自会话日志的 `meta`，刷新 / 重开 / fork 不需要重新调用模型。

## 5. 单元测试

```text
$ node tests/normalize.test.mjs
normalize.test.mjs: all checks passed
```

覆盖：四种 kind、可选字段不产生 `undefined`、labels/values 裁剪到 40、未知 kind 拒绝、
`presentationMeta` 原样、`render` 返回 text 块。

## 6. 未覆盖

- 浏览器内实际视觉（无浏览器控制）：浅色/深色、中文/英文文案需人工确认；
- 页面刷新后的重放渲染；
- 卸载后的回退表现。


## 7. v0.2.0（2026-11-06，本轮）

| 检查 | 结果 |
|---|---|
| `npm test`（node:test） | 11/11 通过：11 种图型归一化、可选字段、裁剪上限、非法输入、文本回退、Chart.js 配置形状 |
| `npm run build` | `index.js` 13.2 KiB（ESM）；`client.js` 205.3 KiB（Chart.js minified 内联，`react` external） |
| 产物一致性 | `client.js` 内可检出 `require("react")`，由宿主模块表提供；构建脚本可重复执行 |
| 视觉验证 | `scripts/demo.mjs` 用 headless Chrome + 真实 `buildChartConfig` 渲染 9 种图型到 `docs/demo.png`，确认 Chart.js 配置可出图 |
| 文本回退 | `renderText()` 覆盖 11 种 kind，长列表截断 |
| 未验证 | 运行中的 dsh 进程仍加载 v0.1 Host 模块代际；新版本的工具注册与卡片渲染需要**重启 dsh** 后人工确认 |


## 8. v0.2.0 live 验证（2026-11-06，包名迁移后）

包名从 `@community/...` 迁移到 `@oi-yao/...` 后，在运行中的 `web` profile 上完成了一次真实安装：

```text
plugin_manager remove_bundle @community/dsh-inline-visuals   → applied
plugin_manager install_bundle /abs/path/dsh-inline-visuals  → applied · dsh-inline-visuals 0.2.0
profile dependencies → {"dsh-inline-visuals": "link:.../dsh-inline-visuals"}
profile bundles      → [..., "dsh-inline-visuals"]
```

**live 证据**：调用 `show_visual({ kind: "pie", ... })` 成功（v0.1 不支持该 kind），
返回的是 v0.2 的**文本回退**（`- Chart.js 图表: 7种 (64%) …` + note），说明新 Host 模块代际已加载。

**未完成**：客户端卡片渲染需要页面刷新后人工确认（Chart.js 图型、PNG 导出按钮）；
`npm publish --dry-run` 已通过（85.6 kB / 10 files / public），正式发布待 npm 账号与 Trusted Publisher 配置。


## 9. v0.3.0（2026-11-06）

| 检查 | 结果 |
|---|---|
| `npm test` | 26/26 通过：13 种 kind 归一化、`style` 校验/裁剪、waterfall/heatmap 文本回退、横向/堆叠/阶梯/数值标签/趋势线的 Chart.js 配置、patch 合并、history 查找、tools 注册、客户端 bundle 冒烟（双槽位） |
| 构建 | `index.js` 约 18 KiB；`client.js` 约 210 KiB（Chart.js 内联，react external） |
| 视觉 | `scripts/demo.mjs` 用 headless Chrome + 真实 `buildChartConfig` 渲染 13 种图型与样式变体（横向堆叠、阶梯线、趋势线、瀑布、热力），见 `docs/demo.png` |
| edit_visual | 单测覆盖：从 session `tool/result.meta` 找到上一张图、patch 合并、无图时报错；同一套测试验证 `execute()` 返回 rejected Promise |
| 未验证 | 运行中 dsh 需要重启/重装才能加载 v0.3 Host 模块；卡片视觉需浏览器人工确认 |


## 10. v0.3.0 live 验证（2026-11-06，重装后）

在运行中的 `web` profile 上 `remove_bundle` + `install_bundle`（本地 link）后，新 Host 模块代际立即生效：

| 检查 | 结果 |
|---|---|
| 工具列表 | `Tool.listTools` 同时出现 `show_visual`（13 kind + style）与 `edit_visual` |
| 新图型 | `show_visual({kind:"waterfall", style:{values:true}, ...})` 成功，返回 v0.3 文本回退（`+120k (→ 120k)`、`净利: 60k`） |
| 基于图修改 | `edit_visual({patch:{title, note, style:{palette:"warm", values:true}}})` 成功：从会话日志取到上一张图，合并 patch 后重新渲染，未重发 data、未重调模型 |
| 说明 | 文本回退与工具结果已验证；浏览器内的 Chart.js 卡片与 PNG 导出需人工刷新页面确认 |


## 11. v1.0.0（2026-11-06）

| 检查 | 结果 |
|---|---|
| `npm test` | 32/32 通过：14 种 kind 归一化（含 flow DAG/环/未知节点）、样式、文本回退、Chart.js 配置、patch/history、CSV、追问文案、客户端 bundle（双槽位） |
| 构建 | `index.js` 约 26 KiB；`client.js` 约 214 KiB（Chart.js 内联，react external） |
| 交互 | 点选数据点 → 选中值 chip → 「追问这点」经 `inputActions.captureInsertion/insertText` 插入追问；客户端 bundle 冒烟覆盖注册 |
| 导出 | 复制 JSON / CSV；Chart.js 图型导出 PNG；heatmap/flow/gantt 导出 SVG |
| reduce motion | `prefers-reduced-motion: reduce` 时动画时长 0 |
| live 安装 | `install_bundle` → 1.0.0；`show_visual({kind:"flow"})` 成功，文本回退列出节点与边 |
| live 修改 | `edit_visual({patch:{title,note}})` 正确命中 flow（修复前会跳到更早的 waterfall） |
| 未验证 | 浏览器内点选/导出交互需人工确认；npm 发布被 token 2FA 权限阻塞（等更新） |


## 12. 1.0.0 发布流水线（2026-11-06）

- 包名改为无 scope 的 `dsh-inline-visuals`（原 `@oi-yao/...` scope 在 npm 不存在）；
- 推 `v1.0.0` tag 后 Publish 工作流成功：测试、构建、打包、`npm publish --provenance`，
  并创建 GitHub Release `v1.0.0`（附 tarball）；
- 但 npm 走的是 **staged publishing**：registry 出现 `0.0.0-stage` 占位版本，
  真实 `1.0.0` 等待人工 2FA 审批（`npm stage approve <stage-id>`）；
- 审批通过后需重新验证 `npm view dsh-inline-visuals version` 与 `install_bundle` 从 npm 安装。
