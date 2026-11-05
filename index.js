/* SPDX-License-Identifier: MIT */
/**
 * Host half of `@community/dsh-inline-visuals`.
 *
 * Registers one model-facing tool, `show_visual`, whose canonical output is a small
 * declarative spec persisted by the Host on the `tool/result` event. The Client half
 * (`client.js`) renders that spec in the `tool.call.toolview` slot keyed by the tool name.
 *
 * The spec is data, never code: nothing here evaluates model text, and the tool is
 * read-only, so replay, fork, and resume derive the visual from the session log.
 * @module @community/dsh-inline-visuals
 */

export const name = 'inline-visuals'
export const inject = ['tools']

/** Visual kinds the renderer understands. */
const KINDS = ['bar', 'line', 'compare', 'timeline']

/** Upper bounds that keep a visual readable and its persisted meta small. */
const LIMITS = {
  labels: 40,
  series: 6,
  rows: 30,
  columns: 8,
  items: 30,
  text: 240,
}

function str(value, field, limit = LIMITS.text) {
  if (typeof value !== 'string') throw new TypeError(`${field} must be a string`)
  const trimmed = value.trim()
  if (trimmed.length === 0) throw new TypeError(`${field} must not be empty`)
  return trimmed.length > limit ? `${trimmed.slice(0, limit)}…` : trimmed
}

function optStr(value, field, limit = LIMITS.text) {
  if (value === undefined || value === null) return undefined
  return str(value, field, limit)
}

function finite(value, field) {
  const n = typeof value === 'string' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new TypeError(`${field} must be a finite number`)
  return n
}

function normalizeCompare(data) {
  if (!Array.isArray(data.columns) || !Array.isArray(data.rows)) {
    throw new TypeError('compare.data needs `columns` and `rows` arrays')
  }
  const columns = data.columns.slice(0, LIMITS.columns).map((c, i) => str(c, `columns[${i}]`, 60))
  if (columns.length === 0) throw new TypeError('compare.data.columns must not be empty')
  const rows = data.rows.slice(0, LIMITS.rows).map((row, rowIndex) => {
    if (!Array.isArray(row)) throw new TypeError(`rows[${rowIndex}] must be an array`)
    return row.slice(0, columns.length).map((cell, i) => String(cell).slice(0, LIMITS.text))
  })
  return { columns, rows }
}

function normalizeSeries(data) {
  if (!Array.isArray(data.labels) || !Array.isArray(data.series)) {
    throw new TypeError(`${data.kind ?? 'chart'}.data needs \`labels\` and \`series\` arrays`)
  }
  const labels = data.labels.slice(0, LIMITS.labels).map((l, i) => str(l, `labels[${i}]`, 60))
  if (labels.length === 0) throw new TypeError('data.labels must not be empty')
  const series = data.series.slice(0, LIMITS.series).map((entry, index) => {
    if (entry === null || typeof entry !== 'object') throw new TypeError(`series[${index}] must be an object`)
    if (!Array.isArray(entry.values)) throw new TypeError(`series[${index}].values must be an array`)
    return {
      name: str(entry.name, `series[${index}].name`, 60),
      values: entry.values.slice(0, labels.length).map((v, i) => finite(v, `series[${index}].values[${i}]`)),
    }
  })
  const unit = optStr(data.unit, 'data.unit', 16)
  return {
    labels,
    series,
    ...(unit === undefined ? {} : { unit }),
  }
}

function normalizeTimeline(data) {
  if (!Array.isArray(data.items)) throw new TypeError('timeline.data needs an `items` array')
  const items = data.items.slice(0, LIMITS.items).map((item, index) => {
    if (item === null || typeof item !== 'object') throw new TypeError(`items[${index}] must be an object`)
    const at = optStr(item.at, `items[${index}].at`, 40)
    const detail = optStr(item.detail, `items[${index}].detail`)
    return {
      ...(at === undefined ? {} : { at }),
      label: str(item.label, `items[${index}].label`, 120),
      ...(detail === undefined ? {} : { detail }),
    }
  })
  return { items }
}

/**
 * Validate and clip one model-supplied spec into the canonical persisted value.
 * @param input - frozen tool arguments.
 * @returns the normalized spec declared by the tool's output schema.
 */
function normalize(input) {
  if (input === null || typeof input !== 'object') throw new TypeError('show_visual expects one object argument')
  const kind = input.kind
  if (!KINDS.includes(kind)) throw new TypeError(`kind must be one of ${KINDS.join(', ')}`)
  const title = str(input.title, 'title', 120)
  const data = input.data
  if (data === null || typeof data !== 'object') throw new TypeError('data must be an object')
  const normalized = kind === 'compare'
    ? normalizeCompare(data)
    : kind === 'timeline'
      ? normalizeTimeline(data)
      : normalizeSeries(data)

  const subtitle = optStr(input.subtitle, 'subtitle', 160)
  const note = optStr(input.note, 'note')
  return {
    version: 1,
    kind,
    title,
    ...(subtitle === undefined ? {} : { subtitle }),
    ...(note === undefined ? {} : { note }),
    data: normalized,
  }
}

/**
 * Register the tool on activation; disposal removes it with the bundle row.
 * @param ctx - plugin context.
 */
export function apply(ctx) {
  ctx.effect(() => ctx.tools.register({
    name: 'show_visual',
    description:
      'Render a small, self-contained visual inside the conversation: a bar or line chart, a comparison '
      + 'table, or a timeline. Use it when structured numbers or steps are clearer as a picture; keep the '
      + 'spec small, put the takeaway in `note`, and do not use it for plain prose.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'title', 'data'],
      properties: {
        kind: { type: 'string', enum: KINDS, description: 'Visual form to render.' },
        title: { type: 'string', description: 'Short title shown above the visual.' },
        subtitle: { type: 'string', description: 'Optional secondary line.' },
        note: { type: 'string', description: 'Optional one-sentence takeaway shown below.' },
        data: {
          type: 'object',
          description:
            'bar/line: { labels: string[], series: [{ name, values: number[] }], unit?: string }. '
            + 'compare: { columns: string[], rows: string[][] }. '
            + 'timeline: { items: [{ at?: string, label: string, detail?: string }] }.',
        },
      },
    },
    output: {
      // The canonical value is the normalized spec; clipping lives in execute().
      schema: { type: 'object' },
      render: (_args, value) => [{
        type: 'text',
        text: `Rendered a ${value.kind} visual (${value.title}).`,
      }],
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
