# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-11-06

### Changed

- **Package renamed** from `@community/dsh-inline-visuals` to `@oi-yao/dsh-inline-visuals`,
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
