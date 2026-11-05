# 能力宣传 · PROMO KIT

> 给这个插件做发布/传播用。原则：**只讲能被验证的事实**（可重放、声明式、主题适配、MIT），
> 不夸大、不承诺官方采纳、不刷屏。

## 定位（一句话）

- 中文：**让模型在对话里画出可重放的图**——不是截图，是存在会话日志里、刷新重开都还在的卡片。
- English: **Charts the model can draw, and the session can replay** — not a screenshot.

## 目标人群

1. 经常让 Agent 做方案对比、跑分、排查复盘的人；
2. 写 DSH 插件、想找一个「Host 工具 + Client 卡片」完整范例的开发者；
3. 关注 Agent 可观测性 / 可解释性的团队。

## 三个卖点（按可信度排序）

1. **可重放**：规格持久化在 `tool/result.meta`，刷新 / 重开 / fork 都渲染同一张图，不需要二次调用模型；
2. **声明式、安全**：模型提交的是数据规格，插件不执行模型输出、不加载外链，超限自动裁剪；
3. **原生体验**：主题 token + locale + toolview 槽位，深浅色与中英文都不破；零依赖、MIT。

## 素材

| 文件 | 用途 |
|---|---|
| `docs/banner.png` | 仓库头图 / X 卡片 / 公众号头图 |
| `docs/before-after.png` | 首图：文字 vs 卡片，一眼说明价值 |
| `docs/demo.png` | 四种图型总览，README 与 Discussion 配图 |

## 文案包

### EN · X thread（3 条）

1. > DSH plugin: `show_visual` lets the model draw bar / line / compare / timeline cards **inside the chat**.
   > The trick: the spec is persisted on the tool result, so replay needs no model call.
   > MIT, ~300 lines of JS. → <repo>
2. > Why not let the model emit SVG/HTML? Because it must be replayable and theme-safe.
   > Here the model emits *data*, the plugin renders with host theme tokens. Refresh, reopen, fork — same card.
3. > Install: `plugin_manager install_bundle <path>` · 4 kinds · en/zh · tests included.
   > Feedback welcome, especially: which kind should come next (pie? flow? gantt?). → <repo>

### EN · Reddit / HN / forum（一段）

> **A DSH plugin that turns model output into replayable charts**
>
> DSH's tool results are durable session events, so I built `show_visual`: the model submits a small
> declarative spec (bar / line / compare / timeline), the Host persists it via `output.presentationMeta`,
> and the Client renders a themed card in `tool.call.toolview`. Because the data lives in the session log,
> refreshing, reopening or forking the session renders the same chart without another model call.
> Spec is data, not code — no execution, no external URLs. ~300 lines of JS, MIT, tests included.
> Repo: <repo> — would love feedback on which visual kinds to add next.

### ZH · 微博（≤ 140 字）

> 给 DSH 写了个插件：模型能把分析画成图了。bar/line/对比表/时间线，图存在会话日志里——刷新、重开、
> fork 都还在，不用再调模型。声明式规格，不执行模型输出；主题 token 适配深浅色。MIT，欢迎拍砖。
> <repo> #DSH #开源

### ZH · 即刻 / 朋友圈（一段）

> 周末给 DeepSeek Harness 写了个插件 `dsh-inline-visuals`：模型不再只回你五段数字，而是调用
> `show_visual` 画一张卡片（柱状/折线/对比表/时间线）。关键是它把规格持久化在会话日志里，
> 所以刷新、重开、fork 都能重放，不用二次调模型。声明式规格（不执行代码、不加载外链），
> 主题 token + 中英文案，MIT，带零依赖测试。想听大家的意见：下一个图型该加什么？

### ZH · 公众号

- 标题候选：
  1. 《让模型画图，而不是写五段数字：一个 DSH 插件的实现笔记》
  2. 《可重放的图表卡片：DSH Inline Visuals 设计复盘》
  3. 《300 行 JS 给 Agent 加一双眼睛》
- 摘要：模型输出结构化数据却只能读文字？本文讲一个 DSH 插件的完整实现：声明式规格、会话日志持久化、
  toolview 槽位渲染、主题与本地化，以及踩过的「非 lossless JSON」坑。

## 发布清单

- [ ] 仓库 About 一句话（中英）
- [ ] Topics：`deepseek-harness`、`dsh`、`dsh-plugin`、`visualization`、`charts`
- [ ] README 首图换成 `docs/banner.png`（已做）
- [ ] 在 DSH GitHub Discussions 发一条 Show and tell（草稿见 dsh-plugin-ideas/publish）
- [ ] 发布后回一轮「收到哪些反馈 / 下一步」的更新帖

## 不要做

- 不要说「官方插件」「DeepSeek 官方推荐」；
- 不要承诺没实现的功能（导出 PNG、输入型交互都还在路线图里）；
- 不要一次贴到所有社区；先 Discussions，再中文社区，观察反馈再扩散。
