## English announcement

**X / Twitter thread**

1. > DSH plugin: `show_visual` lets the model draw **11 kinds** of visuals inside the chat —
   > 7 Chart.js charts plus compare tables, timelines, gantt and KPI tiles.
   > The spec is persisted on the tool result, so replay needs no model call. MIT.
   > → github.com/YLifeOnlyOnce/dsh-inline-visuals
2. > Why not let the model emit SVG/HTML? Because it must be replayable and theme-safe.
   > The model emits *data*; the plugin renders with host theme tokens. Refresh, reopen, fork — same card.
   > Non-Web clients get a compact text fallback.
3. > Install: `plugin_manager install_bundle @oi-yao/dsh-inline-visuals` · one-file runtime
   > (Chart.js inlined, React external) · 12 tests · CI + npm provenance.
   > Feedback welcome: what should v0.3 add — heatmap, flow or sankey?

**Reddit / HN / forum**

> **A DSH plugin that turns model output into 11 kinds of replayable visuals**
>
> DSH's tool results are durable session events, so I built `show_visual`: the model submits a small
> declarative spec (7 Chart.js kinds, plus compare tables, timelines, gantt and KPI tiles), the Host
> persists it via `output.presentationMeta`, and the Client renders a themed card in
> `tool.call.toolview`. Because the data lives in the session log, refreshing, reopening or forking
> renders the same visual without another model call. Non-Web clients get a text fallback.
> The spec is data, not code. `src/` + esbuild + node:test + CI, MIT.
> Repo: github.com/YLifeOnlyOnce/dsh-inline-visuals — feedback welcome on what v0.3 should add.
