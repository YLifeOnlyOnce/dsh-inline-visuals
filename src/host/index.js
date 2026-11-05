/* SPDX-License-Identifier: MIT */

import { KINDS } from './limits.js'
import { normalize } from './normalize.js'
import { renderText } from './text.js'

export const name = 'inline-visuals'
export const inject = ['tools']

const DESCRIPTION =
  'Render a small, self-contained visual inside the conversation. Kinds: bar, line, area (chart), '
  + 'pie, doughnut, scatter, radar; compare (table), timeline, gantt, metrics (KPI tiles). '
  + 'Use it when structured numbers or steps are clearer as a picture; keep the spec small and put '
  + 'the takeaway in `note`. Do not use it for plain prose.'

const DATA_DESCRIPTION =
  'bar/line/area/radar: { labels: string[], series: [{ name, values: number[] }], unit?: string }. '
  + 'pie/doughnut: { slices: [{ label, value }], unit?: string }. '
  + 'scatter: { points: [{ x, y, label? }], xLabel?, yLabel? }. '
  + 'compare: { columns: string[], rows: string[][] }. '
  + 'timeline: { items: [{ at?, label, detail? }] }. '
  + 'gantt: { tasks: [{ label, start, end, group? }], unit?: string }. '
  + 'metrics: { items: [{ label, value, delta?, trend?: "up"|"down"|"flat" }], unit?: string }.'

export function apply(ctx) {
  ctx.effect(() => ctx.tools.register({
    name: 'show_visual',
    description: DESCRIPTION,
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'title', 'data'],
      properties: {
        kind: { type: 'string', enum: KINDS, description: 'Visual form to render.' },
        title: { type: 'string', description: 'Short title shown above the visual.' },
        subtitle: { type: 'string', description: 'Optional secondary line.' },
        note: { type: 'string', description: 'Optional one-sentence takeaway shown below.' },
        data: { type: 'object', description: DATA_DESCRIPTION },
      },
    },
    output: {
      // The canonical value is the normalized spec; clipping lives in execute().
      schema: { type: 'object' },
      // Text fallback for clients without the card renderer (and for logs/exports).
      render: (_args, value) => [{ type: 'text', text: renderText(value) }],
      // Persisted on tool/result so the Client renders the same visual on replay.
      presentationMeta: (_args, value) => value,
    },
    execute(args) {
      return Promise.resolve(normalize(args))
    },
    presentCall(args) {
      const kind = args !== null && typeof args === 'object' && typeof args.kind === 'string' ? args.kind : 'visual'
      return { card: 'generic', title: `Render ${kind}`, kind: 'other', rawInput: args }
    },
  }), 'inline-visuals: show_visual tool')
}
