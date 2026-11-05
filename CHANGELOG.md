# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-06

First stable release. The spec format (`version: 3`), the two tools (`show_visual`, `edit_visual`)
and the style vocabulary below are treated as stable; older specs (v1/v2) remain replayable.

### Added

- **`flow` kind**: layered DAG with labeled edges (agent pipelines, approval flows, build graphs);
  cycles and unknown node references are rejected at normalization time. 14 kinds total.
- **Click-to-ask**: clicking a chart data point shows the selected value and inserts a follow-up
  prompt into the composer (`buildFollowUp`), so users can drill into what they see without retyping.
- **CSV copy** for every tabular kind and **SVG export** for the hand-drawn cards.
- **Reduced motion**: `prefers-reduced-motion` disables chart animations.
- Accessibility: canvas/ARIA labels, `title` tooltips on SVG marks, native table semantics.

### Changed

- `ChartCanvas` now keys on the full spec including `style`, so `edit_visual` style patches rerender
  (previously a style-only patch was ignored by an existing chart).
- Test suite grew to 32 cases (flow validation, CSV, follow-up prompts, style-aware configs).

### Stability

- Public contract: spec `version: 3`; tools and style vocabulary are covered by tests and documented
  in README. Breaking changes will bump the major version and keep older specs renderable.

## [0.3.0] - 2026-11-06

### Added

- **New kinds**: `waterfall` (floating-bar profit bridge) and `heatmap` (matrix with token-derived
  color intensity); 13 kinds total.
- **`style` block** on every visual: `orientation` (horizontal bars), `stacked`, `curve`
  (linear/smooth/step), `points`, `values` (data labels), `legend`, `grid`, `palette`
  (`default/mono/cool/warm/success`), `height` (160–420), `density` (compact/normal), `trendLine`
  (scatter linear fit). Style is presentation-only and persisted with the spec.
- **`edit_visual` tool**: the agent can revise the latest visual (or a specific call id) by sending
  only a patch — nested objects merge, arrays replace, `null` deletes. It reads the previous spec
  from the session log, so no data is re-sent and replay stays intact.
- Client renders `edit_visual` cards with the same renderer as `show_visual`.

### Changed

- Spec version is now `3`; the renderer still accepts v1/v2 specs so historical sessions replay.
- Test suite grew to 26 cases (styles, patch merge, history lookup, tool registration, Chart.js variants).

## [0.2.0] - 2026-11-06

### Changed

- **Package renamed** from `@community/dsh-inline-visuals` to `dsh-inline-visuals`,
  so it can be installed directly from npm (`plugin_manager install_bundle`).
- Publishing pipeline: tag-triggered GitHub Actions workflow with tests, artifact freshness check,
  `npm publish --provenance`, and a GitHub Release carrying the tarball (see `RELEASING.md`).

### Added

- **Seven Chart.js kinds**: `bar`, `line`, `area`, `pie`, `doughnut`, `scatter`, `radar`
  (canvas, theme-aware, tooltips, legend, animations, PNG export).
- **Four custom kinds**: `compare` (table), `timeline`, `gantt` (SVG), `metrics` (KPI tiles).
- **Text fallback**: the model-facing tool output is now a compact readable summary
  (list / Markdown table) so TUI clients, exports and logs stay useful.
- **PNG export** for canvas kinds, plus the existing copy-data / view-data actions.
- **Engineering**: `src/` layout, esbuild build (`scripts/build.mjs`), `node:test` suites,
  CI workflow (build + tests + artifact freshness), CHANGELOG, CONTRIBUTING, editorconfig.

### Changed

- Client artifact is now generated: Chart.js is bundled, React stays external from the host
  module table (`requires` the host loader).
- Spec version bumped to `2`; the renderer still accepts `version: 1` specs so historical
  sessions keep replaying.
- `show_visual` parameter description and per-kind `data` shapes expanded.

## [0.1.0] - 2026-11-06

### Added

- Initial release: `bar`, `line`, `compare`, `timeline`, theme tokens, en/zh copy,
  deterministic tests, install verification.
