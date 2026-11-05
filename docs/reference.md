# Technical reference · Inline Visuals

> User-facing overview: [English README](../README.md) · [中文 README](../README.zh.md).
> This page is the complete reference for the spec, tools, limits and development flow.

## Install

```text
plugin_manager({ action: "install_bundle", target: "dsh-inline-visuals" })
```

Also works from GitHub (`github:YLifeOnlyOnce/dsh-inline-visuals`) or a local clone.
Requirements: DSH ≥ `v0.2.1-rc.3`.
Host module generations load on process start; client changes need a page refresh.

## Tools

### `show_visual`

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `kind` | string | yes | one of the 18 kinds below |
| `title` | string | yes | ≤ 120 chars |
| `subtitle` | string | no | ≤ 160 chars |
| `note` | string | no | one-sentence takeaway |
| `style` | object | no | presentation-only options (below) |
| `data` | object | yes | per-kind shape, see below |

### `edit_visual`

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `patch` | object | yes | partial spec: `title` / `subtitle` / `note` / `kind` / `style` / `data` |
| `target` | string | no | tool call id; omit to edit the latest visual in the session |

Patch semantics: nested objects merge, arrays replace, `null` deletes a key. The previous spec is read
from the durable `tool/result.meta`, so no data is re-sent and replay stays intact.

## Kinds and `data` shapes

| kind | Requires | `data` shape |
|---|---|---|
| `bar` `line` `area` `radar` | yes | `{ labels: string[], series: [{ name, values: number[] }], unit?: string }` |
| `pie` `doughnut` | yes | `{ slices: [{ label, value }], unit?: string }` |
| `scatter` | yes | `{ points: [{ x, y, label? }], xLabel?, yLabel? }` |
| `waterfall` | yes | `{ labels: string[], values: number[], unit?, totalLabel? }` (values are deltas) |
| `heatmap` | yes | `{ rows: string[], columns: string[], values: number[][], unit? }` |
| `flow` | yes | `{ nodes: [{ id, label, detail? }], edges: [{ from, to, label? }] }` — must be a DAG |
| `curve` | yes | `{ points: [{ x, y, label? }], auc?: number, xLabel?, yLabel? }` — ROC/PR/calibration |
| `histogram` | yes | `{ values: number[], bins?: number }` (bins default 10, max 30) |
| `confusion` | yes | `{ labels: string[], matrix: number[][] }` — square, row = true class |
| `leaderboard` | yes | `{ metrics: [{ label, better?: "up"|"down", unit? }], rows: [{ name, values: number[] }] }` |
| `compare` | yes | `{ columns: string[], rows: string[][] }` |
| `timeline` | yes | `{ items: [{ at?, label, detail? }] }` |
| `gantt` | yes | `{ tasks: [{ label, start, end, group? }], unit?: string }` |
| `metrics` | yes | `{ items: [{ label, value, delta?, trend?: "up"|"down"|"flat" }], unit?: string }` |

## `style`

| Field | Values | Effect |
|---|---|---|
| `orientation` | `vertical` / `horizontal` | bar direction |
| `stacked` | boolean | stack bar/line/area series |
| `curve` | `linear` / `smooth` / `step` | line shape |
| `points` | boolean | draw data points |
| `values` | boolean | draw value labels |
| `legend` | `auto` / `bottom` / `top` / `none` | legend |
| `grid` | boolean | grid lines |
| `palette` | `default` / `mono` / `cool` / `warm` / `success` | token-derived palettes |
| `height` | 160–420 | chart height |
| `density` | `compact` / `normal` | card density |
| `trendLine` | boolean | linear fit for scatter |
| `xScale` / `yScale` | `linear` / `log` | log axes (training curves, scaling laws); falls back to linear when values are non-positive |
| `smoothing` | 0–0.9 | EMA smoothing for noisy line/area series (presentation only) |
| `errorBars` | boolean | draw `series[].errors` whiskers |
| `baseline` | boolean | draw the y=x diagonal (ROC) |

## Limits

`labels` ≤ 40, `series` ≤ 6 (with optional `errors`), `rows` ≤ 30, `columns` ≤ 8, `items` ≤ 30,
`tasks` ≤ 20, `metrics` ≤ 12, `slices` ≤ 12, `points` ≤ 240, heatmap 12×12, confusion 12×12,
histogram 2000 values, leaderboard 20 rows × 10 metrics, flow nodes ≤ 20 / edges ≤ 40.
Oversized input is clipped; the persisted meta should stay under ~32 KB.

## Design

```
model → show_visual(spec) → Host normalize/clip → output.presentationMeta
      → tool/result.meta in the session log → Client tool.call.toolview renders the card
```

- The spec is **data, not code**: no HTML/JS execution, no external URLs.
- Cards derive from the session log, so refresh / reopen / fork render the same card without another
  model call. v1/v2 specs remain readable after upgrades.
- Colors come from `--dsw-alias-*` theme tokens; copy goes through the client locale service.
- Non-Web clients receive a compact text fallback from `src/host/text.js`.

## Development

```bash
npm ci
npm test        # node:test suites
npm run build   # regenerates index.js (ESM) and client.js (single browser file)
npm run check   # build + test
```

`index.js` / `client.js` are generated but committed: Plugin Manager links the directory and must run
without a build step. CI fails when artifacts drift from `src/`.

```
src/host/      normalize, style validation, patch merge, history, text fallback
src/client/    theme, Chart.js config, cards (SVG/HTML), locale
scripts/       build.mjs (esbuild), demo.mjs (docs image)
tests/         normalize, style, text, chart-config, patch, history, csv, follow-up, bundle smoke
```

Release: [RELEASING.md](../RELEASING.md) · changelog: [CHANGELOG.md](../CHANGELOG.md) ·
verification: [VERIFICATION.md](../VERIFICATION.md).

## License

[MIT](../LICENSE)
