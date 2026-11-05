# 验证记录 · Inline Visuals v0.1

环境：DSH `v0.2.1-rc.3`，profile `web`，工作区 `/Users/xiangbo/AAAAAgent/zero`。
时间：2026-11-06。

## 1. 安装

```text
plugin_manager({ action: "install_bundle", target: "/Users/xiangbo/AAAAAgent/zero/dsh-inline-visuals" })
→ application: "applied" · warnings: [] · pnpm exit 0
→ profile 依赖：{"@community/dsh-inline-visuals": "link:.../dsh-inline-visuals"}
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
