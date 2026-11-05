/* SPDX-License-Identifier: MIT */

import { KINDS, PALETTES } from './limits.js'
import { findPreviousSpec } from './history.js'
import { normalize } from './normalize.js'
import { applyPatch } from './patch.js'
import { renderText } from './text.js'

export const name = 'inline-visuals'
export const inject = ['tools']

const DESCRIPTION =
  'Render a small, self-contained visual inside the conversation. Kinds: bar, line, area (chart), '
  + 'pie, doughnut, scatter, radar, waterfall; compare (table), timeline, gantt, heatmap, metrics (KPI tiles). '
  + 'Use `style` for presentation variants (horizontal/stacked bars, stepped lines, palettes, height, '
  + 'data labels, legends). To revise an existing visual, call edit_visual with a partial patch instead '
  + 'of re-sending the whole spec.'

const DATA_DESCRIPTION =
  'bar/line/area/radar: { labels: string[], series: [{ name, values: number[] }], unit?: string }. '
  + 'pie/doughnut: { slices: [{ label, value }], unit?: string }. '
  + 'scatter: { points: [{ x, y, label? }], xLabel?, yLabel? }. '
  + 'waterfall: { labels: string[], values: number[], unit?, totalLabel? } (values are deltas). '
  + 'heatmap: { rows: string[], columns: string[], values: number[][], unit? }. '
  + 'compare: { columns: string[], rows: string[][] }. '
  + 'timeline: { items: [{ at?, label, detail? }] }. '
  + 'gantt: { tasks: [{ label, start, end, group? }], unit?: string }. '
  + 'metrics: { items: [{ label, value, delta?, trend?: "up"|"down"|"flat" }], unit?: string }.'

const STYLE_DESCRIPTION =
  'Presentation-only options. palette: default|mono|cool|warm|success. legend: auto|bottom|top|none. '
  + 'height: 160–420. density: compact|normal. values: draw data labels. grid: show grid lines. '
  + 'orientation: vertical|horizontal (bar). stacked: stack series (bar/line/area). '
  + 'curve: linear|smooth|step (line/area). points: draw point markers. trendLine: linear fit (scatter).'

const STYLE_PARAMETERS = {
  type: 'object',
  additionalProperties: false,
  description: STYLE_DESCRIPTION,
  properties: {
    palette: { type: 'string', enum: PALETTES },
    legend: { type: 'string', enum: ['auto', 'bottom', 'top', 'none'] },
    height: { type: 'integer', description: 'Card chart height in px (160–420).' },
    density: { type: 'string', enum: ['compact', 'normal'] },
    values: { type: 'boolean' },
    grid: { type: 'boolean' },
    orientation: { type: 'string', enum: ['vertical', 'horizontal'] },
    stacked: { type: 'boolean' },
    curve: { type: 'string', enum: ['linear', 'smooth', 'step'] },
    points: { type: 'boolean' },
    trendLine: { type: 'boolean' },
  },
}

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
        style: STYLE_PARAMETERS,
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
    async execute(args) {
      return normalize(args)
    },
    presentCall(args) {
      const kind = args !== null && typeof args === 'object' && typeof args.kind === 'string' ? args.kind : 'visual'
      return { card: 'generic', title: `Render ${kind}`, kind: 'other', rawInput: args }
    },
  }), 'inline-visuals: show_visual tool')

  ctx.effect(() => ctx.tools.register({
    name: 'edit_visual',
    description:
      'Revise the most recent visual in this session (or one specific call id) by patching its spec. '
      + 'Pass only the fields to change: nested objects merge, arrays replace, null deletes a key. '
      + 'Use this instead of calling show_visual again with the entire spec.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['patch'],
      properties: {
        patch: {
          type: 'object',
          description:
            'Partial spec: any of kind, title, subtitle, note, style or data. '
            + 'Example: { "style": { "orientation": "horizontal", "stacked": true } } '
            + 'or { "data": { "labels": [...] } }.',
        },
        target: {
          type: 'string',
          description: 'Optional tool call id of the visual to edit; omit to edit the latest visual.',
        },
      },
    },
    output: {
      schema: { type: 'object' },
      render: (_args, value) => [{ type: 'text', text: renderText(value) }],
      presentationMeta: (_args, value) => value,
    },
    async execute(args, exec) {
      if (!exec.agent) throw new Error('edit_visual requires an owning agent session')
      const previous = findPreviousSpec(exec.agent.session, args.target)
      if (previous === undefined) {
        throw new Error('no previous visual in this session; call show_visual first')
      }
      return normalize(applyPatch(previous, args.patch))
    },
    presentCall(args) {
      return { card: 'generic', title: 'Edit visual', kind: 'other', rawInput: args }
    },
  }), 'inline-visuals: edit_visual tool')
}
