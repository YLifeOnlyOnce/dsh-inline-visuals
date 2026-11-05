# Inline Visuals

**English** · [简体中文](README.zh.md)

![Inline Visuals banner](docs/banner.png)

### Charts your agent can draw — and your session can replay.

A plugin for [DeepSeek Harness](https://deepseek-harness.github.io/deepseek-harness/) that turns
numbers into pictures **inside the conversation**: bar and line charts, comparison tables, timelines,
gantt, heatmaps, flows and KPI tiles — 14 kinds, with styles, exports and click-to-ask.

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![dsh](https://img.shields.io/badge/DeepSeek%20Harness-0.2.1--rc.3-1f6feb.svg)](https://deepseek-harness.github.io/deepseek-harness/)
[![kinds](https://img.shields.io/badge/kinds-14-0a6b3d.svg)](#what-it-can-draw)
[![ci](https://github.com/YLifeOnlyOnce/dsh-inline-visuals/actions/workflows/ci.yml/badge.svg)](https://github.com/YLifeOnlyOnce/dsh-inline-visuals/actions/workflows/ci.yml)

![fourteen visual kinds](docs/demo.png)

## Why you'll like it

- **See it, don't read it.** "Three caching strategies, compared" becomes a card you scan in two seconds.
- **It stays.** The card is stored in the session log — refresh, reopen, branch the session, it is still there.
- **Ask, don't retype.** Click any data point, get a one-click follow-up prompt in your composer.
- **Change it by talking.** "Make it horizontal and stacked, with labels." The agent patches the chart
  with `edit_visual` instead of redrawing everything.
- **Native and safe.** Follows the host theme (light/dark, English/Chinese). The model sends *data*,
  never HTML or JavaScript.
- **Made to share.** Copy JSON/CSV, export PNG or SVG.

## Install in 30 seconds

Inside a DSH session, paste one line:

```text
plugin_manager({ action: "install_bundle", target: "dsh-inline-visuals" })
```

No clone, no configuration. You should see `show_visual` (and `edit_visual`) among your agent's tools.

> Requires DeepSeek Harness `v0.2.1-rc.3` or newer. Prefer source? Use
> `github:YLifeOnlyOnce/dsh-inline-visuals`, or point Plugin Manager at a local clone
> (see the [technical reference](docs/reference.md)).

## Try it

Just talk to your agent:

> **"Compare three caching strategies — hit rate, memory and complexity — as a chart."**

> **"Turn that into a horizontal stacked bar, and add value labels."**

> **"Draw our release pipeline as a flow."**

> **"Show last week's traffic as a heatmap."**

## What it can draw

| | |
|---|---|
| **Charts** | bar · line · area · pie · doughnut · scatter · radar · waterfall |
| **Everything else** | compare table · timeline · gantt · heatmap · flow · KPI tiles |

Every visual accepts presentation **styles**: horizontal or stacked bars, stepped lines, data labels,
legends, grids, five palettes, height and density, scatter trend lines.

![before and after](docs/before-after.png)

## How it works (in one breath)

The model sends a small, declarative spec → the plugin validates and stores it on the tool result →
your client renders it with the host's theme. Because the data lives in the session log, replays need
no extra model call.

## FAQ

**Do I need to configure anything?** No. Install and ask.

**Where do the cards live?** In the session log (`tool/result.meta`), not in a separate file.

**Does it send my data anywhere?** No. The plugin performs no network calls; the model already sees
what you typed.

**Can I get the numbers out?** Copy as JSON or CSV; charts export as PNG; hand-drawn cards as SVG.

**Which kinds are interactive?** Click-to-ask works on chart kinds (canvas). More surfaces are on the
roadmap.

**Text-only clients?** They receive a compact text summary instead of the card — nothing is lost.

## Under the hood

- 33 tests (`node:test`), CI on every push, tag-driven npm release with provenance.
- ~26 KB host half, one self-contained browser file (~214 KB, Chart.js inlined, React shared with the host).
- Spec `version: 3` is stable; v1/v2 specs still render.

Full parameter reference, limits and development notes: **[docs/reference.md](docs/reference.md)**.
Changelog: [CHANGELOG.md](CHANGELOG.md). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 YLifeOnlyOnce
