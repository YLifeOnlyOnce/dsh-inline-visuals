# Inline Visuals · 内联可视化（`@community/dsh-inline-visuals`）

> RFC-0001 的参考实现：一个声明式可视化工具 + 一个工具卡片渲染器。
> 数据存在会话日志的 `tool/result.meta` 里，所以刷新、重开、fork 都能重放同一张图。

![Inline visuals demo](docs/demo.png)

*English: a DSH plugin that lets the model draw small, replayable charts (bar / line / compare /
timeline) inside the conversation. The spec is persisted on the tool result, so replay needs no
model call. Install with `plugin_manager install_bundle`. MIT licensed.*

## 它做什么

模型可以调用 `show_visual`，传入受限的声明式规格，而不是写 HTML/SVG：

| kind | 用于 | 数据形状 |
|---|---|---|
| `bar` | 分组柱状图 | `{ labels, series: [{ name, values }], unit? }` |
| `line` | 多系列折线图 | 同上 |
| `compare` | 对比表 | `{ columns, rows }` |
| `timeline` | 时间线/步骤条 | `{ items: [{ at?, label, detail? }] }` |

卡片跟随浅色/深色主题，支持「复制数据」「查看数据」；规格是数据不是代码，不执行
模型输出、不加载外链，超出上限自动裁剪。

## 安装

```bash
git clone https://github.com/YLifeOnlyOnce/dsh-inline-visuals.git
```

然后在 DSH 会话里把克隆下来的**绝对路径**交给 Plugin Manager：

```text
plugin_manager({ action: "install_bundle", target: "/abs/path/to/dsh-inline-visuals" })
```

安装后 `show_visual` 会出现在 Agent 的工具列表里，插件页出现「内联可视化」条目。

## 示例调用

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

## 结构

```
index.js              # Host：注册 show_visual，output.presentationMeta 持久化规格
client.js             # Client：tool.call.toolview(key=show_visual) 里的 SVG/表格渲染器
cordis.patch.yml      # 一行 insert
locale/{en,zh}.json   # 插件名/描述与卡片文案
icon.svg
tests/normalize.test.mjs
docs/demo.png         # 四种图型的渲染效果
VERIFICATION.md       # 安装、注册、重放数据的验证记录
```

## 测试

```bash
node tests/normalize.test.mjs   # 无依赖：裁剪、拒绝、可选字段、输出契约
```

## 开发提示

- 修改 Host 代码（`index.js`）后，运行中的 dsh 进程不会加载新模块代际，重启后生效；
- 修改 Client 代码（`client.js`）同理，刷新页面观察；
- 卡片颜色全部来自 `--dsw-alias-*` token，不要在组件里写死颜色。

## 已知限制

- 交互只在本机（复制/查看数据），不回填模型；输入型组件见 RFC 的开放问题；
- 规格上限：labels ≤ 40、series ≤ 6、rows ≤ 30、items ≤ 30；
- 需要宿主主题 token（`--dsw-alias-*`），旧版本缺 token 时颜色可能退化为默认。

## 卸载

```text
plugin_manager({ action: "remove_bundle", target: "@community/dsh-inline-visuals" })
```

卸载后工具与卡片消失，历史会话里已渲染的卡片回退为通用工具行（meta 仍留在日志里）。

## License

[MIT](LICENSE)
