## 中文公告

**短版（微博 / 即刻，≤ 140 字）**

> 给 DSH 写了个插件：模型能把分析画成图了，11 种——柱状/折线/饼/散点/雷达、对比表、时间线、甘特、KPI。
> 图存在会话日志里，刷新、重开、fork 都还在，不用再调模型。声明式、不执行代码，有测试和 CI，MIT。
> 一行安装：`install_bundle @oi-yao/dsh-inline-visuals`。欢迎拍砖。

**长版（微信群 / 公众号摘要）**

> 周末给 DeepSeek Harness 写了个插件 `dsh-inline-visuals`：模型不再只回你五段数字，而是调用
> `show_visual` 画一张卡片——11 种图型（7 种 Chart.js 图表 + 对比表 / 时间线 / 甘特 / KPI）。
> 关键是它把规格持久化在会话日志里，所以刷新、重开、fork 都能重放，不用二次调模型。
> Chart.js 内联进单文件、React 用宿主的；声明式规格不执行代码，主题 token + 中英文案，
> 12 个测试 + CI。一行安装：`plugin_manager install_bundle @oi-yao/dsh-inline-visuals`。
> 仓库：https://github.com/YLifeOnlyOnce/dsh-inline-visuals

**公众号标题候选**

1. 《让模型画图，而不是写五段数字：一个 DSH 插件的实现笔记》
2. 《可重放的图表卡片：DSH Inline Visuals 设计复盘》
3. 《从 4 种图到 11 种：一次插件工程化改造》
