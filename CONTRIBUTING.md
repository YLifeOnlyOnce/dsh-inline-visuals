# Contributing

Thanks for taking a look! This is a small DeepSeek Harness plugin; keep changes focused.

## Setup

```bash
npm ci
npm run build     # regenerates index.js and client.js from src/
npm test          # node:test suites for host normalizer, text fallback, chart config
```

`index.js` and `client.js` are **generated artifacts** and committed on purpose: the plugin
manager links the directory, so the installed bundle must work without a build step.
After changing `src/`, run `npm run build` and commit both artifacts — CI fails when they
are stale.

## Rules

- **Spec is data, never code.** Do not execute model-provided strings, do not load external
  URLs from a spec. Keep normalization/clipping in `src/host/normalize.js`.
- **No new session event types.** State is derived from the tool result (`tool/result.meta`);
  replay must keep working.
- **Theme tokens only.** Client colors come from `--dsw-alias-*`; do not hard-code brand
  colors (fallbacks in `src/client/theme.js` are the only exception).
- **Host ↔ Client boundary**: the Host normalizes and persists; the Client only renders.
  Text fallback (`src/host/text.js`) must stay in sync when a kind is added.

## Adding a visual kind

1. `src/host/limits.js`: add the kind name.
2. `src/host/normalize.js`: add a normalizer and register it.
3. `src/host/text.js`: add a text fallback.
4. `src/client/chart-config.js` (Chart.js kind) or `src/client/cards/*.js` (custom kind):
   render it, and wire it in `src/client/cards/InlineVisual.js`.
5. Add tests (normalization, text fallback, config shape) and a doc row in `README.md`.
6. `npm run build && npm test`.

## Pull requests

- Title: `feat: <kind>` / `fix: <what>` / `docs: <what>`.
- Include a screenshot for visible changes (the repo has `docs/demo.png`; regenerate it with
  `node scripts/demo.mjs` if the kinds grid changed).
- Keep the diff small; one kind or one fix per PR.
